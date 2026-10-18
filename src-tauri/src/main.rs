#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
const MAX_SAVE_BYTES: usize = 128 * 1024;

fn validate_json(contents: &str) -> Result<(), String> {
    if contents.len() > MAX_SAVE_BYTES { return Err("存檔超過 128 KB 上限。".into()); }
    let value: serde_json::Value = serde_json::from_str(contents).map_err(|_| "無效的 JSON 存檔。")?;
    if value.get("format").and_then(|v| v.as_str()) != Some("red-banner") {
        return Err("這不是赤旌存檔。".into());
    }
    Ok(())
}

// Paths come exclusively from the user's native file dialog, never from JavaScript.
#[tauri::command]
async fn export_save(contents: String) -> Result<bool, String> {
    validate_json(&contents)?;
    let chosen = rfd::AsyncFileDialog::new().set_title("匯出赤旌存檔")
        .add_filter("赤旌存檔", &["json"]).set_file_name("red-banner-save.json").save_file().await;
    match chosen {
        Some(file) => { std::fs::write(file.path(), contents).map_err(|e| format!("無法儲存：{e}"))?; Ok(true) }
        None => Ok(false),
    }
}

#[tauri::command]
async fn import_save() -> Result<Option<String>, String> {
    let chosen = rfd::AsyncFileDialog::new().set_title("匯入赤旌存檔").add_filter("赤旌存檔", &["json"]).pick_file().await;
    let Some(file) = chosen else { return Ok(None); };
    // Bound the read even if the selected file changes after selection.
    use std::io::Read;
    let file = std::fs::File::open(file.path()).map_err(|e| format!("無法開啟：{e}"))?;
    let mut contents = String::new();
    file.take((MAX_SAVE_BYTES + 1) as u64).read_to_string(&mut contents).map_err(|e| format!("無法讀取：{e}"))?;
    validate_json(&contents)?;
    Ok(Some(contents))
}

fn validate_backup(contents: &str) -> Result<(), String> {
    if contents.len() > 1024 * 1024 { return Err("完整備份超過 1 MB。".into()); }
    let value: serde_json::Value = serde_json::from_str(contents).map_err(|_| "無效的備份 JSON。")?;
    if value.get("format").and_then(|v| v.as_str()) != Some("red-banner-backup") { return Err("這不是完整備份。".into()); }
    Ok(())
}
#[tauri::command]
async fn export_backup(contents: String) -> Result<bool, String> {
    validate_backup(&contents)?;
    let chosen=rfd::AsyncFileDialog::new().set_title("匯出赤旌完整備份").add_filter("JSON", &["json"]).set_file_name("red-banner-full-backup.json").save_file().await;
    match chosen {Some(file)=>{std::fs::write(file.path(),contents).map_err(|e|e.to_string())?;Ok(true)},None=>Ok(false)}
}
#[tauri::command]
async fn import_backup() -> Result<Option<String>, String> {
    let chosen=rfd::AsyncFileDialog::new().set_title("還原赤旌完整備份").add_filter("JSON", &["json"]).pick_file().await;
    let Some(file)=chosen else{return Ok(None)};
    use std::io::Read;
    let file=std::fs::File::open(file.path()).map_err(|e|e.to_string())?;
    let mut contents=String::new();file.take(1024*1024+1).read_to_string(&mut contents).map_err(|e|e.to_string())?;
    validate_backup(&contents)?;Ok(Some(contents))
}

#[tauri::command]
fn toggle_fullscreen(window: tauri::Window) -> Result<(), String> {
    let fullscreen = window.is_fullscreen().map_err(|e| e.to_string())?;
    window.set_fullscreen(!fullscreen).map_err(|e| e.to_string())
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![export_save, import_save, export_backup, import_backup, toggle_fullscreen])
        .run(tauri::generate_context!()).expect("Unable to start game");
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test] fn validates_complete_backups() { assert!(validate_backup(r#"{"format":"red-banner-backup"}"#).is_ok());assert!(validate_backup(r#"{"format":"red-banner"}"#).is_err());assert!(validate_backup(&" ".repeat(1024*1024+1)).is_err()); }
    #[test] fn accepts_game_save() { assert!(validate_json(r#"{"format":"red-banner"}"#).is_ok()); }
    #[test] fn rejects_wrong_or_broken_json() { assert!(validate_json("bad").is_err()); assert!(validate_json("{}").is_err()); }
    #[test] fn rejects_large_save() { assert!(validate_json(&" ".repeat(MAX_SAVE_BYTES + 1)).is_err()); }
}
