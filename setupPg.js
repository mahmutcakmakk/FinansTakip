const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: { rejectUnauthorized: false }
});

async function setupPg() {
  console.log("PostgreSQL Veritabanı tabloları kuruluyor...");
  
  try {
    const query = `
      CREATE TABLE IF NOT EXISTS profiles (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        username VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        geminiApiKey VARCHAR(255) DEFAULT ''
      );

      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        type VARCHAR(20) NOT NULL,
        profileId INTEGER,
        icon VARCHAR(50) DEFAULT 'default'
      );

      CREATE TABLE IF NOT EXISTS wallets (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        type VARCHAR(50) NOT NULL,
        balance DECIMAL(15,2) DEFAULT 0,
        profileId INTEGER
      );

      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        type VARCHAR(20) NOT NULL,
        amount DECIMAL(15,2) NOT NULL,
        categoryId INTEGER,
        walletId INTEGER,
        description TEXT,
        date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        profileId INTEGER
      );

      CREATE TABLE IF NOT EXISTS transfers (
        id SERIAL PRIMARY KEY,
        profileId INTEGER,
        fromWalletId INTEGER,
        toWalletId INTEGER,
        amount DECIMAL(15,2),
        date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        description TEXT
      );

      CREATE TABLE IF NOT EXISTS debts (
        id SERIAL PRIMARY KEY,
        type VARCHAR(20) NOT NULL,
        personName VARCHAR(100) NOT NULL,
        amount DECIMAL(15,2) NOT NULL,
        paidAmount DECIMAL(15,2) DEFAULT 0,
        dueDate TIMESTAMP NOT NULL,
        description TEXT,
        status VARCHAR(20) DEFAULT 'UNPAID',
        profileId INTEGER,
        installments INTEGER DEFAULT 1,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS budgets (
        id SERIAL PRIMARY KEY,
        profileId INTEGER,
        categoryId INTEGER,
        amountLimit DECIMAL(15,2) NOT NULL,
        month VARCHAR(20) NOT NULL
      );

      CREATE TABLE IF NOT EXISTS todos (
        id SERIAL PRIMARY KEY,
        profileId INTEGER NOT NULL,
        title VARCHAR(255) NOT NULL,
        isCompleted INTEGER DEFAULT 0,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS subscriptions (
        id SERIAL PRIMARY KEY,
        profileId INTEGER NOT NULL,
        name VARCHAR(150) NOT NULL,
        amount DECIMAL(15,2) NOT NULL,
        dayOfMonth INTEGER NOT NULL,
        categoryId INTEGER,
        walletId INTEGER,
        lastPaidMonth VARCHAR(20) DEFAULT '',
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS customers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        phone VARCHAR(50),
        address TEXT,
        notes TEXT,
        profileId INTEGER,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS kanban_tasks (
        id SERIAL PRIMARY KEY,
        profileId INTEGER NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        status VARCHAR(50) DEFAULT 'TODO',
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await pool.query(query);
    console.log("✅ Tüm PostgreSQL tabloları başarıyla oluşturuldu.");

    // Varsayılan patron girişi
    const adminCheck = await pool.query("SELECT * FROM profiles WHERE username = 'admin'");
    if (adminCheck.rows.length === 0) {
      await pool.query("INSERT INTO profiles (name, username, password) VALUES ('Patron', 'admin', '123456')");
      console.log("✅ Varsayılan Patron profili oluşturuldu: admin / 123456");
    }

  } catch (error) {
    console.error("HATA:", error);
  } finally {
    pool.end();
  }
}

setupPg();
