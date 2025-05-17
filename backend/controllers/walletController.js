// C:\Users\HUAWEI\blockchain-mikro-odeme\backend\controllers\walletController.js

const blockchainService = require('../services/blockchainService');
const Transaction = require('../blockchain/Transaction');

// Cüzdan bakiyesini getir
exports.getWalletBalance = async (req, res) => {
  try {
    const balance = await blockchainService.getBalance(req.user.walletAddress);
    res.json({ balance });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Bakiye yükleme
exports.addFunds = async (req, res) => {
  try {
    const { amount, privateKey } = req.body;
    
    if (!amount || parseFloat(amount) <= 0) {
      return res.status(400).json({ message: 'Geçerli bir miktar girmelisiniz' });
    }
    
    // Bakiye yükleme işlemi
    const transaction = await blockchainService.addFunds(
      req.user.walletAddress,
      parseFloat(amount),
      privateKey
    );
    
    res.status(201).json({
      success: true,
      message: `${amount} MikroCoin başarıyla yüklendi`,
      transaction: {
        _id: transaction.signature.substring(0, 24),
        from: transaction.fromAddress,
        to: transaction.toAddress,
        amount: transaction.amount,
        description: transaction.description,
        timestamp: transaction.timestamp,
        status: 'COMPLETED'
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};