// C:\Users\HUAWEI\blockchain-mikro-odeme\backend\routes\transactionRoutes.js

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const transactionController = require('../controllers/transactionController');

// Tüm işlemleri getir
router.get('/all', protect, transactionController.getAllTransactions);

// Kullanıcının işlemlerini getir
router.get('/my', protect, transactionController.getMyTransactions);

// İşlem detayı
router.get('/:id', protect, transactionController.getTransactionById);

// Yeni işlem oluştur
router.post('/create', protect, transactionController.createTransaction);

// transactionRoutes.js dosyasına ekleyeceğiniz route
// Bu route'u mevcut transactionRoutes.js dosyanızdaki diğer route'ların yanına ekleyin

// Senkronizasyon endpoint'i
router.post('/sync-status', protect, transactionController.syncTransactionStatus);

module.exports = router;