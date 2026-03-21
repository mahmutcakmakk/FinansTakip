const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: { rejectUnauthorized: false }
});
async function run() {
  const res = await pool.query('SELECT id, name, username FROM profiles');
  console.log(JSON.stringify(res.rows, null, 2));
  process.exit(0);
}
run();
