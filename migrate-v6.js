const Database = require('better-sqlite3');
const db = new Database('database.sqlite');

try {
  console.log("🚀 Aşama 9: Akıllı Abonelik Migrasyonu (V6) Başlıyor...");

  // Aboneliğin bu ay ödenip ödenmediğini (örn: '2026-03') tutmak için lastPaidMonth kolonu
  db.prepare("ALTER TABLE subscriptions ADD COLUMN lastPaidMonth TEXT").run();
  console.log("✅ 'subscriptions' tablosuna lastPaidMonth kolonu eklendi.");

  console.log("🎉 Aşama 9 Migrasyonu Tamamlandı!");
} catch (error) {
  console.error("Migrasyon sırasında hata oluştu veya kolon zaten mevcut:", error.message);
}
