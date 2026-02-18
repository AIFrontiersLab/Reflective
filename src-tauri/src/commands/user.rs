use serde::{Deserialize, Serialize};
use tauri::AppHandle;

use crate::db;

#[derive(Debug, Serialize, Deserialize)]
pub struct User {
    pub id: i64,
    pub name: String,
    pub created_at: String,
}

#[tauri::command]
pub fn create_user(app: AppHandle, name: String) -> Result<User, String> {
    let conn = db::get_conn(&app)?;
    conn.execute("INSERT INTO user (name) VALUES (?1)", [&name])
        .map_err(|e| e.to_string())?;
    let id = conn.last_insert_rowid();
    let user = conn.query_row(
        "SELECT id, name, created_at FROM user WHERE id = ?1",
        [id],
        |row| {
            Ok(User {
                id: row.get(0)?,
                name: row.get(1)?,
                created_at: row.get(2)?,
            })
        },
    ).map_err(|e| e.to_string())?;
    Ok(user)
}

#[tauri::command]
pub fn get_user(app: AppHandle) -> Result<Option<User>, String> {
    let conn = db::get_conn(&app)?;
    let mut stmt = conn
        .prepare("SELECT id, name, created_at FROM user ORDER BY id DESC LIMIT 1")
        .map_err(|e| e.to_string())?;
    let mut rows = stmt.query([]).map_err(|e| e.to_string())?;
    match rows.next().map_err(|e| e.to_string())? {
        Some(row) => Ok(Some(User {
            id: row.get(0).map_err(|e| e.to_string())?,
            name: row.get(1).map_err(|e| e.to_string())?,
            created_at: row.get(2).map_err(|e| e.to_string())?,
        })),
        None => Ok(None),
    }
}
