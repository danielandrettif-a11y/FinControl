import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cron from 'node-cron';
import path from 'path';
import Database from 'better-sqlite3';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_ponytail';

// ponytail: better-sqlite3 instead of Prisma — zero native binary drama on Alpine
const db = new Database(path.join(process.cwd(), 'data.db'));
db.pragma('journal_mode = WAL');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    passwordHash TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER UNIQUE NOT NULL,
    monthlyLimit REAL DEFAULT 2000,
    exchangeRateUsdBrl REAL DEFAULT 5.10,
    FOREIGN KEY (userId) REFERENCES users(id)
  );
  CREATE TABLE IF NOT EXISTS credit_cards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    name TEXT NOT NULL,
    flag TEXT DEFAULT '',
    color TEXT DEFAULT '#6366f1',
    imageUrl TEXT DEFAULT '',
    closingDay INTEGER DEFAULT 1,
    dueDay INTEGER DEFAULT 10,
    FOREIGN KEY (userId) REFERENCES users(id)
  );
  CREATE TABLE IF NOT EXISTS credit_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cardId INTEGER NOT NULL,
    description TEXT NOT NULL,
    amount REAL NOT NULL,
    date TEXT NOT NULL,
    category TEXT DEFAULT 'Outros',
    installments INTEGER DEFAULT 1,
    isUsd INTEGER DEFAULT 0,
    FOREIGN KEY (cardId) REFERENCES credit_cards(id) ON DELETE CASCADE
  );
  CREATE TABLE IF NOT EXISTS crypto_cards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#f59e0b',
    imageUrl TEXT DEFAULT '',
    FOREIGN KEY (userId) REFERENCES users(id)
  );
  CREATE TABLE IF NOT EXISTS crypto_topups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cardId INTEGER NOT NULL,
    amount REAL NOT NULL,
    date TEXT NOT NULL,
    FOREIGN KEY (cardId) REFERENCES crypto_cards(id) ON DELETE CASCADE
  );
  CREATE TABLE IF NOT EXISTS crypto_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cardId INTEGER NOT NULL,
    description TEXT NOT NULL,
    amount REAL NOT NULL,
    date TEXT NOT NULL,
    category TEXT DEFAULT 'Outros',
    FOREIGN KEY (cardId) REFERENCES crypto_cards(id) ON DELETE CASCADE
  );
`);

app.use(cors());
app.use(express.json());

// Auth Middleware
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// --- AUTH ROUTES ---
app.post('/api/auth/register', async (req, res) => {
  const { email, password } = req.body;
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const result = db.prepare('INSERT INTO users (email, passwordHash) VALUES (?, ?)').run(email, passwordHash);
    const userId = result.lastInsertRowid;
    db.prepare('INSERT INTO settings (userId) VALUES (?)').run(userId);
    const token = jwt.sign({ id: userId }, JWT_SECRET);
    res.json({ token });
  } catch (err) {
    res.status(400).json({ error: 'User already exists or invalid data' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  
  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) return res.status(401).json({ error: 'Invalid credentials' });
  
  const token = jwt.sign({ id: user.id }, JWT_SECRET);
  res.json({ token });
});

// --- DATA ROUTES ---
app.get('/api/data', authMiddleware, (req, res) => {
  try {
    const userId = req.userId;
    const settings = db.prepare('SELECT * FROM settings WHERE userId = ?').get(userId);
    const creditCards = db.prepare('SELECT * FROM credit_cards WHERE userId = ?').all(userId);
    const cryptoCards = db.prepare('SELECT * FROM crypto_cards WHERE userId = ?').all(userId);

    // Attach transactions to each card
    for (const card of creditCards) {
      card.transactions = db.prepare('SELECT * FROM credit_transactions WHERE cardId = ?').all(card.id);
    }
    for (const card of cryptoCards) {
      card.topUps = db.prepare('SELECT * FROM crypto_topups WHERE cardId = ?').all(card.id);
      card.transactions = db.prepare('SELECT * FROM crypto_transactions WHERE cardId = ?').all(card.id);
    }

    res.json({ settings, creditCards, cryptoCards });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

app.post('/api/settings', authMiddleware, (req, res) => {
  try {
    const { monthlyLimit, exchangeRateUsdBrl } = req.body;
    db.prepare('UPDATE settings SET monthlyLimit = ?, exchangeRateUsdBrl = ? WHERE userId = ?')
      .run(monthlyLimit, exchangeRateUsdBrl, req.userId);
    const settings = db.prepare('SELECT * FROM settings WHERE userId = ?').get(req.userId);
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// --- CRON JOB ---
cron.schedule('*/10 * * * *', async () => {
  console.log('[Cron] Fetching real-time rates...');
  try {
    const res = await fetch('https://economia.awesomeapi.com.br/json/last/USD-BRL');
    const data = await res.json();
    if (data?.USDBRL?.bid) {
      const rate = parseFloat(data.USDBRL.bid);
      db.prepare('UPDATE settings SET exchangeRateUsdBrl = ?').run(rate);
      console.log(`[Cron] Updated all settings with rate: R$${rate}`);
    }
  } catch (e) {
    console.error('[Cron] Failed to fetch rates', e);
  }
});

// Serve frontend static files
app.use(express.static(path.join(process.cwd(), 'dist')));
app.use((req, res) => {
  res.sendFile(path.join(process.cwd(), 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
