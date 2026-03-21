import { Pool } from 'pg';

// process.env.POSTGRES_URL should be available from Vercel/Neon
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: { rejectUnauthorized: false }
});

// SQLite to PostgreSQL Query Converter
function convertSqliteToPostgres(sql: string) {
  let index = 1;

  // 1. Replace ? with $1, $2 (Regex safely matching ?)
  // This is a naive replacement but works for our simple parameterized queries
  let pgSql = sql.replace(/\?/g, () => `$${index++}`);
  
  // 2. Data Types
  pgSql = pgSql.replace(/AUTOINCREMENT/gi, 'SERIAL');
  pgSql = pgSql.replace(/DATETIME/gi, 'TIMESTAMP');
  pgSql = pgSql.replace(/REAL/gi, 'DECIMAL(10,2)');
  
  // 3. Functions
  // SQLite: strftime('%Y-%m', 'now') -> Postgres: TO_CHAR(NOW(), 'YYYY-MM')
  pgSql = pgSql.replace(/strftime\('%Y-%m', 'now'\)/gi, "TO_CHAR(NOW(), 'YYYY-MM')");
  
  // SQLite: date(?, '+7 day') -> Postgres: $1::date + interval '7 days'
  // Actually, we can just replace standard text replacements here if we know the exact queries:
  pgSql = pgSql.replace(/date\(\$1, '\+7 day'\)/gi, "$1::date + interval '7 days'");

  return pgSql;
}

export const db = {
  prepare: (sql: string) => {
    const pgSql = convertSqliteToPostgres(sql);
    
    return {
      run: async (...args: any[]) => {
        try {
           const res = await pool.query(pgSql, args);
           // PG does not return lastInsertRowid inherently without RETURNING id
           // For simple compatibility we just return rowCount
           return { changes: res.rowCount || 0, lastInsertRowid: res.rows[0]?.id || 0 };
        } catch(e) {
           console.error("DB RUN ERROR:", e, "SQL:", pgSql, "ARGS:", args);
           throw e;
        }
      },
      all: async (...args: any[]) => {
        try {
           const res = await pool.query(pgSql, args);
           return res.rows;
        } catch(e) {
           console.error("DB ALL ERROR:", e, "SQL:", pgSql, "ARGS:", args);
           return [];
        }
      },
      get: async (...args: any[]) => {
        try {
           const res = await pool.query(pgSql, args);
           return res.rows[0] || null;
        } catch(e) {
           console.error("DB GET ERROR:", e, "SQL:", pgSql, "ARGS:", args);
           return null;
        }
      }
    };
  }
};

export default db;
