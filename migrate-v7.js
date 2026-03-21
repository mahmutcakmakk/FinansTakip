const Database = require('better-sqlite3');
const db = new Database('database.sqlite');

try {
  console.log("🚀 Aşama 10: Kanban İş Panosu Migrasyonu (V7) Başlıyor...");

  db.exec(`
    CREATE TABLE IF NOT EXISTS kanban_tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      profileId TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'TODO',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log("✅ 'kanban_tasks' tablosu başarıyla oluşturuldu.");
  console.log("🎉 Aşama 10 Migrasyonu (V7) Tamamlandı!");
} catch (error) {
  console.error("Migrasyon sırasında hata oluştu:", error.message);
}
