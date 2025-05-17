// C:\Users\HUAWEI\blockchain-mikro-odeme\backend\server.js
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const userRoutes = require('./routes/userRoutes');
const walletRoutes = require('./routes/walletRoutes');
const blockchainRoutes = require('./routes/blockchainRoutes');
const transactionRoutes = require('./routes/transactionRoutes'); // Eklendi

// .env dosyasını yükle
dotenv.config();

// Test modunu kontrol et - env yoksa varsayılan olarak development olsun
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

// True değeri için doğru string kontrolü
const isTrue = (value) => value === 'true' || value === true || value === '1' || value === 1;

// Test modu kontrolü
const testMode = isTrue(process.env.USE_TEST_MODE) || process.env.NODE_ENV === 'development';

// Test modu ayarını global olarak yap (diğer modüllerin erişebilmesi için)
process.env.USE_TEST_MODE = testMode ? 'true' : 'false';

console.log('=== Blockchain Mikro Ödeme API ===');
console.log(`Test modu: ${testMode ? 'AKTİF' : 'KAPALI'}`);
console.log(`Ortam: ${process.env.NODE_ENV}`);
console.log(`USE_TEST_MODE: ${process.env.USE_TEST_MODE}`);
console.log(`JWT_SECRET (ilk 5 karakter): ${process.env.JWT_SECRET ? process.env.JWT_SECRET.substring(0, 5) + '...' : 'TANIMLANMAMIŞ'}`);
console.log(`MONGO_URI: ${process.env.MONGO_URI ? process.env.MONGO_URI : 'TANIMLANMAMIŞ'}`);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());  // JSON verilerini işle

// CORS yapılandırması - CORS hatalarını önlemek için
app.use(cors({
  origin: '*', // Geliştirme için tüm origins'lere izin ver
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Auth middleware
const { protect } = require('./middleware/auth');

// Debug amaçlı middleware - her isteği logla
app.use((req, res, next) => {
  const start = Date.now();
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  
  // İstek gövdesini logla
  if (['POST', 'PUT'].includes(req.method) && req.body) {
    console.log('Request body:', req.body);
  }
  
  // İstek tamamlandığında log
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - ${res.statusCode} (${duration}ms)`);
  });
  
  next();
});

// API rotaları
app.use('/api/users', userRoutes);
app.use('/api/wallet', protect, walletRoutes);
app.use('/api/blockchain', blockchainRoutes);
app.use('/api/transactions', transactionRoutes); // Eklendi

// Ana sayfa rotası
app.get('/', (req, res) => {
  res.json({ 
    message: 'MikroCoin Blockchain API çalışıyor!',
    testMode: testMode
  });
});

// Basit hata işleme middleware'leri
// 404 hatası
app.use((req, res, next) => {
  res.status(404).json({ message: `${req.originalUrl} yolu bulunamadı` });
});

// Genel hata işleme
app.use((err, req, res, next) => {
  console.error('Sunucu hatası:', err);
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
});

// MongoDB bağlantısı
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/blockchain-mikro-odeme';
mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('MongoDB bağlantısı başarılı!');
    // Sunucuyu başlat
    app.listen(PORT, () => console.log(`Sunucu ${PORT} portunda çalışıyor!`));
  })
  .catch((error) => {
    console.error('MongoDB bağlantı hatası:', error.message);
  });