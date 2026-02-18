mod commands;
mod db;

use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            let handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                if let Err(e) = db::init_db(handle) {
                    eprintln!("DB init error: {}", e);
                }
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::user::create_user,
            commands::user::get_user,
            commands::identity::create_identity,
            commands::identity::list_identities,
            commands::identity::get_identity,
            commands::identity::update_identity,
            commands::trait_::create_trait,
            commands::trait_::list_traits,
            commands::trait_::delete_trait,
            commands::behavior::log_behavior,
            commands::behavior::get_behaviors_for_date,
            commands::behavior::list_behaviors_for_identity,
            commands::reflection::generate_reflection,
            commands::reflection::get_reflection_for_date,
            commands::reflection::list_reflections,
            commands::analytics::get_weekly_alignment,
            commands::analytics::get_alignment_trends,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
