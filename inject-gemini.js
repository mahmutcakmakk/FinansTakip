const Database = require('better-sqlite3');
const db = new Database('database.sqlite');

try {
  // Yeni gercek API Key'i DB'ye isliyoruz
  db.prepare('UPDATE profiles SET geminiApiKey = ?').run('AIzaSyBZ04TaWJ6JZOfZQJ0YrVf4U5O7vzff6fY');
  console.log('Yeni Orijinal Gemini API Key başarıyla tüm profillere entegre edildi!');
} catch (error) {
  console.error('Hata:', error);
}
