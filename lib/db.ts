import { Pool } from 'pg';

// Vercel Environment Variables bazen Production'a yansımadığı için kesin çözüm:
const connectionString = process.env.POSTGRES_URL || "postgresql://neondb_owner:npg_oZjaqVP4RUG0@ep-snowy-smoke-am5kw0yy-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require";

const pool = new Pool({
  connectionString: connectionString,
  ssl: { rejectUnauthorized: false }
});

// SQLite to PostgreSQL Query Converter
function convertSqliteToPostgres(sql: string) {
  let index = 1;

  // 1. Replace ? with $1, $2
  let pgSql = sql.replace(/\?/g, () => `$${index++}`);
  
  // 2. Data Types
  pgSql = pgSql.replace(/AUTOINCREMENT/gi, 'SERIAL');
  pgSql = pgSql.replace(/DATETIME/gi, 'TIMESTAMP');
  pgSql = pgSql.replace(/REAL/gi, 'DECIMAL(10,2)');
  
  // 3. PostgreSQL Date Operations & Casting Fixes
  pgSql = pgSql.replace(/strftime\('%Y-%m', 'now'\)/gi, "TO_CHAR(NOW(), 'YYYY-MM')");
  
  // TIMESTAMP tipindeki 'date' kolonu LIKE ile kullanılamaz (örn: date LIKE '2023-10%'), metne çevrilmeli:
  pgSql = pgSql.replace(/date LIKE/gi, 'date::text LIKE');
  
  // dueDate <= date($1, '+7 day') tarzı SQLite kurgularını Postgres formatına çevir:
  pgSql = pgSql.replace(/date\(\$([0-9]+),\s*'\+7 day'\)/gi, "$$$1::date + interval '7 days'");

  // date = ? tarzı eşitlikleri 'date::date =' yaparak zaman dilimini yoksay (sadece gün eşleştir):
  pgSql = pgSql.replace(/date = \$/gi, 'date::date = $');

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
