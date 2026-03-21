const Database = require('better-sqlite3');
const db = new Database('database.sqlite');

try {
  console.log("🚀 Aşama 8: Kurumsal Finans Araçları Migrasyonu (V5) Başlıyor...");

  // Kısmi ödeme miktarını tutmak için paidAmount kolonu
  db.prepare("ALTER TABLE debts ADD COLUMN paidAmount REAL DEFAULT 0").run();
  console.log("✅ 'debts' tablosuna paidAmount kolonu eklendi.");

  // Kredi kartı gibi özelliklerde kaç taksit olduğunu tutmak için installments kolonu
  db.prepare("ALTER TABLE debts ADD COLUMN installments INTEGER").run();
  console.log("✅ 'debts' tablosuna installments kolonu eklendi.");

  console.log("🎉 Aşama 8 Migrasyonu Tamamlandı!");
} catch (error) {
  // Eğer kolonlar zaten varsa SQLite hata verebilir, yoksay.
  console.error("Migrasyon sırasında hata oluştu veya kolonlar zaten mevcut:", error.message);
}
