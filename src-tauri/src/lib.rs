// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod activity;
mod session;
mod stats;

use std::collections::HashSet;
use std::sync::Mutex;
use tauri::Manager;

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let window = app.get_webview_window("ghost").unwrap();

            // On Linux/Wayland: hide on startup to prevent white flash.
            // Frontend reveals it via show_ghost_window once React has painted.
            #[cfg(target_os = "linux")]
            {
                window.hide().unwrap();
                let w = window.clone();
                std::thread::spawn(move || {
                    std::thread::sleep(std::time::Duration::from_millis(600));
                    let _ = w.show();
                });
            }

            // ── Session Manager ───────────────────────────────────────────────
            // Reads previous session from disk, computes away-time, starts new
            // session entry, then keeps the end-time fresh via a heartbeat.
            let snapshot = session::init(app.handle());
            let current_session_started_at = snapshot.current_session_started_at;
            app.manage(session::SessionState(Mutex::new(snapshot)));
            session::start_heartbeat(app.handle().clone());

            // ── Real Statistics & Screen Time Tracker ─────────────────────────
            let stats_path = stats::stats_path(app.handle());
            let tracker = stats::StatsTracker::new(stats_path, current_session_started_at);
            app.manage(stats::StatsState(Mutex::new(tracker)));

            // ── Activity Monitor ──────────────────────────────────────────────
            // Emits "activity-update" and "dashboard-update" events every 5 s.
            activity::start_monitor(app.handle().clone());

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            show_ghost_window,
            get_session_snapshot,
            get_dashboard_data,
            open_dashboard,
            close_dashboard,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

/// Called from JS once React has mounted and painted — reveals the window
/// without the white flash on Linux/Wayland.
#[tauri::command]
fn show_ghost_window(window: tauri::WebviewWindow) {
    let _ = window.show();
}

/// Returns the session snapshot computed at startup.
#[tauri::command]
fn get_session_snapshot(
    state: tauri::State<session::SessionState>,
) -> session::SessionSnapshot {
    state.0.lock().unwrap().clone()
}

/// Returns real-time dashboard data (screen time, app usages, running apps, hourly breakdown).
#[tauri::command]
fn get_dashboard_data(
    stats_state: tauri::State<stats::StatsState>,
) -> stats::DashboardData {
    let tracker = stats_state.0.lock().unwrap();
    // Quick snapshot with currently recognized running processes
    let procs = scan_basic_procs();
    tracker.get_dashboard_data("", "desktop", false, 0, &procs)
}

/// Shows and maximizes the dedicated Digital Ghost Dashboard window.
#[tauri::command]
fn open_dashboard(app: tauri::AppHandle) {
    if let Some(dashboard_win) = app.get_webview_window("dashboard") {
        let _ = dashboard_win.show();
        let _ = dashboard_win.set_focus();
        let _ = dashboard_win.maximize();
    }
}

/// Hides the Dashboard window and returns focus to the desktop where the Ghost floats.
#[tauri::command]
fn close_dashboard(app: tauri::AppHandle) {
    if let Some(dashboard_win) = app.get_webview_window("dashboard") {
        let _ = dashboard_win.hide();
    }
}

fn scan_basic_procs() -> HashSet<String> {
    let mut names = HashSet::new();
    if let Ok(entries) = std::fs::read_dir("/proc") {
        for entry in entries.flatten() {
            let path = entry.path();
            if path
                .file_name()
                .and_then(|n| n.to_str())
                .map(|n| n.chars().all(|c| c.is_ascii_digit()))
                .unwrap_or(false)
            {
                let comm_path = path.join("comm");
                if let Ok(comm) = std::fs::read_to_string(&comm_path) {
                    names.insert(comm.trim().to_lowercase());
                }
            }
        }
    }
    names
}
