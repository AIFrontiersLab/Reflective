use serde::{Deserialize, Serialize};
use tauri::AppHandle;

use crate::db;

#[derive(Debug, Serialize, Deserialize)]
pub struct Trait {
    pub id: i64,
    pub name: String,
    pub identity_id: i64,
    pub created_at: String,
}

#[tauri::command]
pub fn create_trait(app: AppHandle, identity_id: i64, name: String) -> Result<Trait, String> {
    let conn = db::get_conn(&app)?;
    conn.execute(
        "INSERT INTO trait (name, identity_id) VALUES (?1, ?2)",
        [&name, &identity_id.to_string()],
    )
    .map_err(|e| e.to_string())?;
    let id = conn.last_insert_rowid();
    conn.query_row(
        "SELECT id, name, identity_id, created_at FROM trait WHERE id = ?1",
        [id],
        |row| {
            Ok(Trait {
                id: row.get(0)?,
                name: row.get(1)?,
                identity_id: row.get(2)?,
                created_at: row.get(3)?,
            })
        },
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn list_traits(app: AppHandle, identity_id: i64) -> Result<Vec<Trait>, String> {
    let conn = db::get_conn(&app)?;
    let mut stmt = conn
        .prepare("SELECT id, name, identity_id, created_at FROM trait WHERE identity_id = ?1 ORDER BY created_at")
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([identity_id], |row| {
            Ok(Trait {
                id: row.get(0)?,
                name: row.get(1)?,
                identity_id: row.get(2)?,
                created_at: row.get(3)?,
            })
        })
        .map_err(|e| e.to_string())?;
    let mut out = Vec::new();
    for r in rows {
        out.push(r.map_err(|e| e.to_string())?);
    }
    Ok(out)
}

#[tauri::command]
pub fn delete_trait(app: AppHandle, id: i64) -> Result<(), String> {
    let conn = db::get_conn(&app)?;
    conn.execute("DELETE FROM trait WHERE id = ?1", [id])
        .map_err(|e| e.to_string())?;
    Ok(())
}
