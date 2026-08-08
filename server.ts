import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cron from 'node-cron';
import path from 'path';

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_ponytail';

app.use(cors());
app.use(express.json());

// Auth Middleware
const authMiddleware = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
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
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        settings: {
          create: {
            monthlyLimit: 2000,
            exchangeRateUsdBrl: 5.10
          }
        }
      }
    });
    const token = jwt.sign({ id: user.id }, JWT_SECRET);
    res.json({ token });
  } catch (err) {
    res.status(400).json({ error: 'User already exists or invalid data' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  
  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) return res.status(401).json({ error: 'Invalid credentials' });
  
  const token = jwt.sign({ id: user.id }, JWT_SECRET);
  res.json({ token });
});

// --- DATA ROUTES ---
app.get('/api/data', authMiddleware, async (req: any, res: any) => {
  try {
    const userId = req.userId;
    const settings = await prisma.settings.findUnique({ where: { userId } });
    const creditCards = await prisma.creditCard.findMany({ where: { userId }, include: { transactions: true } });
    const cryptoCards = await prisma.cryptoCard.findMany({ where: { userId }, include: { topUps: true, transactions: true } });
    
    res.json({
      settings,
      creditCards,
      cryptoCards
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

app.post('/api/settings', authMiddleware, async (req: any, res: any) => {
  try {
    const { monthlyLimit, exchangeRateUsdBrl } = req.body;
    const settings = await prisma.settings.update({
      where: { userId: req.userId },
      data: { monthlyLimit, exchangeRateUsdBrl }
    });
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

import path from 'path';

// --- CRON JOB ---
// Runs every 10 minutes to update exchange rates globally
cron.schedule('*/10 * * * *', async () => {
  console.log('[Cron] Fetching real-time rates...');
  try {
    const res = await fetch('https://economia.awesomeapi.com.br/json/last/USD-BRL');
    const data = await res.json();
    if (data?.USDBRL?.bid) {
      const rate = parseFloat(data.USDBRL.bid);
      await prisma.settings.updateMany({
        data: { exchangeRateUsdBrl: rate }
      });
      console.log(`[Cron] Updated all settings with rate: R$${rate}`);
    }
  } catch (e) {
    console.error('[Cron] Failed to fetch rates', e);
  }
});

// Serve frontend static files
app.use(express.static(path.join(process.cwd(), 'dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
