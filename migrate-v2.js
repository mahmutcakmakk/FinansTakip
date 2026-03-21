const Database = require('better-sqlite3');
const path = require('path');
const dbPath = path.join(process.cwd(), 'database.sqlite');

try {
  const db = new Database(dbPath);
  console.log('Veritabanına bağlanıldı, Aşama 3 göçü başlatılıyor...');

  db.exec('BEGIN TRANSACTION;');

  // 1. Yeni Tabloları Yarat
  db.exec(`
    CREATE TABLE IF NOT EXISTS profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS wallets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      profileId INTEGER NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'CASH', -- CASH, BANK, POS vs.
      balance REAL DEFAULT 0,
      FOREIGN KEY(profileId) REFERENCES profiles(id)
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      profileId INTEGER NOT NULL,
      name TEXT NOT NULL,
      phone TEXT,
      address TEXT,
      notes TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(profileId) REFERENCES profiles(id)
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS todos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      profileId INTEGER NOT NULL,
      text TEXT NOT NULL,
      isCompleted INTEGER DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(profileId) REFERENCES profiles(id)
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      profileId INTEGER NOT NULL,
      name TEXT NOT NULL,
      amount REAL NOT NULL,
      categoryId INTEGER,
      dueDay INTEGER, -- Her ayın kaçıncı günü (1-31)
      FOREIGN KEY(profileId) REFERENCES profiles(id),
      FOREIGN KEY(categoryId) REFERENCES categories(id) ON DELETE SET NULL
    );
  `);

  // 2. Default (Varsayılan) Profilleri Yarat
  // mahmut, muhammet, ortak (Hepsinin şifresi 'asdas')
  // Basitlik ve lokal kullanım nedeniyle hash kullanılmayacak.
  const checkProfiles = db.prepare('SELECT COUNT(*) as count FROM profiles').get();
  let ortakId = 1;
  let mahmutId = 2;
  let muhammetId = 3;

  if (checkProfiles.count === 0) {
    const insertProfile = db.prepare('INSERT INTO profiles (id, username, password, name) VALUES (?, ?, ?, ?)');
    insertProfile.run(ortakId, 'ortak', 'asdas', 'Ortak Kasa');
    insertProfile.run(mahmutId, 'mahmut', 'asdas', 'Mahmut Çakmak');
    insertProfile.run(muhammetId, 'muhammet', 'asdas', 'Muhammet');
    console.log('Varsayılan profiller (mahmut, muhammet, ortak - şifre: asdas) oluşturuldu.');
  }

  // 3. Mevcut Tablolara `profileId` kolonunu ekle (eğer yoksa)
  const addColumnIfNotExists = (tableName, columnName, defaultValue, additionalColumns = []) => {
    const tableInfo = db.prepare(`PRAGMA table_info(${tableName})`).all();
    const hasColumn = tableInfo.some(col => col.name === columnName);
    
    if (!hasColumn) {
      db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} INTEGER DEFAULT ${defaultValue}`);
      console.log(`[+] ${tableName} tablosuna '${columnName}' kolonu ve verisi eklendi.`);
    }

    for (const addCol of additionalColumns) {
         const hasAddCol = tableInfo.some(col => col.name === addCol.name);
         if(!hasAddCol) {
             db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${addCol.name} ${addCol.type}`);
             console.log(`[+] ${tableName} tablosuna '${addCol.name}' kolonu eklendi.`);
         }
    }
  };

  // Mevcut verileri kaybetmemek için varsayılan olarak 'ortakId'sine atıyoruz
  addColumnIfNotExists('categories', 'profileId', ortakId);
  addColumnIfNotExists('transactions', 'profileId', ortakId, [
      {name: 'walletId', type: 'INTEGER'},
      {name: 'customerId', type: 'INTEGER'}
  ]);
  addColumnIfNotExists('debts', 'profileId', ortakId, [
      {name: 'customerId', type: 'INTEGER'}
  ]);

  db.exec('COMMIT;');
  console.log('✅ Veritabanı Mimarisi Aşama 3 Çoklu Kullanıcı (Profiller) İçin Başarıyla Güncellendi!');

} catch (err) {
  console.error('Göç sırasında hata oluştu: ', err);
}
