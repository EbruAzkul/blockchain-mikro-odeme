// C:\Users\HUAWEI\blockchain-mikro-odeme\backend\routes\walletRoutes.js

const express = require('express');
const { getWalletBalance, addFunds } = require('../controllers/walletController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/balance', protect, getWalletBalance);
router.post('/add-funds', protect, addFunds); // Yeni rota

module.exports = router;