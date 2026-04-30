use std::sync::Mutex;
use tauri::{Manager, Emitter, AppHandle, WindowEvent};
use tauri::menu::{Menu, MenuItem};
use tauri::tray::{TrayIconBuilder, TrayIconEvent};
use tauri_plugin_positioner::{WindowExt, Position};
use tauri_plugin_global_shortcut::{ShortcutState, Shortcut, Code, Modifiers};
use tauri_plugin_store::StoreExt;

const AUTH_STORE_FILE: &str = "auth.json";
const TOKEN_KEY: &str = "auth_token";
const REFRESH_KEY: &str = "refresh_token";

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
    app: AppHandle,
    state: tauri::State<AppState>,
    token: String,
    refresh_token: String,
) -> Result<(), String> {
    *state.auth_token.lock().map_err(|e| e.to_string())? = Some(token.clone());
    *state.refresh_token.lock().map_err(|e| e.to_string())? = Some(refresh_token.clone());

    let store = app.store(AUTH_STORE_FILE).map_err(|e| e.to_string())?;
    store.set(TOKEN_KEY, serde_json::Value::String(token));
    store.set(REFRESH_KEY, serde_json::Value::String(refresh_token));
    store.save().map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn get_auth_token(state: tauri::State<AppState>) -> Option<String> {
    state.auth_token.lock().ok()?.clone()
}

#[tauri::command]
fn clear_auth_token(app: AppHandle, state: tauri::State<AppState>) -> Result<(), String> {
    *state.auth_token.lock().map_err(|e| e.to_string())? = None;
    *state.refresh_token.lock().map_err(|e| e.to_string())? = None;

    let store = app.store(AUTH_STORE_FILE).map_err(|e| e.to_string())?;
    store.delete(TOKEN_KEY);
    store.delete(REFRESH_KEY);
    store.save().map_err(|e| e.to_string())?;
    Ok(())
}

fn load_persisted_tokens(app: &AppHandle) -> (Option<String>, Option<String>) {
    let Ok(store) = app.store(AUTH_STORE_FILE) else {
        return (None, None);
    };
    let token = store.get(TOKEN_KEY).and_then(|v| v.as_str().map(String::from));
    let refresh = store.get(REFRESH_KEY).and_then(|v| v.as_str().map(String::from));
    (token, refresh)
}

// ─── Tray menu builder ──────────────────────────────────────────────────────

fn build_tray_menu(app: &AppHandle) -> tauri::Result<Menu<tauri::Wry>> {
    let open_app = MenuItem::with_id(app, "open_app", "Abrir ThePrimeWay", true, None::<&str>)?;
    let view_tasks = MenuItem::with_id(app, "view_tasks", "Ver Tareas", true, None::<&str>)?;
    let open_dashboard = MenuItem::with_id(app, "open_dashboard", "Abrir Dashboard", true, None::<&str>)?;
    let sep1 = tauri::menu::PredefinedMenuItem::separator(app)?;
    let toggle_overlay = MenuItem::with_id(app, "toggle_overlay", "Toggle Overlay", true, None::<&str>)?;
    let start_timer = MenuItem::with_id(app, "start_timer", "Iniciar Pomodoro", true, None::<&str>)?;
    let pause_timer = MenuItem::with_id(app, "pause_timer", "Pausar Timer", true, None::<&str>)?;
    let stop_timer = MenuItem::with_id(app, "stop_timer", "Detener Timer", true, None::<&str>)?;
    let sep2 = tauri::menu::PredefinedMenuItem::separator(app)?;
    let quit = MenuItem::with_id(app, "quit", "Salir", true, None::<&str>)?;

    Menu::with_items(
        app,
        &[
            &open_app,
            &view_tasks,
            &open_dashboard,
            &sep1,
            &toggle_overlay,
            &start_timer,
            &pause_timer,
            &stop_timer,
            &sep2,
            &quit,
        ],
    )
}

// Icon assets baked at compile time. Currently all three slots reuse the same
// PNG; replace with distinct variants in `icons/` to differentiate states.
// TODO(design): provide tray-icon-timer.png + tray-icon-tasks.png and switch
// the match arms below.
const TRAY_ICON_IDLE: &[u8] = include_bytes!("../icons/tray-icon.png");
const TRAY_ICON_TIMER: &[u8] = include_bytes!("../icons/tray-icon.png");
const TRAY_ICON_TASKS: &[u8] = include_bytes!("../icons/tray-icon.png");

#[tauri::command]
fn set_tray_icon_state(app: AppHandle, state: String) -> Result<(), String> {
    use tauri::image::Image;
    let Some(tray) = app.tray_by_id("main-tray") else {
        return Ok(());
    };
    let bytes: &[u8] = match state.as_str() {
        "timer" => TRAY_ICON_TIMER,
        "tasks" => TRAY_ICON_TASKS,
        _ => TRAY_ICON_IDLE,
    };
    let img = Image::from_bytes(bytes).map_err(|e| e.to_string())?;
    tray.set_icon(Some(img)).map_err(|e| e.to_string())?;
    Ok(())
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
        .plugin(tauri_plugin_store::Builder::default().build())
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
            set_tray_icon_state,
        ])
        .setup(|app| {
            // On macOS, set app activation policy to accessory
            #[cfg(target_os = "macos")]
            app.set_activation_policy(tauri::ActivationPolicy::Accessory);

            // Hydrate auth state from persistent store
            let (token, refresh) = load_persisted_tokens(app.handle());
            if let Some(state) = app.try_state::<AppState>() {
                if let Ok(mut t) = state.auth_token.lock() {
                    *t = token;
                }
                if let Ok(mut r) = state.refresh_token.lock() {
                    *r = refresh;
                }
            }

            // Default overlay to bottom-right only on first launch (window-state plugin
            // restores subsequent positions). Use absence of stored window state as proxy.
            if let Some(overlay) = app.get_webview_window("overlay") {
                if overlay.outer_position().map(|p| p.x == 20 && p.y == 20).unwrap_or(false) {
                    let _ = overlay.move_window(Position::BottomRight);
                }
            }

            // Register global shortcuts
            app.handle().plugin(
                tauri_plugin_global_shortcut::Builder::new()
                    .with_shortcut(Shortcut::new(Some(Modifiers::CONTROL | Modifiers::SHIFT), Code::KeyO))?
                    .with_shortcut(Shortcut::new(Some(Modifiers::CONTROL | Modifiers::SHIFT), Code::KeyT))?
                    .with_shortcut(Shortcut::new(Some(Modifiers::CONTROL | Modifiers::SHIFT), Code::KeyP))?
                    .with_shortcut(Shortcut::new(Some(Modifiers::CONTROL | Modifiers::SHIFT), Code::KeyN))?
                    .with_shortcut(Shortcut::new(Some(Modifiers::CONTROL | Modifiers::SHIFT), Code::KeyF))?
                    .with_shortcut(Shortcut::new(Some(Modifiers::CONTROL | Modifiers::SHIFT), Code::KeyD))?
                    .with_handler(move |app, shortcut, event| {
                        if event.state != ShortcutState::Pressed {
                            return;
                        }
                        let mods = Modifiers::CONTROL | Modifiers::SHIFT;
                        let show_overlay = || {
                            if let Some(w) = app.get_webview_window("overlay") {
                                let _ = w.show();
                                let _ = w.set_focus();
                            }
                        };
                        if shortcut.matches(mods, Code::KeyO) {
                            if let Some(w) = app.get_webview_window("overlay") {
                                if w.is_visible().unwrap_or(false) {
                                    let _ = w.hide();
                                } else {
                                    let _ = w.show();
                                    let _ = w.set_focus();
                                }
                            }
                        } else if shortcut.matches(mods, Code::KeyT) {
                            let _ = app.emit("tray-start-timer", ());
                            show_overlay();
                        } else if shortcut.matches(mods, Code::KeyP) {
                            let _ = app.emit("tray-pause-timer", ());
                        } else if shortcut.matches(mods, Code::KeyN) {
                            let _ = app.emit("tray-quick-capture", ());
                            show_overlay();
                        } else if shortcut.matches(mods, Code::KeyF) {
                            let _ = app.emit("tray-toggle-focus", ());
                            show_overlay();
                        } else if shortcut.matches(mods, Code::KeyD) {
                            let _ = app.emit("tray-complete-current", ());
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
                    let show_main = |path: Option<&str>| {
                        if let Some(w) = app.get_webview_window("main") {
                            let _ = w.show();
                            let _ = w.set_focus();
                        }
                        if let Some(p) = path {
                            let _ = app.emit("tray-navigate", p.to_string());
                        }
                    };
                    let show_overlay = || {
                        if let Some(w) = app.get_webview_window("overlay") {
                            let _ = w.show();
                            let _ = w.set_focus();
                        }
                    };
                    match event.id.as_ref() {
                        "open_app" => show_main(None),
                        "view_tasks" => show_main(Some("/tasks")),
                        "open_dashboard" => show_main(Some("/dashboard")),
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
                        "start_timer" => {
                            let _ = app.emit("tray-start-timer", ());
                            show_overlay();
                        }
                        "pause_timer" => {
                            let _ = app.emit("tray-pause-timer", ());
                        }
                        "stop_timer" => {
                            let _ = app.emit("tray-stop-timer", ());
                        }
                        "quit" => app.exit(0),
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
