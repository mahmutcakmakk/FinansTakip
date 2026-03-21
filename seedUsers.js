const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    const check1 = await pool.query("SELECT * FROM profiles WHERE username = 'ortak'");
    if (check1.rows.length === 0) {
       await pool.query("INSERT INTO profiles (name, username, password) VALUES ('Ortak Kasa (OyunTag)', 'ortak', '123456')");
    }

    const check2 = await pool.query("SELECT * FROM profiles WHERE username = 'mc'");
    if (check2.rows.length === 0) {
       await pool.query("INSERT INTO profiles (name, username, password) VALUES ('Mahmut Çakmak (MC)', 'mc', '123456')");
    }

    const check3 = await pool.query("SELECT * FROM profiles WHERE username = 'md'");
    if (check3.rows.length === 0) {
       await pool.query("INSERT INTO profiles (name, username, password) VALUES ('Muhammet (MD)', 'md', '123456')");
    }

    const profiles = await pool.query("SELECT id, name, username FROM profiles");
    console.log("Şu Anki Veritabanı Profilleri:", profiles.rows);
  } catch(e) {
    console.error("HATA:", e);
  } finally {
    await pool.end();
  }
}
run();
