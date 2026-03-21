import Database from 'better-sqlite3';
import path from 'path';

// Veritabanı dosyasını projenin kök dizininde oluşturur
const dbPath = path.join(process.cwd(), 'database.sqlite');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL'); // Performans için

export default db;
