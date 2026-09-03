#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
async fn save_docx_file(default_name: String, data: Vec<u8>) -> Result<Option<String>, String> {
    use rfd::AsyncFileDialog;
    let file = AsyncFileDialog::new()
        .set_file_name(&default_name)
        .add_filter("Word Document", &["docx"])
        .save_file()
        .await;

    if let Some(handle) = file {
        let path = handle.path().to_path_buf();
        std::fs::write(&path, &data).map_err(|e| e.to_string())?;
        Ok(Some(path.to_string_lossy().to_string()))
    } else {
        Ok(None)
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_sql::Builder::default().build())
        .invoke_handler(tauri::generate_handler![greet, save_docx_file])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
