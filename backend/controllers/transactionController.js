// C:\Users\HUAWEI\blockchain-mikro-odeme\backend\controllers\transactionController.js

const Transaction = require('../blockchain/Transaction');
const blockchainService = require('../services/blockchainService');

// Tüm işlemleri getir
exports.getAllTransactions = async (req, res) => {
  try {
    console.log('getAllTransactions endpoint çağrıldı');
    const transactions = blockchainService.getAllTransactions();
    
    // İşlemleri formatla
    const formattedTransactions = transactions.map(tx => ({
      id: tx.signature ? tx.signature.substring(0, 24) : `tx_${tx.timestamp}`,
      fromAddress: tx.fromAddress || 'Sistem',
      toAddress: tx.toAddress,
      amount: tx.amount,
      description: tx.description,
      timestamp: tx.timestamp,
      blockIndex: tx.blockIndex,
      blockTimestamp: tx.blockTimestamp
    }));
    
    res.json(formattedTransactions);
  } catch (error) {
    console.error('İşlemleri getirme hatası:', error);
    res.status(500).json({ message: error.message || 'İşlemler alınamadı' });
  }
};

// Kullanıcının işlemlerini getir
exports.getMyTransactions = async (req, res) => {
  try {
    console.log('getMyTransactions endpoint çağrıldı');
    const userAddress = req.user.walletAddress;
    
    if (!userAddress) {
      return res.status(400).json({ message: 'Cüzdan adresi bulunamadı' });
    }
    
    const allTransactions = blockchainService.getAllTransactions();
    
    // Kullanıcının işlemlerini filtrele
    const userTransactions = allTransactions.filter(tx => 
      tx.fromAddress === userAddress || tx.toAddress === userAddress
    );
    
    // İşlemleri formatla
    const formattedTransactions = userTransactions.map(tx => ({
      id: tx.signature ? tx.signature.substring(0, 24) : `tx_${tx.timestamp}`,
      fromAddress: tx.fromAddress || 'Sistem',
      toAddress: tx.toAddress,
      amount: tx.amount,
      description: tx.description,
      timestamp: tx.timestamp,
      blockIndex: tx.blockIndex,
      blockTimestamp: tx.blockTimestamp,
      type: tx.fromAddress === userAddress ? 'OUT' : 'IN'
    }));
    
    res.json(formattedTransactions);
  } catch (error) {
    console.error('Kullanıcı işlemlerini getirme hatası:', error);
    res.status(500).json({ message: error.message || 'İşlemler alınamadı' });
  }
};

// İşlem detayını getir
exports.getTransactionById = async (req, res) => {
  try {
    console.log(`getTransactionById endpoint çağrıldı: ${req.params.id}`);
    const txId = req.params.id;
    
    const allTransactions = blockchainService.getAllTransactions();
    
    // İşlemi bul
    const transaction = allTransactions.find(tx => {
      if (tx.signature) {
        return tx.signature.substring(0, 24) === txId;
      }
      return false;
    });
    
    if (!transaction) {
      return res.status(404).json({ message: 'İşlem bulunamadı' });
    }
    
    // İşlemi formatla
    const formattedTransaction = {
      id: transaction.signature ? transaction.signature.substring(0, 24) : `tx_${transaction.timestamp}`,
      fromAddress: transaction.fromAddress || 'Sistem',
      toAddress: transaction.toAddress,
      amount: transaction.amount,
      description: transaction.description,
      timestamp: transaction.timestamp,
      blockIndex: transaction.blockIndex,
      blockTimestamp: transaction.blockTimestamp
    };
    
    res.json(formattedTransaction);
  } catch (error) {
    console.error('İşlem detayı getirme hatası:', error);
    res.status(500).json({ message: error.message || 'İşlem alınamadı' });
  }
};

// Yeni işlem oluştur
exports.createTransaction = async (req, res) => {
  try {
    console.log('createTransaction endpoint çağrıldı');
    const { toAddress, amount, description, privateKey } = req.body;
    
    // Gerekli alanları kontrol et
    if (!toAddress || !amount || !privateKey) {
      return res.status(400).json({ 
        message: 'Alıcı adresi, miktar ve özel anahtar gereklidir' 
      });
    }
    
    // Miktarı kontrolü
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ message: 'Geçerli bir miktar girmelisiniz' });
    }
    
    const fromAddress = req.user.walletAddress;
    
    try {
      // İşlemi oluştur
      const transaction = await blockchainService.createTransaction(
        fromAddress,
        toAddress,
        numericAmount,
        description || 'Transfer',
        privateKey
      );
      
      res.status(201).json({
        success: true,
        message: `${numericAmount} MikroCoin başarıyla gönderildi`,
        transaction: {
          id: transaction.signature ? transaction.signature.substring(0, 24) : `tx_${transaction.timestamp}`,
          fromAddress: transaction.fromAddress,
          toAddress: transaction.toAddress,
          amount: transaction.amount,
          description: transaction.description,
          timestamp: transaction.timestamp,
          status: 'PENDING'
        }
      });
    } catch (blockchainError) {
      console.error('İşlem oluşturma hatası:', blockchainError);
      res.status(400).json({ message: blockchainError.message || 'İşlem oluşturulamadı' });
    }
  } catch (error) {
    console.error('İşlem oluşturma genel hatası:', error);
    res.status(500).json({ message: error.message || 'Sunucu hatası' });
  }
};