// backend/controllers/transactionController.js

const Transaction = require('../blockchain/Transaction');
const blockchainService = require('../services/blockchainService');
const TransactionModel = require('../models/TransactionModel');

// Tüm işlemleri getir - Admin kontrolü ve güvenlik eklendi
exports.getAllTransactions = async (req, res) => {
  try {
    console.log('getAllTransactions endpoint çağrıldı');
    
    // Admin kontrolü eklendi
    if (!req.user.isAdmin) {
      return res.status(403).json({ 
        message: 'Bu işlem için yetkiniz bulunmamaktadır. Sadece yöneticiler tüm işlemleri görüntüleyebilir.' 
      });
    }
    
    const transactions = blockchainService.getAllTransactions();
    
    // İşlemleri formatla - tutarlı alan adları kullan
    const formattedTransactions = transactions.map(tx => ({
      _id: tx.signature ? tx.signature.substring(0, 24) : `tx_${tx.timestamp}`,
      from: tx.fromAddress || 'Sistem',
      to: tx.toAddress,
      amount: tx.amount,
      description: tx.description,
      timestamp: tx.timestamp,
      blockIndex: tx.blockIndex,
      blockTimestamp: tx.blockTimestamp,
      status: tx.blockIndex ? 'COMPLETED' : 'PENDING'
    }));
    
    res.json(formattedTransactions);
  } catch (error) {
    console.error('İşlemleri getirme hatası:', error);
    res.status(500).json({ message: error.message || 'İşlemler alınamadı' });
  }
};

// Kullanıcının işlemlerini getir - Daha güvenli hale getirildi
exports.getMyTransactions = async (req, res) => {
  try {
    console.log('getMyTransactions endpoint çağrıldı');
    const userAddress = req.user.walletAddress;
    
    if (!userAddress) {
      return res.status(400).json({ message: 'Cüzdan adresi bulunamadı' });
    }
    
    const allTransactions = blockchainService.getAllTransactions();
    
    // Kullanıcının işlemlerini filtrele - SADECE kendi işlemlerini
    const userTransactions = allTransactions.filter(tx => 
      tx.fromAddress === userAddress || tx.toAddress === userAddress
    );
    
    // İşlemleri formatla - tutarlı alan adları ve daha ayrıntılı bilgi
    const formattedTransactions = userTransactions.map(tx => ({
      _id: tx.signature ? tx.signature.substring(0, 24) : `tx_${tx.timestamp}`,
      from: tx.fromAddress || 'Sistem',
      to: tx.toAddress,
      amount: tx.amount,
      description: tx.description,
      timestamp: tx.timestamp,
      blockIndex: tx.blockIndex,
      blockTimestamp: tx.blockTimestamp,
      type: tx.fromAddress === userAddress ? 'OUT' : 'IN',
      status: tx.blockIndex ? 'COMPLETED' : 'PENDING'
    }));
    
    res.json(formattedTransactions);
  } catch (error) {
    console.error('Kullanıcı işlemlerini getirme hatası:', error);
    res.status(500).json({ message: error.message || 'İşlemler alınamadı' });
  }
};

// İşlem detayını getir - Kullanıcı erişim kontrolü eklendi
exports.getTransactionById = async (req, res) => {
  try {
    console.log(`getTransactionById endpoint çağrıldı: ${req.params.id}`);
    const txId = req.params.id;
    const userAddress = req.user.walletAddress;
    
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
    
    // Kullanıcının kendi işlemi olup olmadığını kontrol et
    if (transaction.fromAddress !== userAddress && transaction.toAddress !== userAddress && !req.user.isAdmin) {
      return res.status(403).json({ 
        message: 'Bu işlemi görüntüleme yetkiniz bulunmamaktadır'
      });
    }
    
    // İşlemi formatla
    const formattedTransaction = {
      _id: transaction.signature ? transaction.signature.substring(0, 24) : `tx_${transaction.timestamp}`,
      from: transaction.fromAddress || 'Sistem',
      to: transaction.toAddress,
      amount: transaction.amount,
      description: transaction.description,
      timestamp: transaction.timestamp,
      blockIndex: transaction.blockIndex,
      blockTimestamp: transaction.blockTimestamp,
      status: transaction.blockIndex ? 'COMPLETED' : 'PENDING',
      type: transaction.fromAddress === userAddress ? 'OUT' : 'IN'
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
          _id: transaction.signature ? transaction.signature.substring(0, 24) : `tx_${transaction.timestamp}`,
          from: transaction.fromAddress,
          to: transaction.toAddress,
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

// İşlem onaylama - Kullanıcı yetki kontrolü eklendi
exports.processTransaction = async (req, res) => {
  try {
    const { privateKey } = req.body;
    const transactionId = req.params.id;
    const userAddress = req.user.walletAddress;
    
    if (!privateKey) {
      return res.status(400).json({ message: 'Özel anahtar gereklidir' });
    }
    
    // İşlemi bul
    const allTransactions = blockchainService.getAllTransactions();
    const pendingTransactions = allTransactions.filter(tx => !tx.blockIndex);
    
    const transaction = pendingTransactions.find(tx => {
      if (tx.signature) {
        return tx.signature.substring(0, 24) === transactionId;
      }
      return false;
    });
    
    if (!transaction) {
      return res.status(404).json({ message: 'İşlem bulunamadı veya zaten tamamlanmış' });
    }
    
    // Kullanıcının kendi gönderdiği işlem olup olmadığını kontrol et
    if (transaction.fromAddress !== userAddress) {
      return res.status(403).json({ 
        message: 'Bu işlemi onaylama yetkiniz bulunmamaktadır. Sadece kendi gönderdiğiniz işlemleri onaylayabilirsiniz.'
      });
    }
    
    // İşlemi işle/onayla
    const result = await blockchainService.processTransaction(transactionId, privateKey);
    
    res.json({
      success: true,
      message: 'İşlem başarıyla onaylandı',
      transaction: {
        _id: transaction.signature ? transaction.signature.substring(0, 24) : `tx_${transaction.timestamp}`,
        from: transaction.fromAddress,
        to: transaction.toAddress,
        amount: transaction.amount,
        timestamp: transaction.timestamp,
        status: 'COMPLETED'
      }
    });
  } catch (error) {
    console.error('İşlem onaylama hatası:', error);
    res.status(500).json({ message: error.message || 'İşlem onaylanamadı' });
  }
};

// İşlem durumlarını senkronize et
exports.syncTransactionStatus = async (req, res) => {
  try {
    console.log('İşlem durumları senkronize ediliyor...');
    
    // Tüm bekleyen işlemleri veritabanından al
    const pendingTxs = await TransactionModel.find({ processed: false });
    
    // Blockchain'den tüm işlemleri al (sadece madencilik yapılmış olanlar)
    const blockchainTxs = blockchainService.getAllTransactions();
    
    // Eşleşen işlemleri güncelle
    let updatedCount = 0;
    for (const pendingTx of pendingTxs) {
      // İşlemin imzasına göre blockchain'de ara
      const matchingTx = blockchainTxs.find(tx => 
        tx.signature === pendingTx.signature && tx.blockIndex !== undefined
      );
      
      if (matchingTx) {
        // İşlemi "işlenmiş" olarak güncelle
        await TransactionModel.findOneAndUpdate(
          { signature: pendingTx.signature },
          { processed: true, blockIndex: matchingTx.blockIndex, status: 'COMPLETED' }
        );
        updatedCount++;
      }
    }
    
    // Güncelleme sonuçlarını döndür
    res.json({ 
      success: true, 
      message: `${updatedCount} işlem senkronize edildi.`,
      pendingTransactions: pendingTxs.length - updatedCount
    });
  } catch (error) {
    console.error('İşlem durumu senkronizasyon hatası:', error);
    res.status(500).json({ message: error.message || 'İşlem durumları senkronize edilemedi' });
  }
};