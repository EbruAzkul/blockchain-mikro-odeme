// backend/routes/transactionRoutes.js

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { isAdmin } = require('../middleware/adminMiddleware');
const transactionController = require('../controllers/transactionController');

// Tüm işlemleri getir - sadece admin erişebilir
router.get('/all', protect, isAdmin, transactionController.getAllTransactions);

// Kullanıcının kendi işlemlerini getir
router.get('/my', protect, transactionController.getMyTransactions);

// İşlem detayı - kendi işlemini görüntüleme kontrolü eklenecek
router.get('/:id', protect, transactionController.getTransactionById);

// Yeni işlem oluştur
router.post('/create', protect, transactionController.createTransaction);

// İşlem işleme/onaylama
router.post('/:id/process', protect, transactionController.processTransaction);

// Senkronizasyon endpoint'i
router.post('/sync-status', protect, transactionController.syncTransactionStatus);

module.exports = router;