// C:\Users\HUAWEI\blockchain-mikro-odeme\backend\controllers\blockchainController.js

const blockchainService = require('../services/blockchainService');

// C:\Users\HUAWEI\blockchain-mikro-odeme\backend\controllers\blockchainController.js içinde getBlockchainInfo fonksiyonunu güncelleyin

// Blockchain bilgilerini getir
exports.getBlockchainInfo = async (req, res) => {
  try {
    const blockchain = blockchainService.blockchain;
    const chain = blockchainService.getBlockchain();
    
    let isValid = true;
    try {
      // isChainValid fonksiyonu hata fırlatabilir, bunu ele alıyoruz
      isValid = blockchainService.isChainValid();
    } catch (validationError) {
      console.error('Zincir doğrulama hatası:', validationError);
      isValid = false;
    }
    
    const chainLength = chain.length;
    const pendingTransactions = blockchain.pendingTransactions ? 
                              blockchain.pendingTransactions.length : 0;
    
    // Son blok bilgilerini daha doğru formatlayın
    const lastBlock = chain.length > 0 ? chain[chain.length - 1] : null;
    
    // Tarih formatını düzelt
    const timestamp = new Date().toISOString();
    
    // Konsola detaylı bilgi yazdırma (debug için)
    console.log("Blockchain Bilgisi:");
    console.log("Zincir Uzunluğu:", chainLength);
    console.log("Son Blok Hash:", lastBlock ? lastBlock.hash : "N/A");
    console.log("Önceki Hash:", lastBlock ? lastBlock.previousHash : "N/A");
    
    res.json({
      chainLength: chainLength,
      isValid,
      pendingTransactions,
      latestBlock: lastBlock ? {
        index: lastBlock.index,
        hash: lastBlock.hash,
        previousHash: lastBlock.previousHash,
        timestamp: lastBlock.timestamp,
        transactionCount: lastBlock.transactions ? lastBlock.transactions.length : 0
      } : null,
      timestamp: timestamp
    });
  } catch (error) {
    console.error('Blockchain bilgisi getirme hatası:', error);
    res.status(500).json({ message: error.message || 'Blockchain bilgileri alınamadı' });
  }
};

// Tüm blokları getir
exports.getAllBlocks = async (req, res) => {
  try {
    const blockchain = blockchainService.getBlockchain();
    res.json(blockchain);
  } catch (error) {
    console.error('Blokları getirme hatası:', error);
    res.status(500).json({ message: error.message || 'Bloklar alınamadı' });
  }
};

// Belirli bir bloğu indekse göre getir
exports.getBlockByIndex = async (req, res) => {
  try {
    const index = parseInt(req.params.index);
    
    if (isNaN(index) || index < 0) {
      return res.status(400).json({ message: 'Geçerli bir blok indeksi giriniz' });
    }
    
    const blockchain = blockchainService.getBlockchain();
    
    if (index >= blockchain.length) {
      return res.status(404).json({ message: `${index} indeksinde bir blok bulunmamaktadır` });
    }
    
    const block = blockchain[index];
    res.json(block);
  } catch (error) {
    console.error('Blok getirme hatası:', error);
    res.status(500).json({ message: error.message || 'Blok alınamadı' });
  }
};

// Yeni blok oluştur (madencilik)
exports.mineBlock = async (req, res) => {
  try {
    const minerAddress = req.user.walletAddress;
    
    if (!minerAddress) {
      return res.status(400).json({ message: 'Geçerli bir madenci adresi gereklidir' });
    }
    
    console.log(`Madencilik işlemi başlatılıyor: Madenci=${minerAddress}`);
    
    const block = await blockchainService.mineBlock(minerAddress);
    
    console.log('Madencilik işlemi tamamlandı:', block);
    
    res.status(201).json({
      success: true,
      message: 'Yeni blok başarıyla oluşturuldu',
      block
    });
  } catch (error) {
    console.error('Madencilik hatası:', error);
    res.status(500).json({ message: error.message || 'Blok oluşturulamadı' });
  }
};

// Blockchain'in geçerliliğini kontrol et
exports.validateChain = async (req, res) => {
  try {
    const isValid = blockchainService.isChainValid();
    
    res.json({
      isValid,
      message: isValid ? 'Blockchain geçerlidir' : 'Blockchain geçerli değildir'
    });
  } catch (error) {
    console.error('Blockchain doğrulama hatası:', error);
    res.status(500).json({ message: error.message || 'Blockchain doğrulanamadı' });
  }
};