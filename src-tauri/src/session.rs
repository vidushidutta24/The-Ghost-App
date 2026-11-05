//! session.rs — Persistent session tracker for Digital Ghost.
//!
//! Responsibilities:
//!   - Track when each session starts and ends
//!   - Persist across app restarts / reboots via a JSON file in app_data_dir
//!   - Provide a SessionSnapshot to the frontend at startup so the Ghost can
//!     react to how long the user was away
//!
//! Storage: {app_data_dir}/session.json
//!   e.g. ~/.local/share/digital-ghost/session.json on Linux
//!
//! Heartbeat: a background thread updates last_session_end_secs every 30 s.
//! Even if the app is killed / crashes, the recorded end time is within 30 s
//! of the actual end, which is close enough for the welcome message.

use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;
use std::time::{Duration, SystemTime, UNIX_EPOCH};
use tauri::{AppHandle, Manager};

const HEARTBEAT_SECS: u64 = 30;
const SESSION_FILENAME: &str = "session.json";

// ─── Persisted data ───────────────────────────────────────────────────────────

/// Written to disk on every heartbeat and read on the next startup.
#[derive(Debug, Serialize, Deserialize, Clone, Default)]
pub struct SessionStore {
    pub schema_version: u32,
    /// When the most recent session started (Unix secs).
    pub last_session_start_secs: Option<u64>,
    /// Most recent heartbeat timestamp — used as "session ended at" on next run.
    pub last_session_end_secs: Option<u64>,
    /// Duration of the last *completed* session in seconds.
    pub last_session_duration_secs: Option<u64>,
    /// Total number of sessions ever started.
    pub total_sessions: u64,
}

// ─── Data sent to the frontend ────────────────────────────────────────────────

/// A lightweight snapshot sent to the React app on startup.
/// Timestamps are raw Unix seconds — the JS layer handles display formatting
/// and local-timezone-aware logic (time_of_day, is_first_of_day).
#[derive(Debug, Serialize, Clone)]
pub struct SessionSnapshot {
    /// No previous session on record — this is the very first launch.
    pub is_first_session: bool,
    /// Unix secs when the previous session started.
    pub last_session_start_secs: Option<u64>,
    /// Unix secs of the previous session's last heartbeat (≈ when it ended).
    pub last_session_end_secs: Option<u64>,
    /// How long the previous session lasted, in seconds.
    pub last_session_duration_secs: Option<u64>,
    /// Unix secs when this session started.
    pub current_session_started_at: u64,
    /// Total sessions including the current one.
    pub total_sessions: u64,
}

// ─── Tauri managed state ──────────────────────────────────────────────────────

/// Stored in Tauri's state registry so the command handler can read it.
pub struct SessionState(pub Mutex<SessionSnapshot>);

// ─── File helpers ─────────────────────────────────────────────────────────────

fn session_path(app: &AppHandle) -> Option<PathBuf> {
    app.path()
        .app_data_dir()
        .ok()
        .map(|d| d.join(SESSION_FILENAME))
}

fn read_store(path: &PathBuf) -> SessionStore {
    fs::read_to_string(path)
        .ok()
        .and_then(|s| serde_json::from_str(&s).ok())
        .unwrap_or_default()
}

fn write_store(path: &PathBuf, store: &SessionStore) {
    if let Some(parent) = path.parent() {
        let _ = fs::create_dir_all(parent);
    }
    if let Ok(json) = serde_json::to_string_pretty(store) {
        let _ = fs::write(path, json);
    }
}

fn unix_now() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs())
        .unwrap_or(0)
}

// ─── Public API ───────────────────────────────────────────────────────────────

/// Call once from `setup()`.
/// Reads the previous session, starts a new one in the store, returns the
/// snapshot the frontend needs to generate a welcome message.
pub fn init(app: &AppHandle) -> SessionSnapshot {
    let now = unix_now();
    let path = session_path(app);

    let prev = path
        .as_ref()
        .map(read_store)
        .unwrap_or_default();

    let snapshot = SessionSnapshot {
        is_first_session: prev.total_sessions == 0,
        last_session_start_secs: prev.last_session_start_secs,
        last_session_end_secs: prev.last_session_end_secs,
        last_session_duration_secs: prev.last_session_duration_secs,
        current_session_started_at: now,
        total_sessions: prev.total_sessions + 1,
    };

    // Write the new session header immediately so the heartbeat has something
    // to update.
    if let Some(ref p) = path {
        write_store(p, &SessionStore {
            schema_version: 1,
            last_session_start_secs: Some(now),
            last_session_end_secs: Some(now),
            // Keep last completed session's duration until this session ends.
            last_session_duration_secs: prev.last_session_duration_secs,
            total_sessions: prev.total_sessions + 1,
        });
    }

    snapshot
}

/// Spawn a background thread that keeps `last_session_end_secs` fresh.
/// Must be called after `init()`.
pub fn start_heartbeat(app: AppHandle) {
    let session_start = unix_now();
    std::thread::spawn(move || loop {
        std::thread::sleep(Duration::from_secs(HEARTBEAT_SECS));
        let now = unix_now();
        if let Some(path) = session_path(&app) {
            let mut store = read_store(&path);
            store.last_session_end_secs = Some(now);
            store.last_session_duration_secs = Some(now.saturating_sub(session_start));
            write_store(&path, &store);
        }
    });
}

