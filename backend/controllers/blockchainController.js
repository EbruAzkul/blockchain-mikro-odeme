// Backend tarafında ihtiyacınız olacak diğer kritik dosya - blockchainController.js

// backend/controllers/blockchainController.js

const blockchainService = require('../services/blockchainService');

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
    
    // Kullanıcının bekleyen işlem sayısını hesapla
    const userAddress = req.user.walletAddress;
    const userPendingTransactions = blockchain.pendingTransactions
      ? blockchain.pendingTransactions.filter(tx => 
          tx.fromAddress === userAddress || tx.toAddress === userAddress
        ).length
      : 0;
    
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
      userPendingTransactions,
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

// Tüm blokları getir - Sadece admin
exports.getAllBlocks = async (req, res) => {
  try {
    // Admin kontrolü middleware tarafından yapılıyor
    const blockchain = blockchainService.getBlockchain();
    
    // Blokları formatlayarak döndür
    const formattedBlocks = blockchain.map(block => ({
      index: block.index,
      hash: block.hash,
      previousHash: block.previousHash,
      timestamp: block.timestamp,
      nonce: block.nonce,
      transactionCount: block.transactions ? block.transactions.length : 0
    }));
    
    res.json(formattedBlocks);
  } catch (error) {
    console.error('Blokları getirme hatası:', error);
    res.status(500).json({ message: error.message || 'Bloklar alınamadı' });
  }
};

// Belirli bir bloğu indekse göre getir - Sadece admin
exports.getBlockByIndex = async (req, res) => {
  try {
    // Admin kontrolü middleware tarafından yapılıyor
    const index = parseInt(req.params.index);
    
    if (isNaN(index) || index < 0) {
      return res.status(400).json({ message: 'Geçerli bir blok indeksi giriniz' });
    }
    
    const blockchain = blockchainService.getBlockchain();
    
    if (index >= blockchain.length) {
      return res.status(404).json({ message: `${index} indeksinde bir blok bulunmamaktadır` });
    }
    
    const block = blockchain[index];
    
    // Formatlayarak döndür - Çok fazla veri içermesini önle
    const formattedBlock = {
      index: block.index,
      hash: block.hash,
      previousHash: block.previousHash,
      timestamp: block.timestamp,
      nonce: block.nonce,
      transactions: block.transactions.map(tx => ({
        from: tx.fromAddress || 'Sistem',
        to: tx.toAddress,
        amount: tx.amount,
        description: tx.description,
        timestamp: tx.timestamp,
        signature: tx.signature ? tx.signature.substring(0, 16) + '...' : null
      }))
    };
    
    res.json(formattedBlock);
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

// Blockchain'in geçerliliğini kontrol et - Sadece admin
exports.validateChain = async (req, res) => {
  try {
    // Admin kontrolü middleware tarafından yapılıyor
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