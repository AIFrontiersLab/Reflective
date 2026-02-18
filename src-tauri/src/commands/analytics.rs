use serde::Serialize;
use tauri::AppHandle;

use crate::db;

#[derive(Debug, Serialize)]
pub struct DayAlignment {
    pub date: String,
    pub avg_score: f64,
    pub count: i64,
}

#[tauri::command]
pub fn get_weekly_alignment(
    app: AppHandle,
    identity_id: i64,
    from_date: String,
    to_date: String,
) -> Result<Vec<DayAlignment>, String> {
    let conn = db::get_conn(&app)?;
    let mut stmt = conn
        .prepare(
            "SELECT date, AVG(alignment_score) as avg_score, COUNT(*) as count FROM behavior_log WHERE identity_id = ?1 AND date >= ?2 AND date <= ?3 GROUP BY date ORDER BY date",
        )
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map((identity_id, from_date.as_str(), to_date.as_str()), |row| {
            Ok(DayAlignment {
                date: row.get(0)?,
                avg_score: row.get(1)?,
                count: row.get(2)?,
            })
        })
        .map_err(|e| e.to_string())?;
    let mut out = Vec::new();
    for r in rows {
        out.push(r.map_err(|e: rusqlite::Error| e.to_string())?);
    }
    Ok(out)
}

#[derive(Debug, Serialize)]
pub struct AlignmentTrend {
    pub date: String,
    pub avg_alignment: f64,
    pub behavior_count: i64,
}

#[tauri::command]
pub fn get_alignment_trends(
    app: AppHandle,
    identity_id: i64,
    days: Option<i32>,
) -> Result<Vec<AlignmentTrend>, String> {
    let days = days.unwrap_or(14);
    let conn = db::get_conn(&app)?;
    let mut stmt = conn.prepare(&format!(
        "SELECT date, AVG(alignment_score), COUNT(*) FROM behavior_log WHERE identity_id = ?1 AND date >= date('now', '-{} days') GROUP BY date ORDER BY date",
        days
    )).map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([identity_id], |row| {
            Ok(AlignmentTrend {
                date: row.get(0)?,
                avg_alignment: row.get(1)?,
                behavior_count: row.get(2)?,
            })
        })
        .map_err(|e| e.to_string())?;
    let mut out = Vec::new();
    for r in rows {
        out.push(r.map_err(|e: rusqlite::Error| e.to_string())?);
    }
    Ok(out)
}
