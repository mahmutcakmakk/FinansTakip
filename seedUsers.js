const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    await pool.query("INSERT INTO profiles (name, username, password) VALUES ('Ortak Kasa (OyunTag)', 'ortak', '123456') ON CONFLICT DO NOTHING;");
    await pool.query("INSERT INTO profiles (name, username, password) VALUES ('Mahmut Çakmak (MC)', 'mc', '123456') ON CONFLICT DO NOTHING;");
    await pool.query("INSERT INTO profiles (name, username, password) VALUES ('Muhammet (MD)', 'md', '123456') ON CONFLICT DO NOTHING;");
    console.log("3 Ana Kullanıcı Başarıyla PostgreSQL'e Eklendi!");
  } catch(e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
run();
