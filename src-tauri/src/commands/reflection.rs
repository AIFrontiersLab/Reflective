use serde::{Deserialize, Serialize};
use tauri::AppHandle;

use crate::db;

#[derive(Debug, Serialize, Deserialize)]
pub struct DailyReflection {
    pub id: i64,
    pub date: String,
    pub content: String,
    pub identity_id: i64,
    pub created_at: String,
}

#[derive(Debug, Deserialize)]
pub struct ReflectionInput {
    pub identity_id: i64,
    pub date: String,
    pub identity_name: String,
    pub identity_description: String,
    pub traits: Vec<String>,
    pub behaviors: Vec<BehaviorForReflection>,
}

#[derive(Debug, Deserialize)]
pub struct BehaviorForReflection {
    pub description: String,
    pub alignment_score: i32,
}

const SYSTEM_INSTRUCTION: &str = r#"You are a psychologically intelligent identity performance coach.
Analyze behavioral alignment with the stated identity.
Be specific, insightful, and constructive.
Avoid generic motivation.
Focus on identity reinforcement and misalignment patterns.

Respond with valid JSON only, in this exact structure:
{
  "title": "string",
  "alignmentSummary": "string",
  "observations": ["string", "string", "string"],
  "identityCorrection": "string",
  "closingStatement": "string"
}"#;

#[tauri::command]
pub async fn generate_reflection(
    app: AppHandle,
    api_key: String,
    input: ReflectionInput,
) -> Result<DailyReflection, String> {
    if api_key.is_empty() {
        return Err("OpenAI API key is required".to_string());
    }

    let behaviors_text = input
        .behaviors
        .iter()
        .map(|b| format!("- {} (alignment: {}/10)", b.description, b.alignment_score))
        .collect::<Vec<_>>()
        .join("\n");

    let traits_text = input.traits.join(", ");
    let user_content = format!(
        r#"Identity: {}
Description: {}
Traits: {}

Today's behaviors and alignment:
{}
"#,
        input.identity_name,
        input.identity_description,
        traits_text,
        if behaviors_text.is_empty() {
            "(No behaviors logged today)".to_string()
        } else {
            behaviors_text
        }
    );

    let client = reqwest::Client::new();
    let body = serde_json::json!({
        "model": "gpt-4o-mini",
        "messages": [
            { "role": "system", "content": SYSTEM_INSTRUCTION },
            { "role": "user", "content": user_content }
        ],
        "temperature": 0.7
    });

    let res = client
        .post("https://api.openai.com/v1/chat/completions")
        .header("Authorization", format!("Bearer {}", api_key))
        .header("Content-Type", "application/json")
        .json(&body)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !res.status().is_success() {
        let err_text = res.text().await.unwrap_or_default();
        return Err(format!("OpenAI API error: {}", err_text));
    }

    let json: serde_json::Value = res.json().await.map_err(|e| e.to_string())?;
    let content_raw = json
        .get("choices")
        .and_then(|c| c.get(0))
        .and_then(|c| c.get("message"))
        .and_then(|m| m.get("content"))
        .and_then(|c| c.as_str())
        .ok_or("Invalid OpenAI response")?;

    let content = content_raw.trim();
    let content = content.strip_prefix("```json").unwrap_or(content);
    let content = content.strip_prefix("```").unwrap_or(content).trim();
    let content = content.strip_suffix("```").unwrap_or(content).trim();

    let conn = db::get_conn(&app)?;
    conn.execute(
        "INSERT OR REPLACE INTO daily_reflection (date, content, identity_id) VALUES (?1, ?2, ?3)",
        [&input.date, content, &input.identity_id.to_string()],
    )
    .map_err(|e| e.to_string())?;
    let id = conn.last_insert_rowid();
    conn.query_row(
        "SELECT id, date, content, identity_id, created_at FROM daily_reflection WHERE id = ?1",
        [id],
        |row| {
            Ok(DailyReflection {
                id: row.get(0)?,
                date: row.get(1)?,
                content: row.get(2)?,
                identity_id: row.get(3)?,
                created_at: row.get(4)?,
            })
        },
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_reflection_for_date(
    app: AppHandle,
    identity_id: i64,
    date: String,
) -> Result<Option<DailyReflection>, String> {
    let conn = db::get_conn(&app)?;
    let mut stmt = conn
        .prepare("SELECT id, date, content, identity_id, created_at FROM daily_reflection WHERE identity_id = ?1 AND date = ?2")
        .map_err(|e| e.to_string())?;
    let mut rows = stmt.query((identity_id, date.as_str())).map_err(|e| e.to_string())?;
    match rows.next().map_err(|e| e.to_string())? {
        Some(row) => Ok(Some(DailyReflection {
            id: row.get(0).map_err(|e| e.to_string())?,
            date: row.get(1).map_err(|e| e.to_string())?,
            content: row.get(2).map_err(|e| e.to_string())?,
            identity_id: row.get(3).map_err(|e| e.to_string())?,
            created_at: row.get(4).map_err(|e| e.to_string())?,
        })),
        None => Ok(None),
    }
}

#[tauri::command]
pub fn list_reflections(
    app: AppHandle,
    identity_id: i64,
    limit: Option<i32>,
) -> Result<Vec<DailyReflection>, String> {
    let limit = limit.unwrap_or(30);
    let conn = db::get_conn(&app)?;
    let mut stmt = conn
        .prepare("SELECT id, date, content, identity_id, created_at FROM daily_reflection WHERE identity_id = ?1 ORDER BY date DESC LIMIT ?2")
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map((identity_id, limit as i64), |row| {
            Ok(DailyReflection {
                id: row.get(0)?,
                date: row.get(1)?,
                content: row.get(2)?,
                identity_id: row.get(3)?,
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
