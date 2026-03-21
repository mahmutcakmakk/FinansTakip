const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    // Patron profilini sil (ID veya username admin ise)
    await pool.query("DELETE FROM profiles WHERE username = 'admin'");
    console.log("Patron hesabı silindi.");

    // Mahmut (mc) profil ismini düzelt
    await pool.query("UPDATE profiles SET name = 'Mahmut (MC)' WHERE username = 'mc'");
    console.log("MC profili Mahmut (MC) olarak güncellendi.");

    // Açık olan / Kayıtlı olan Gemini API anahtarı varsa tüm profillere geçir
    const keyRes = await pool.query("SELECT geminiapikey FROM profiles WHERE geminiapikey != '' AND geminiapikey IS NOT NULL LIMIT 1");
    if(keyRes.rows.length > 0) {
      await pool.query("UPDATE profiles SET geminiapikey = $1", [keyRes.rows[0].geminiapikey]);
      console.log("Ortak Gemini API anahtarı tüm profillere paylaştırıldı.");
    }
  } catch(e) {
    console.error("Hata:", e);
  } finally {
    process.exit(0);
  }
}
run();
