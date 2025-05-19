// backend/services/blockchainService.js
const Blockchain = require('../blockchain/Blockchain');
const Transaction = require('../blockchain/Transaction');
const Wallet = require('../blockchain/Wallet');

// Singleton blockchain instance
let blockchain = null;

/**
 * Blockchain Service
 * Blockchain ile etkileşim için kullanılan servis
 */
class BlockchainService {
  constructor() {
    this.initializeBlockchain();
  }

  /**
   * Blockchain'i başlat
   */
  async initializeBlockchain() {
    try {
      if (!blockchain) {
        console.log('Blockchain başlatılıyor...');
        blockchain = new Blockchain();
        await blockchain.initializeChain();
        console.log('Blockchain başarıyla başlatıldı');
      }
    } catch (error) {
      console.error('Blockchain başlatma hatası:', error);
      throw error;
    }
  }

  /**
   * Blockchain instance'ını döndür
   */
  get blockchain() {
    return blockchain;
  }

  /**
   * Blockchain'i döndür
   * @returns {Array} Blockchain zinciri
   */
  getBlockchain() {
    return blockchain.chain;
  }
  
  /**
   * Blockchain zincirinin geçerliliğini kontrol et
   * @returns {boolean} Zincirin geçerli olup olmadığı
   */
  isChainValid() {
    return blockchain.isChainValid();
  }

  /**
   * Tüm işlemleri getir
   * @returns {Array} Tüm işlemler
   */
  getAllTransactions() {
    return blockchain.getAllTransactions();
  }

  /**
   * Yeni bir cüzdan oluştur
   * @returns {Object} Oluşturulan cüzdan
   */
  createWallet() {
    const wallet = new Wallet();
    const keyPair = wallet.generateKeyPair();
    return keyPair;
  }

  /**
   * Sadece tamamlanmış işlemlerden bakiye hesapla
   * @param {string} address - Bakiyesi hesaplanacak cüzdan adresi
   * @param {boolean} onlyCompleted - Sadece tamamlanmış işlemleri dahil et
   * @returns {number} Bakiye
   */
  getBalance(address, onlyCompleted = true) {
    let balance = 0;
    
    // Tüm bloklardaki işlemleri hesapla (bunlar zaten tamamlanmış)
    for (const block of this.blockchain.chain) {
      for (const trans of block.transactions) {
        if (trans.fromAddress === address) {
          balance -= parseFloat(trans.amount);
        }
        if (trans.toAddress === address) {
          balance += parseFloat(trans.amount);
        }
      }
    }
    
    // Eğer sadece tamamlanmış istenmiyorsa, bekleyenleri de ekle
    if (!onlyCompleted) {
      const pendingBalance = this.getPendingBalance(address);
      balance += pendingBalance;
    }
    
    return balance;
  }

  /**
   * Sadece bekleyen işlemlerden bakiye hesapla
   * @param {string} address - Bakiyesi hesaplanacak cüzdan adresi
   * @returns {number} Bekleyen işlemlerden oluşan bakiye
   */
  getPendingBalance(address) {
    let pendingBalance = 0;
    
    // Bekleyen işlemleri hesapla
    for (const trans of this.blockchain.pendingTransactions) {
      if (trans.fromAddress === address) {
        pendingBalance -= parseFloat(trans.amount);
      }
      if (trans.toAddress === address) {
        pendingBalance += parseFloat(trans.amount);
      }
    }
    
    return pendingBalance;
  }

  /**
   * İşlem oluştur
   * @param {string} fromAddress - Gönderen adres
   * @param {string} toAddress - Alıcı adres
   * @param {number} amount - Miktar
   * @param {string} description - Açıklama
   * @param {string} privateKey - Özel anahtar
   * @returns {Transaction} Oluşturulan işlem
   */
  async createTransaction(fromAddress, toAddress, amount, description, privateKey) {
    try {
      // Wallet oluştur ve özel anahtardan key pair elde et
      const wallet = new Wallet();
      const keyPair = wallet.getKeyPairFromPrivateKey(privateKey);
      
      // Bakiye kontrolü - sadece tamamlanmış işlemlerle
      const currentBalance = this.getBalance(fromAddress, true);
      
      // Bakiye kontrolü
      if (currentBalance < amount) {
        throw new Error(`Yetersiz bakiye. Mevcut: ${currentBalance}, İstenen: ${amount}`);
      }
      
      // İşlemi oluştur
      const transaction = new Transaction(
        fromAddress,
        toAddress,
        amount,
        description
      );
      
      // İşlemi imzala
      wallet.keyPair = keyPair;
      wallet.signTransaction(transaction);
      
      // Blockchain'e ekle
      await this.blockchain.addTransaction(transaction);
      
      console.log(`İşlem oluşturuldu: ${fromAddress} -> ${toAddress}, ${amount} mikrocoin`);
      
      return transaction;
    } catch (error) {
      console.error('İşlem oluşturma hatası:', error);
      throw error;
    }
  }

  /**
   * Bakiye yükle
   * @param {string} toAddress - Alıcı adres
   * @param {number} amount - Miktar
   * @param {string} privateKey - Özel anahtar
   * @returns {Transaction} Oluşturulan işlem
   */
  async addFunds(toAddress, amount, privateKey) {
    try {
      // Bakiye yükleme işlemi, sistem kaynaklı bir işlemdir
      const fromAddress = "SYSTEM_TREASURY_ADDRESS";
      const description = "Bakiye Yükleme";
      
      // Özel anahtar kontrolü
      const wallet = new Wallet();
      const keyPair = wallet.getKeyPairFromPrivateKey(privateKey);
      
      // İşlemi oluştur
      const transaction = new Transaction(
        fromAddress,
        toAddress,
        amount,
        description
      );
      
      // Sistem işlemi olduğu için özel bir imzalama
      transaction.signature = "SYSTEM_TRANSACTION";
      
      // Blockchain'e ekle
      await this.blockchain.addTransaction(transaction);
      
      console.log(`Bakiye yüklendi: ${amount} mikrocoin -> ${toAddress}`);
      
      return transaction;
    } catch (error) {
      console.error('Bakiye yükleme hatası:', error);
      throw error;
    }
  }

  /**
   * İşlem işle/onayla
   * @param {string} transactionId - İşlem ID'si
   * @param {string} privateKey - Özel anahtar
   * @returns {Transaction} İşlenen işlem
   */
  async processTransaction(transactionId, privateKey) {
    try {
      // Wallet oluştur ve özel anahtardan key pair elde et
      const wallet = new Wallet();
      const keyPair = wallet.getKeyPairFromPrivateKey(privateKey);
      
      // İşlemi bul
      const transaction = this.blockchain.pendingTransactions.find(tx => 
        tx.signature && tx.signature.substring(0, 24) === transactionId
      );
      
      if (!transaction) {
        throw new Error('İşlem bulunamadı veya zaten işlenmiş');
      }
      
      // İmza kontrolü
      if (transaction.fromAddress !== wallet.keyPair.getPublic('hex')) {
        throw new Error('Bu işlemi onaylama yetkiniz bulunmamaktadır');
      }
      
      // İşlemi madenciliğe ekle (blockchain implementasyonuna göre değişebilir)
      // Bu örnekte, işlemi bir sonraki bloğa dahil etmek için sadece onaylıyoruz
      // ve madencilik için bekletiyoruz
      console.log(`İşlem onaylandı ve madencilik için hazır: ${transactionId}`);
      
      // Gerçek bir sistemde, burada bir madencilik tetikleyebilirsiniz
      // veya işlemi "onaylandı" olarak işaretleyebilirsiniz
      
      return transaction;
    } catch (error) {
      console.error('İşlem onaylama hatası:', error);
      throw error;
    }
  }
  
  /**
   * Madencilik yap
   * @param {string} minerAddress - Madenci adresi
   * @returns {object} Oluşturulan blok
   */
  async mineBlock(minerAddress) {
    try {
      if (!minerAddress) {
        throw new Error('Madenci adresi gereklidir');
      }
      
      // Madencilik yap
      const newBlock = await this.blockchain.minePendingTransactions(minerAddress);
      
      console.log(`Yeni blok oluşturuldu:`, {
        index: newBlock.index,
        hash: newBlock.hash.substring(0, 10) + '...',
        transactions: newBlock.transactions.length
      });
      
      return {
        index: newBlock.index,
        hash: newBlock.hash,
        previousHash: newBlock.previousHash,
        timestamp: newBlock.timestamp,
        nonce: newBlock.nonce,
        transactionCount: newBlock.transactions.length
      };
    } catch (error) {
      console.error('Madencilik hatası:', error);
      throw error;
    }
  }
}

// Singleton instance oluştur
const blockchainService = new BlockchainService();

module.exports = blockchainService;