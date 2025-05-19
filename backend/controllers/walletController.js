// backend/controllers/walletController.js

const blockchainService = require('../services/blockchainService');
const Transaction = require('../blockchain/Transaction');

// Cüzdan bakiyesini getir - Sadece tamamlanmış işlemleri dahil et
exports.getWalletBalance = async (req, res) => {
  try {
    // onlyCompleted parametresini al (varsayılan olarak true)
    const onlyCompleted = req.query.onlyCompleted !== 'false';
    
    // Tamamlanmış işlemleri kullanarak bakiyeyi hesapla
    const balance = await blockchainService.getBalance(req.user.walletAddress, onlyCompleted);
    
    // Bekleyen işlemler için ayrı bir bakiye hesapla
    const pendingAmount = await blockchainService.getPendingBalance(req.user.walletAddress);
    
    // API yanıtını oluştur
    res.json({ 
      balance: balance,
      pendingAmount: pendingAmount,
      totalBalance: balance + pendingAmount,
      includesPending: !onlyCompleted,
      userId: req.user._id // Güvenlik kontrolü için kullanıcı ID'sini de döndür
    });
  } catch (error) {
    console.error('Bakiye getirme hatası:', error);
    res.status(500).json({ message: error.message || 'Bakiye alınamadı' });
  }
};

// Bakiye yükleme - İşlem durumu kontrolü eklendi
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
    
    // İşlem durumunu kontrol et - Backend'de hemen tamamlandı olarak işaretlenebilir
    // veya beklemede olarak döndürülebilir
    const transactionStatus = 'PENDING'; // veya 'COMPLETED' - sistem tasarımına göre
    
    res.status(201).json({
      success: true,
      message: `${amount} MikroCoin başarıyla yüklendi${transactionStatus === 'PENDING' ? ' ve işleniyor' : ''}`,
      transaction: {
        _id: transaction.signature.substring(0, 24),
        from: transaction.fromAddress,
        to: transaction.toAddress,
        amount: transaction.amount,
        description: transaction.description,
        timestamp: transaction.timestamp,
        status: transactionStatus
      }
    });
  } catch (error) {
    console.error('Bakiye yükleme hatası:', error);
    res.status(500).json({ message: error.message || 'Bakiye yüklenemedi' });
  }
};