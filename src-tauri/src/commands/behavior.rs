use serde::{Deserialize, Serialize};
use tauri::AppHandle;

use crate::db;

#[derive(Debug, Serialize, Deserialize)]
pub struct BehaviorLog {
    pub id: i64,
    pub date: String,
    pub description: String,
    pub identity_id: i64,
    pub alignment_score: i32,
    pub created_at: String,
}

#[derive(Debug, Deserialize)]
pub struct LogBehaviorInput {
    pub date: String,
    pub description: String,
    pub identity_id: i64,
    pub alignment_score: i32,
}

#[tauri::command]
pub fn log_behavior(app: AppHandle, input: LogBehaviorInput) -> Result<BehaviorLog, String> {
    if input.alignment_score < 1 || input.alignment_score > 10 {
        return Err("alignment_score must be between 1 and 10".to_string());
    }
    let conn = db::get_conn(&app)?;
    conn.execute(
        "INSERT INTO behavior_log (date, description, identity_id, alignment_score) VALUES (?1, ?2, ?3, ?4)",
        [
            &input.date,
            &input.description,
            &input.identity_id.to_string(),
            &input.alignment_score.to_string(),
        ],
    )
    .map_err(|e| e.to_string())?;
    let id = conn.last_insert_rowid();
    conn.query_row(
        "SELECT id, date, description, identity_id, alignment_score, created_at FROM behavior_log WHERE id = ?1",
        [id],
        |row| {
            Ok(BehaviorLog {
                id: row.get(0)?,
                date: row.get(1)?,
                description: row.get(2)?,
                identity_id: row.get(3)?,
                alignment_score: row.get(4)?,
                created_at: row.get(5)?,
            })
        },
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_behaviors_for_date(
    app: AppHandle,
    identity_id: i64,
    date: String,
) -> Result<Vec<BehaviorLog>, String> {
    let conn = db::get_conn(&app)?;
    let mut stmt = conn
        .prepare(
            "SELECT id, date, description, identity_id, alignment_score, created_at FROM behavior_log WHERE identity_id = ?1 AND date = ?2 ORDER BY created_at",
        )
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map((identity_id, date.as_str()), |row| {
            Ok(BehaviorLog {
                id: row.get(0)?,
                date: row.get(1)?,
                description: row.get(2)?,
                identity_id: row.get(3)?,
                alignment_score: row.get(4)?,
                created_at: row.get(5)?,
            })
        })
        .map_err(|e| e.to_string())?;
    let mut out = Vec::new();
    for r in rows {
        out.push(r.map_err(|e: rusqlite::Error| e.to_string())?);
    }
    Ok(out)
}

#[tauri::command]
pub fn list_behaviors_for_identity(
    app: AppHandle,
    identity_id: i64,
    from_date: Option<String>,
    to_date: Option<String>,
) -> Result<Vec<BehaviorLog>, String> {
    let conn = db::get_conn(&app)?;
    let out = match (from_date.as_deref(), to_date.as_deref()) {
        (Some(f), Some(t)) => {
            let mut stmt = conn.prepare("SELECT id, date, description, identity_id, alignment_score, created_at FROM behavior_log WHERE identity_id = ?1 AND date >= ?2 AND date <= ?3 ORDER BY date DESC, created_at").map_err(|e| e.to_string())?;
            let rows = stmt.query_map((identity_id, f, t), |row| {
                Ok(BehaviorLog {
                    id: row.get(0)?,
                    date: row.get(1)?,
                    description: row.get(2)?,
                    identity_id: row.get(3)?,
                    alignment_score: row.get(4)?,
                    created_at: row.get(5)?,
                })
            }).map_err(|e| e.to_string())?;
            let mut out = Vec::new();
            for r in rows {
                out.push(r.map_err(|e: rusqlite::Error| e.to_string())?);
            }
            out
        }
        (Some(f), None) => {
            let mut stmt = conn.prepare("SELECT id, date, description, identity_id, alignment_score, created_at FROM behavior_log WHERE identity_id = ?1 AND date >= ?2 ORDER BY date DESC, created_at").map_err(|e| e.to_string())?;
            let rows = stmt.query_map((identity_id, f), |row| {
                Ok(BehaviorLog {
                    id: row.get(0)?,
                    date: row.get(1)?,
                    description: row.get(2)?,
                    identity_id: row.get(3)?,
                    alignment_score: row.get(4)?,
                    created_at: row.get(5)?,
                })
            }).map_err(|e| e.to_string())?;
            let mut out = Vec::new();
            for r in rows {
                out.push(r.map_err(|e: rusqlite::Error| e.to_string())?);
            }
            out
        }
        (None, Some(t)) => {
            let mut stmt = conn.prepare("SELECT id, date, description, identity_id, alignment_score, created_at FROM behavior_log WHERE identity_id = ?1 AND date <= ?2 ORDER BY date DESC, created_at").map_err(|e| e.to_string())?;
            let rows = stmt.query_map((identity_id, t), |row| {
                Ok(BehaviorLog {
                    id: row.get(0)?,
                    date: row.get(1)?,
                    description: row.get(2)?,
                    identity_id: row.get(3)?,
                    alignment_score: row.get(4)?,
                    created_at: row.get(5)?,
                })
            }).map_err(|e| e.to_string())?;
            let mut out = Vec::new();
            for r in rows {
                out.push(r.map_err(|e: rusqlite::Error| e.to_string())?);
            }
            out
        }
        (None, None) => {
            let mut stmt = conn.prepare("SELECT id, date, description, identity_id, alignment_score, created_at FROM behavior_log WHERE identity_id = ?1 ORDER BY date DESC, created_at").map_err(|e| e.to_string())?;
            let rows = stmt.query_map([identity_id], |row| {
                Ok(BehaviorLog {
                    id: row.get(0)?,
                    date: row.get(1)?,
                    description: row.get(2)?,
                    identity_id: row.get(3)?,
                    alignment_score: row.get(4)?,
                    created_at: row.get(5)?,
                })
            }).map_err(|e| e.to_string())?;
            let mut out = Vec::new();
            for r in rows {
                out.push(r.map_err(|e: rusqlite::Error| e.to_string())?);
            }
            out
        }
    };
    Ok(out)
}
