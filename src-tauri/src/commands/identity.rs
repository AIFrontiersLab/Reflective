use serde::{Deserialize, Serialize};
use tauri::AppHandle;

use crate::db;

#[derive(Debug, Serialize, Deserialize)]
pub struct Identity {
    pub id: i64,
    pub name: String,
    pub description: String,
    pub user_id: i64,
    pub created_at: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateIdentityInput {
    pub name: String,
    pub description: Option<String>,
}

#[tauri::command]
pub fn create_identity(app: AppHandle, user_id: i64, input: CreateIdentityInput) -> Result<Identity, String> {
    let conn = db::get_conn(&app)?;
    let description = input.description.unwrap_or_default();
    conn.execute(
        "INSERT INTO identity (name, description, user_id) VALUES (?1, ?2, ?3)",
        [&input.name, &description, &user_id.to_string()],
    )
    .map_err(|e| e.to_string())?;
    let id = conn.last_insert_rowid();
    get_identity_by_id(&conn, id)
}

fn get_identity_by_id(conn: &rusqlite::Connection, id: i64) -> Result<Identity, String> {
    conn.query_row(
        "SELECT id, name, description, user_id, created_at FROM identity WHERE id = ?1",
        [id],
        |row| {
            Ok(Identity {
                id: row.get(0)?,
                name: row.get(1)?,
                description: row.get(2)?,
                user_id: row.get(3)?,
                created_at: row.get(4)?,
            })
        },
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn list_identities(app: AppHandle, user_id: i64) -> Result<Vec<Identity>, String> {
    let conn = db::get_conn(&app)?;
    let mut stmt = conn
        .prepare("SELECT id, name, description, user_id, created_at FROM identity WHERE user_id = ?1 ORDER BY created_at DESC")
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([user_id], |row| {
            Ok(Identity {
                id: row.get(0)?,
                name: row.get(1)?,
                description: row.get(2)?,
                user_id: row.get(3)?,
                created_at: row.get(4)?,
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
pub fn get_identity(app: AppHandle, id: i64) -> Result<Option<Identity>, String> {
    let conn = db::get_conn(&app)?;
    let mut stmt = conn
        .prepare("SELECT id, name, description, user_id, created_at FROM identity WHERE id = ?1")
        .map_err(|e| e.to_string())?;
    let mut rows = stmt.query([id]).map_err(|e| e.to_string())?;
    match rows.next().map_err(|e| e.to_string())? {
        Some(row) => Ok(Some(Identity {
            id: row.get(0).map_err(|e| e.to_string())?,
            name: row.get(1).map_err(|e| e.to_string())?,
            description: row.get(2).map_err(|e| e.to_string())?,
            user_id: row.get(3).map_err(|e| e.to_string())?,
            created_at: row.get(4).map_err(|e| e.to_string())?,
        })),
        None => Ok(None),
    }
}

#[tauri::command]
pub fn update_identity(
    app: AppHandle,
    id: i64,
    name: Option<String>,
    description: Option<String>,
) -> Result<Identity, String> {
    let conn = db::get_conn(&app)?;
    if let Some(n) = name {
        conn.execute("UPDATE identity SET name = ?1 WHERE id = ?2", (n, id))
            .map_err(|e| e.to_string())?;
    }
    if let Some(d) = description {
        conn.execute("UPDATE identity SET description = ?1 WHERE id = ?2", (d, id))
            .map_err(|e| e.to_string())?;
    }
    get_identity_by_id(&conn, id)
}
