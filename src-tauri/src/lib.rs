mod oauth;

use tauri::Manager;

#[tauri::command]
async fn start_oauth_server(port: u16) -> Result<String, String> {
    oauth::start_oauth_server(port).await
}

#[tauri::command]
async fn open_url(url: String) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    std::process::Command::new("open").arg(&url).spawn().map_err(|e| e.to_string())?;

    #[cfg(target_os = "windows")]
    std::process::Command::new("cmd").args(["/C", "start", &url]).spawn().map_err(|e| e.to_string())?;

    #[cfg(target_os = "linux")]
    std::process::Command::new("xdg-open").arg(&url).spawn().map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
async fn set_always_on_top(window: tauri::Window, on_top: bool) -> Result<(), String> {
    window.set_always_on_top(on_top).map_err(|e| e.to_string())
}

#[tauri::command]
async fn set_window_position(window: tauri::Window, x: f64, y: f64) -> Result<(), String> {
    window
        .set_position(tauri::PhysicalPosition::new(x as i32, y as i32))
        .map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            let win = app.get_webview_window("main").unwrap();
            win.set_always_on_top(true).ok();

            if let Ok(Some(monitor)) = win.primary_monitor() {
                let screen = monitor.size();
                let margin = (20.0 * monitor.scale_factor()) as i32;
                let win_size = win.outer_size().unwrap_or(tauri::PhysicalSize::new(340, 520));
                win.set_position(tauri::PhysicalPosition::new(
                    screen.width as i32 - win_size.width as i32 - margin,
                    margin,
                )).ok();
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            start_oauth_server,
            open_url,
            set_always_on_top,
            set_window_position,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
