//! activity.rs — Desktop activity monitor for Digital Ghost.
//!
//! Runs a background thread that samples the user's desktop state every
//! POLL_INTERVAL seconds and emits an `activity-update` Tauri event.
//!
//! Detection strategy (no special tools required):
//!   1. Scan /proc/*/comm to build the set of running process names.
//!   2. Match known application names → classify into a Context.
//!   3. Use xdotool (if available) for active window name; fall back to
//!      process-presence heuristic when not available or on pure Wayland.
//!   4. Idle detection via xprintidle (if available) or D-Bus ScreenSaver.
//!
//! The emitted JSON payload is ActivityState (see below).
//! The frontend consumes it via `src/services/activityMonitor.js`.

use serde::Serialize;
use std::collections::HashSet;
use std::fs;
use std::process::Command;
use std::time::{Duration, Instant, SystemTime, UNIX_EPOCH};
use tauri::{AppHandle, Emitter};

/// How often the monitor polls desktop state.
const POLL_SECS: u64 = 5;

/// Idle threshold: if the user hasn't interacted for this many seconds,
/// the context shifts to Idle.
const IDLE_THRESHOLD_SECS: u64 = 120;

/// Long-session threshold: continuous non-idle activity for this many minutes
/// triggers a "concerned" hint for the future mood engine.
const LONG_SESSION_MINS: u64 = 90;

// ─── Data types ───────────────────────────────────────────────────────────────

/// The raw snapshot the monitor emits every poll cycle.
/// Kept intentionally simple — the frontend maps this to Ghost moods.
#[derive(Debug, Clone, Serialize)]
pub struct ActivityState {
    /// Broad category of what the user is doing.
    pub context: String,
    /// Human-readable name of the detected foreground application, if known.
    pub application: String,
    /// Seconds since the monitor started (monotonic, resets on restart).
    pub duration: u64,
    /// True when the user has been idle longer than IDLE_THRESHOLD_SECS.
    pub idle: bool,
    /// Idle time in seconds (best effort; 0 when unavailable).
    pub idle_secs: u64,
    /// Unix timestamp of this snapshot.
    pub timestamp: u64,
    /// True when the current unbroken active session exceeds LONG_SESSION_MINS.
    pub long_session: bool,
}

// ─── Public entry point ───────────────────────────────────────────────────────

/// Spawn the background monitor thread.
/// Safe to call once from `setup()`.
pub fn start_monitor(app: AppHandle) {
    std::thread::spawn(move || run_loop(app));
}

// ─── Main polling loop ────────────────────────────────────────────────────────

fn run_loop(app: AppHandle) {
    let start = Instant::now();
    let mut active_session_start: Option<Instant> = None;

    loop {
        let snapshot = sample(&start, &mut active_session_start);

        // Emit to all open webview windows.
        if let Err(e) = app.emit("activity-update", &snapshot) {
            eprintln!("[activity] emit error: {e}");
        }

        std::thread::sleep(Duration::from_secs(POLL_SECS));
    }
}

// ─── Sampling ─────────────────────────────────────────────────────────────────

fn sample(start: &Instant, active_session_start: &mut Option<Instant>) -> ActivityState {
    let procs = running_process_names();
    let idle_secs = detect_idle_secs();
    let is_idle = idle_secs >= IDLE_THRESHOLD_SECS;

    // Track continuous active session duration.
    if is_idle {
        *active_session_start = None;
    } else if active_session_start.is_none() {
        *active_session_start = Some(Instant::now());
    }

    let long_session = active_session_start
        .map(|t| t.elapsed().as_secs() >= LONG_SESSION_MINS * 60)
        .unwrap_or(false);

    // Try to get focused window name.
    let window_name = detect_active_window();

    // Classify.
    let (context, application) = classify(&window_name, &procs, is_idle);

    ActivityState {
        context,
        application,
        duration: start.elapsed().as_secs(),
        idle: is_idle,
        idle_secs,
        timestamp: unix_now(),
        long_session,
    }
}

// ─── Active window detection ─────────────────────────────────────────────────

/// Try multiple strategies to identify the focused window title.
/// Returns an empty string when nothing works.
fn detect_active_window() -> String {
    // Strategy 1: xdotool (works on X11 and XWayland)
    if let Ok(out) = Command::new("xdotool")
        .args(["getactivewindow", "getwindowname"])
        .output()
    {
        if out.status.success() {
            let name = String::from_utf8_lossy(&out.stdout).trim().to_string();
            if !name.is_empty() {
                return name;
            }
        }
    }

    // Strategy 2: wmctrl (alternative X11 tool)
    if let Ok(out) = Command::new("wmctrl").args(["-l"]).output() {
        if out.status.success() {
            // wmctrl -l lists windows; active window is harder to identify.
            // Skip for now — just use as a signal that X11 is available.
        }
    }

    String::new()
}

// ─── Idle time detection ──────────────────────────────────────────────────────

/// Return idle time in whole seconds. Returns 0 on failure.
fn detect_idle_secs() -> u64 {
    // Strategy 1: xprintidle (reports milliseconds)
    if let Ok(out) = Command::new("xprintidle").output() {
        if out.status.success() {
            if let Ok(ms_str) = std::str::from_utf8(&out.stdout) {
                if let Ok(ms) = ms_str.trim().parse::<u64>() {
                    return ms / 1000;
                }
            }
        }
    }

    // Strategy 2: D-Bus ScreenSaver (GNOME / KDE)
    // gdbus call --session ... (requires $DBUS_SESSION_BUS_ADDRESS)
    if let Ok(out) = Command::new("gdbus")
        .args([
            "call",
            "--session",
            "--dest",
            "org.gnome.Mutter.IdleMonitor",
            "--object-path",
            "/org/gnome/Mutter/IdleMonitor/Core",
            "--method",
            "org.gnome.Mutter.IdleMonitor.GetIdletime",
        ])
        .output()
    {
        if out.status.success() {
            // Returns "(uint64 NNNN,)" where NNNN is milliseconds
            let s = String::from_utf8_lossy(&out.stdout);
            if let Some(ms) = parse_dbus_uint64(&s) {
                return ms / 1000;
            }
        }
    }

    // Strategy 3: org.freedesktop.ScreenSaver
    if let Ok(out) = Command::new("gdbus")
        .args([
            "call",
            "--session",
            "--dest",
            "org.freedesktop.ScreenSaver",
            "--object-path",
            "/org/freedesktop/ScreenSaver",
            "--method",
            "org.freedesktop.ScreenSaver.GetSessionIdleTime",
        ])
        .output()
    {
        if out.status.success() {
            let s = String::from_utf8_lossy(&out.stdout);
            if let Some(secs) = parse_dbus_uint64(&s) {
                return secs; // this interface returns seconds
            }
        }
    }

    0
}

/// Parse a uint64 value out of a gdbus output string like `(uint64 12345,)`.
fn parse_dbus_uint64(s: &str) -> Option<u64> {
    // Trim and strip outer parens/whitespace
    let s = s.trim().trim_matches('(').trim_matches(')').trim();
    // Could be "uint64 12345," or just "12345,"
    let token = s
        .split_whitespace()
        .last()?
        .trim_matches(',')
        .trim_matches(')');
    token.parse::<u64>().ok()
}

// ─── Process scanning ─────────────────────────────────────────────────────────

/// Read /proc/*/comm to get the set of running process names.
fn running_process_names() -> HashSet<String> {
    let mut names = HashSet::new();
    let Ok(entries) = fs::read_dir("/proc") else {
        return names;
    };
    for entry in entries.flatten() {
        let path = entry.path();
        // Only numeric directories (PIDs)
        if path
            .file_name()
            .and_then(|n| n.to_str())
            .map(|n| n.chars().all(|c| c.is_ascii_digit()))
            .unwrap_or(false)
        {
            let comm_path = path.join("comm");
            if let Ok(comm) = fs::read_to_string(&comm_path) {
                names.insert(comm.trim().to_lowercase());
            }
        }
    }
    names
}

// ─── Classification ───────────────────────────────────────────────────────────

/// Maps (window_title, running_processes, is_idle) → (context, app_label).
///
/// Add new entries here as you want to recognise more applications.
/// Order matters: the first match wins.
fn classify(
    window_name: &str,
    procs: &HashSet<String>,
    is_idle: bool,
) -> (String, String) {
    if is_idle {
        return ("idle".into(), "".into());
    }

    let win_lower = window_name.to_lowercase();

    // ── Window-title based (most precise when xdotool works) ────────────────
    if !win_lower.is_empty() {
        // Coding editors / IDEs
        if matches_any(
            &win_lower,
            &[
                "visual studio code",
                "vscode",
                "code",
                "nvim",
                "neovim",
                "vim",
                "emacs",
                "jetbrains",
                "intellij",
                "pycharm",
                "clion",
                "webstorm",
                "android studio",
                "cursor",
                "zed",
                "sublime",
                "helix",
                "lapce",
            ],
        ) {
            let app = extract_app_name(&win_lower, "Editor");
            return ("coding".into(), app);
        }

        // Terminals
        if matches_any(
            &win_lower,
            &[
                "terminal",
                "konsole",
                "alacritty",
                "kitty",
                "gnome-terminal",
                "xterm",
                "wezterm",
                "foot",
                "tilix",
                "bash",
                "zsh",
                "fish",
            ],
        ) {
            return ("terminal".into(), "Terminal".into());
        }

        // Browsers
        if matches_any(
            &win_lower,
            &[
                "firefox",
                "chrome",
                "chromium",
                "brave",
                "safari",
                "edge",
                "opera",
                "vivaldi",
                "zen browser",
            ],
        ) {
            let app = if win_lower.contains("firefox") { "Firefox" }
                else if win_lower.contains("chrome") { "Chrome" }
                else if win_lower.contains("brave") { "Brave" }
                else { "Browser" };
            return ("browsing".into(), app.into());
        }

        // Music / media
        if matches_any(
            &win_lower,
            &["spotify", "rhythmbox", "lollypop", "clementine", "vlc", "mpv", "youtube music"],
        ) {
            let app = if win_lower.contains("spotify") { "Spotify" }
                else if win_lower.contains("youtube") { "YouTube Music" }
                else { "Media Player" };
            return ("music".into(), app.into());
        }
    }

    // ── Process-presence fallback (works without xdotool / on Wayland) ──────
    if proc_any(
        procs,
        &[
            "code", "code-oss", "codium", "nvim", "vim", "emacs",
            "idea", "pycharm", "clion", "webstorm", "cursor", "zed",
            "sublime_text", "hx", "lapce",
        ],
    ) {
        let app = if procs.contains("code") || procs.contains("code-oss") {
            "VS Code"
        } else if procs.contains("nvim") {
            "Neovim"
        } else if procs.contains("vim") {
            "Vim"
        } else if procs.contains("emacs") {
            "Emacs"
        } else {
            "Editor"
        };
        return ("coding".into(), app.into());
    }

    if proc_any(
        procs,
        &[
            "alacritty", "kitty", "foot", "wezterm", "gnome-terminal",
            "xterm", "konsole", "tilix", "bash", "zsh", "fish",
        ],
    ) {
        return ("terminal".into(), "Terminal".into());
    }

    if proc_any(procs, &["firefox", "chrome", "chromium", "brave", "opera"]) {
        let app = if procs.contains("firefox") { "Firefox" }
            else if procs.contains("chrome") || procs.contains("chromium") { "Chrome" }
            else { "Browser" };
        return ("browsing".into(), app.into());
    }

    if proc_any(
        procs,
        &["spotify", "rhythmbox", "lollypop", "clementine", "vlc", "mpv"],
    ) {
        return ("music".into(), "Media Player".into());
    }

    ("unknown".into(), "".into())
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

fn matches_any(haystack: &str, needles: &[&str]) -> bool {
    needles.iter().any(|n| haystack.contains(n))
}

fn proc_any(procs: &HashSet<String>, names: &[&str]) -> bool {
    names.iter().any(|n| procs.contains(*n))
}

fn extract_app_name(win_lower: &str, fallback: &str) -> String {
    let editors = [
        ("visual studio code", "VS Code"),
        ("neovim", "Neovim"),
        ("nvim", "Neovim"),
        ("vim", "Vim"),
        ("emacs", "Emacs"),
        ("cursor", "Cursor"),
        ("zed", "Zed"),
        ("sublime", "Sublime Text"),
        ("jetbrains", "JetBrains IDE"),
        ("intellij", "IntelliJ IDEA"),
        ("pycharm", "PyCharm"),
        ("android studio", "Android Studio"),
    ];
    for (pat, label) in &editors {
        if win_lower.contains(pat) {
            return (*label).into();
        }
    }
    fallback.into()
}

fn unix_now() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs())
        .unwrap_or(0)
}

