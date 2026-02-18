use rusqlite::Connection;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

fn db_path(app: &AppHandle) -> Result<PathBuf, String> {
    let app_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("{}", e))?;
    std::fs::create_dir_all(&app_dir).map_err(|e| e.to_string())?;
    Ok(app_dir.join("identity_habit.db"))
}

pub fn init_db(app: AppHandle) -> Result<(), String> {
    let path = db_path(&app)?;
    let conn = Connection::open(path).map_err(|e| e.to_string())?;
    conn.pragma_update(None, "journal_mode", "WAL").map_err(|e| e.to_string())?;
    conn.execute_batch(
        r#"
        CREATE TABLE IF NOT EXISTS user (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS identity (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT NOT NULL DEFAULT '',
            user_id INTEGER NOT NULL,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (user_id) REFERENCES user(id)
        );

        CREATE TABLE IF NOT EXISTS trait (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            identity_id INTEGER NOT NULL,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (identity_id) REFERENCES identity(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS behavior_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT NOT NULL,
            description TEXT NOT NULL,
            identity_id INTEGER NOT NULL,
            alignment_score INTEGER NOT NULL CHECK (alignment_score >= 1 AND alignment_score <= 10),
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (identity_id) REFERENCES identity(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS daily_reflection (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT NOT NULL,
            content TEXT NOT NULL,
            identity_id INTEGER NOT NULL,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            UNIQUE(date, identity_id),
            FOREIGN KEY (identity_id) REFERENCES identity(id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_behavior_date ON behavior_log(date);
        CREATE INDEX IF NOT EXISTS idx_behavior_identity ON behavior_log(identity_id);
        CREATE INDEX IF NOT EXISTS idx_reflection_date ON daily_reflection(date);
        CREATE INDEX IF NOT EXISTS idx_reflection_identity ON daily_reflection(identity_id);
        "#,
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

pub fn get_conn(app: &AppHandle) -> Result<Connection, String> {
    let path = db_path(app)?;
    Connection::open(&path).map_err(|e| e.to_string())
}
