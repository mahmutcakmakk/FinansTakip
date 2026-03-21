const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(process.cwd(), 'database.sqlite');
const db = new Database(dbPath);

console.log('Veritabanı oluşturuluyor...');

// Kategoriler Tablosu
db.exec(`
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    name TEXT NOT NULL
  )
`);

// İşlemler (Gelir/Gider) Tablosu
db.exec(`
  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    amount REAL NOT NULL,
    categoryId INTEGER,
    description TEXT,
    date TEXT NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(categoryId) REFERENCES categories(id)
  )
`);

// Borç/Alacak Tablosu
db.exec(`
  CREATE TABLE IF NOT EXISTS debts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    personName TEXT NOT NULL,
    amount REAL NOT NULL,
    dueDate TEXT NOT NULL,
    status TEXT DEFAULT 'UNPAID',
    description TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Varsayılan Kategorileri Ekle (Eğer boşsa)
const catCount = db.prepare('SELECT COUNT(*) as count FROM categories').get();
if (catCount.count === 0) {
  const insert = db.prepare('INSERT INTO categories (type, name) VALUES (?, ?)');
  const defaultCats = [
    ['INCOME', 'POS Geliri (Website)'],
    ['INCOME', 'Havale / EFT'],
    ['INCOME', 'Elden Nakit'],
    ['EXPENSE', 'Reklam Gideri'],
    ['EXPENSE', 'Yemek'],
    ['EXPENSE', 'Yakıt'],
    ['EXPENSE', 'Mutfak / Sarf Malzeme'],
    ['EXPENSE', 'Fatura (İnternet, Elekt vb.)'],
    ['EXPENSE', 'Diğer'],
  ];
  
  const insertMany = db.transaction((cats) => {
    for (const cat of cats) insert.run(cat[0], cat[1]);
  });
  
  insertMany(defaultCats);
  console.log('Varsayılan kategoriler eklendi!');
}

console.log('✅ SQLite Veritabanı Kurulumu Tamamlandı (Hata Yok!)!');
