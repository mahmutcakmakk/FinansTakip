const Database = require('better-sqlite3');
const db = new Database('database.sqlite');

console.log("🚀 Aşama 5 Veritabanı Migrasyonu (V3) Başlıyor...");

try {
  // 1. Transferler Tablosu
  db.prepare(`
    CREATE TABLE IF NOT EXISTS transfers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        profileId INTEGER NOT NULL,
        fromWalletId INTEGER NOT NULL,
        toWalletId INTEGER NOT NULL,
        amount REAL NOT NULL,
        date TEXT NOT NULL,
        description TEXT,
        FOREIGN KEY(profileId) REFERENCES profiles(id),
        FOREIGN KEY(fromWalletId) REFERENCES wallets(id),
        FOREIGN KEY(toWalletId) REFERENCES wallets(id)
    )
  `).run();
  console.log("✅ 'transfers' tablosu başarıyla kontrol edildi / oluşturuldu.");

  // 2. Bütçeler Tablosu
  db.prepare(`
    CREATE TABLE IF NOT EXISTS budgets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        profileId INTEGER NOT NULL,
        categoryId INTEGER NOT NULL,
        amountLimit REAL NOT NULL,
        month TEXT NOT NULL,
        FOREIGN KEY(profileId) REFERENCES profiles(id),
        FOREIGN KEY(categoryId) REFERENCES categories(id)
    )
  `).run();
  console.log("✅ 'budgets' tablosu başarıyla kontrol edildi / oluşturuldu.");

  console.log("🎉 Aşama 5 Migrasyonu Sorunsuz Tamamlandı!");
} catch (error) {
  console.error("❌ HATA: Migrasyon sırasında bir sorun oluştu:", error);
}
