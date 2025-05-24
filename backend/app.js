// backend/app.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Dotenv config
dotenv.config();

// DB bağlantısı
connectDB();

const app = express();

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Routes
const userRoutes = require('./routes/userRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const walletRoutes = require('./routes/walletRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');

// Routes
app.use('/api/users', userRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/subscriptions', subscriptionRoutes);

// Subscription service'i başlat
const subscriptionService = require('./services/subscriptionService');

// Basit test rotası
app.get('/', (req, res) => {
  res.send('API çalışıyor! Blockchain Mikro Ödeme Sistemi API\'sine hoş geldiniz.');
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'Test endpoint çalışıyor!' });
});

module.exports = app;