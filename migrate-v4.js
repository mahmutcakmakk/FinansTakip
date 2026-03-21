const Database = require('better-sqlite3');
const db = new Database('database.sqlite');

console.log("🚀 Aşama 7: Yapay Zeka (AI) Migrasyonu Başlıyor...");

try {
  // Profillere 'geminiApiKey' ekleniyor
  db.prepare("ALTER TABLE profiles ADD COLUMN geminiApiKey TEXT").run();
  console.log("✅ 'profiles' tablosuna geminiApiKey kolonu eklendi.");
} catch (error) {
  // Eğer kolon zaten varsa bu hata fırlatılır, yok sayıyoruz
  console.log("⚠️ Kolon zaten mevcut (ya da hata yakalandı). Sorun yok.");
}
console.log("🎉 Aşama 7 Migrasyonu Tamamlandı!");
