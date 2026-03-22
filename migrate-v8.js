const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    await pool.query("ALTER TABLE transactions ADD COLUMN customerId INTEGER;");
    console.log("✅ Migration V8 Başarılı: customerId sütunu transactions tablosuna eklendi.");
  } catch(e) {
    if (e.message.includes('already exists')) {
      console.log("✅ Kolon zaten mevcut.");
    } else {
      console.error("❌ Migration Hatası:", e);
    }
  } finally {
    process.exit(0);
  }
}
run();
