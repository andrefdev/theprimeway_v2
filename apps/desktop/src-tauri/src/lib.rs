use std::sync::Mutex;
use tauri::{Manager, AppHandle, WebviewWindow, WindowEvent};
use tauri::menu::{Menu, MenuItem};
use tauri::tray::{TrayIconBuilder, TrayIconEvent};
use tauri_plugin_positioner::{WindowExt, Position};
use tauri_plugin_global_shortcut::{GlobalShortcutExt, ShortcutState, Shortcut, Code, Modifiers};

// ─── Shared app state ───────────────────────────────────────────────────────

pub struct AppState {
    pub auth_token: Mutex<Option<String>>,
    pub refresh_token: Mutex<Option<String>>,
}

// ─── Overlay commands ───────────────────────────────────────────────────────

#[tauri::command]
fn show_overlay(app: AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("overlay") {
        window.show().map_err(|e| e.to_string())?;
        window.set_focus().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
fn hide_overlay(app: AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("overlay") {
        window.hide().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
fn resize_overlay(app: AppHandle, width: u32, height: u32) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("overlay") {
        window
            .set_size(tauri::LogicalSize::new(width, height))
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
fn snap_overlay_to_corner(app: AppHandle, corner: String) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("overlay") {
        let position = match corner.as_str() {
            "top-left" => Position::TopLeft,
            "top-right" => Position::TopRight,
            "bottom-left" => Position::BottomLeft,
            "bottom-right" => Position::BottomRight,
            _ => Position::BottomRight,
        };
        window.move_window(position).map_err(|e| e.to_string())?;
    }
    Ok(())
}

// ─── Auth commands ──────────────────────────────────────────────────────────

#[tauri::command]
fn set_auth_token(
    state: tauri::State<AppState>,
    token: String,
    refresh_token: String,
) -> Result<(), String> {
    *state.auth_token.lock().unwrap() = Some(token);
    *state.refresh_token.lock().unwrap() = Some(refresh_token);
    Ok(())
}

#[tauri::command]
fn get_auth_token(state: tauri::State<AppState>) -> Option<String> {
    state.auth_token.lock().unwrap().clone()
}

#[tauri::command]
fn clear_auth_token(state: tauri::State<AppState>) -> Result<(), String> {
    *state.auth_token.lock().unwrap() = None;
    *state.refresh_token.lock().unwrap() = None;
    Ok(())
}

// ─── Tray menu builder ──────────────────────────────────────────────────────

fn build_tray_menu(app: &AppHandle) -> tauri::Result<Menu<tauri::Wry>> {
    let toggle_overlay = MenuItem::with_id(app, "toggle_overlay", "Toggle Overlay", true, None::<&str>)?;
    let open_app = MenuItem::with_id(app, "open_app", "Open ThePrimeWay", true, None::<&str>)?;
    let start_timer = MenuItem::with_id(app, "start_timer", "Start Pomodoro", true, None::<&str>)?;
    let separator = tauri::menu::PredefinedMenuItem::separator(app)?;
    let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;

    Menu::with_items(app, &[&toggle_overlay, &open_app, &start_timer, &separator, &quit])
}

// ─── Main pub fn run ────────────────────────────────────────────────────────

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            if let Some(w) = app.get_webview_window("main") {
                let _ = w.show();
                let _ = w.set_focus();
            }
        }))
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            None,
        ))
        .plugin(tauri_plugin_positioner::init())
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .plugin(tauri_plugin_deep_link::init())
        .manage(AppState {
            auth_token: Mutex::new(None),
            refresh_token: Mutex::new(None),
        })
        .invoke_handler(tauri::generate_handler![
            show_overlay,
            hide_overlay,
            resize_overlay,
            snap_overlay_to_corner,
            set_auth_token,
            get_auth_token,
            clear_auth_token,
        ])
        .setup(|app| {
            // On macOS, set app activation policy to accessory
            #[cfg(target_os = "macos")]
            app.set_activation_policy(tauri::ActivationPolicy::Accessory);

            // Snap overlay to bottom-right at startup
            if let Some(overlay) = app.get_webview_window("overlay") {
                let _ = overlay.move_window(Position::BottomRight);
            }

            // Register global shortcuts
            let app_handle = app.handle().clone();
            app.handle().plugin(
                tauri_plugin_global_shortcut::Builder::new()
                    .with_shortcut(Shortcut::new(Some(Modifiers::CONTROL | Modifiers::SHIFT), Code::KeyO))?
                    .with_shortcut(Shortcut::new(Some(Modifiers::CONTROL | Modifiers::SHIFT), Code::KeyT))?
                    .with_handler(move |app, shortcut, event| {
                        if event.state == ShortcutState::Pressed {
                            // Ctrl+Shift+O: toggle overlay
                            if shortcut.matches(Modifiers::CONTROL | Modifiers::SHIFT, Code::KeyO) {
                                if let Some(w) = app.get_webview_window("overlay") {
                                    if w.is_visible().unwrap_or(false) {
                                        let _ = w.hide();
                                    } else {
                                        let _ = w.show();
                                        let _ = w.set_focus();
                                    }
                                }
                            }
                            // Ctrl+Shift+T: start timer
                            else if shortcut.matches(Modifiers::CONTROL | Modifiers::SHIFT, Code::KeyT) {
                                let _ = app.emit("tray-start-timer", ());
                                if let Some(w) = app.get_webview_window("overlay") {
                                    let _ = w.show();
                                    let _ = w.set_focus();
                                }
                            }
                        }
                    })
                    .build()
            )?;

            // Build and attach tray menu
            let menu = build_tray_menu(app.handle())?;
            TrayIconBuilder::with_id("main-tray")
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .menu_on_left_click(false)
                .on_menu_event(|app, event| {
                    match event.id.as_ref() {
                        "toggle_overlay" => {
                            if let Some(w) = app.get_webview_window("overlay") {
                                if w.is_visible().unwrap_or(false) {
                                    let _ = w.hide();
                                } else {
                                    let _ = w.show();
                                    let _ = w.set_focus();
                                }
                            }
                        }
                        "open_app" => {
                            if let Some(w) = app.get_webview_window("main") {
                                let _ = w.show();
                                let _ = w.set_focus();
                            }
                        }
                        "start_timer" => {
                            let _ = app.emit("tray-start-timer", ());
                            if let Some(w) = app.get_webview_window("overlay") {
                                let _ = w.show();
                                let _ = w.set_focus();
                            }
                        }
                        "quit" => {
                            app.exit(0);
                        }
                        _ => {}
                    }
                })
                .on_tray_icon_event(|tray, event| {
                    // Double-click on tray icon = show main window
                    if let TrayIconEvent::DoubleClick { .. } = event {
                        let app = tray.app_handle();
                        if let Some(w) = app.get_webview_window("main") {
                            let _ = w.show();
                            let _ = w.set_focus();
                        }
                    }
                })
                .build(app)?;

            Ok(())
        })
        .on_window_event(|window, event| {
            // Close-to-tray: prevent close and hide instead
            if window.label() == "main" {
                if let WindowEvent::CloseRequested { api, .. } = event {
                    api.prevent_close();
                    let _ = window.hide();
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
