// backend/routes/walletRoutes.js

const express = require('express');
const { getWalletBalance, addFunds } = require('../controllers/walletController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Cüzdan bakiyesini getir
router.get('/balance', protect, getWalletBalance);

// Bakiye yükleme
router.post('/add-funds', protect, addFunds);

module.exports = router;