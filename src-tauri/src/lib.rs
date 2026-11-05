// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod activity;
mod session;

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
            app.manage(session::SessionState(Mutex::new(snapshot)));
            session::start_heartbeat(app.handle().clone());

            // ── Activity Monitor ──────────────────────────────────────────────
            // Emits "activity-update" events every 5 s during the session.
            activity::start_monitor(app.handle().clone());

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            show_ghost_window,
            get_session_snapshot,
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
/// The JS layer derives display-friendly fields (time_of_day, is_first_of_day)
/// from these raw timestamps using the browser's local timezone.
#[tauri::command]
fn get_session_snapshot(
    state: tauri::State<session::SessionState>,
) -> session::SessionSnapshot {
    state.0.lock().unwrap().clone()
}
