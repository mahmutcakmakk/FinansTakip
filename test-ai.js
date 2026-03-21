const { GoogleGenerativeAI } = require('@google/generative-ai');
const Database = require('better-sqlite3');
const db = new Database('database.sqlite');

async function testAI() {
  try {
    const profile = db.prepare(`SELECT geminiApiKey FROM profiles WHERE id = 1`).get();
    console.log("Test Edilen API Key:", profile.geminiApiKey);
    
    if (!profile.geminiApiKey) {
      console.log("Hata: Veritabanında API Key yok.");
      return;
    }

    const genAI = new GoogleGenerativeAI(profile.geminiApiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    console.log("Google Gemini-1.5-Flash'a bağlanılıyor...");
    const result = await model.generateContent("Sadece 'Bağlantı Başarılı' yaz.");
    console.log("Gemini Yanıtı:", result.response.text());

  } catch (error) {
    console.error("Gemini Hata Detayı:", error.message);
  }
}

testAI();
