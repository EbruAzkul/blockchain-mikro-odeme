// backend/routes/blockchainRoutes.js

const express = require('express');
const { 
  getBlockchainInfo, 
  getAllBlocks, 
  getBlockByIndex, 
  mineBlock, 
  validateChain 
} = require('../controllers/blockchainController');
const { protect } = require('../middleware/auth');
const { isAdmin } = require('../middleware/adminMiddleware');

const router = express.Router();

// Temel blockchain bilgisi - Tüm kullanıcılar erişebilir
router.get('/info', protect, getBlockchainInfo);

// Madencilik fonksiyonu - Tüm kullanıcılar erişebilir
router.post('/mine', protect, mineBlock);

// Aşağıdaki detaylı blockchain verilerine sadece admin erişebilir
// Tüm bloklar listesi
router.get('/blocks', protect, isAdmin, getAllBlocks);

// Belirli bir blok detayı
router.get('/blocks/:index', protect, isAdmin, getBlockByIndex);

// Zincir doğrulama
router.get('/validate', protect, isAdmin, validateChain);

module.exports = router;