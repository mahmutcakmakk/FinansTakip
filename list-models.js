const Database = require('better-sqlite3');
const db = new Database('database.sqlite');

async function listModels() {
  const profile = db.prepare('SELECT geminiApiKey FROM profiles WHERE id = 1').get();
  const apiKey = profile.geminiApiKey;
  
  if (!apiKey) return console.log("No API key");

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await res.json();
    data.models.forEach(m => {
       if(m.supportedGenerationMethods.includes('generateContent')) {
          console.log(m.name);
       }
    });
  } catch(e) {
    console.error("Fetch error:", e.message);
  }
}
listModels();
