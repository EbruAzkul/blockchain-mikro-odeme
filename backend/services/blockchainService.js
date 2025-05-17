// C:\Users\HUAWEI\blockchain-mikro-odeme\backend\services\blockchainService.js

const Blockchain = require('../blockchain/Blockchain');
const Transaction = require('../blockchain/Transaction');
const Wallet = require('../blockchain/Wallet');
const SmartContract = require('../blockchain/SmartContract');
const BlockModel = require('../models/BlockModel');
const TransactionModel = require('../models/TransactionModel');

class BlockchainService {
  constructor() {
    this.blockchain = new Blockchain();
    this.wallet = new Wallet();
    this.smartContract = new SmartContract(this.blockchain);
    this.initialize();
  }

  async initialize() {
    await this.blockchain.initializeChain();
    console.log('Blockchain initialized');
  }

  createWallet() {
    return this.wallet.generateKeyPair();
  }

  loadWallet(privateKey) {
    return this.wallet.getKeyPairFromPrivateKey(privateKey);
  }

  async createTransaction(fromAddress, toAddress, amount, description, privateKey) {
    try {
      // Cüzdanı yükle
      const wallet = new Wallet();
      wallet.getKeyPairFromPrivateKey(privateKey);
      
      // İşlemi oluştur
      const transaction = new Transaction(fromAddress, toAddress, amount, description);
      
      // İşlemi imzala
      wallet.signTransaction(transaction);
      
      // İşlemi blockchain'e ekle
      await this.blockchain.addTransaction(transaction);
      
      return transaction;
    } catch (error) {
      throw error;
    }
  }

  async mineBlock(minerAddress) {
    try {
      const block = await this.blockchain.minePendingTransactions(minerAddress);
      return block;
    } catch (error) {
      throw error;
    }
  }

  getBalance(address) {
    return this.blockchain.getBalance(address);
  }

  getBlockchain() {
    return this.blockchain.chain;
  }

  getAllTransactions() {
    return this.blockchain.getAllTransactions();
  }

  getTransactionsByAddress(address) {
    const allTransactions = this.blockchain.getAllTransactions();
    return allTransactions.filter(tx => 
      tx.fromAddress === address || tx.toAddress === address
    );
  }

  isChainValid() {
    return this.blockchain.isChainValid();
  }

  async deploySmartContract(ownerAddress) {
    return this.smartContract.deploy(ownerAddress);
  }

  async createEscrow(fromAddress, toAddress, amount, releaseTime, privateKey) {
    return this.smartContract.createEscrow(
      fromAddress, toAddress, amount, releaseTime, privateKey
    );
  }

  async releaseEscrow(escrowId, callerAddress) {
    return this.smartContract.releaseEscrow(escrowId, callerAddress);
  }
  
  // Bakiye yükleme işlemi metodu
  async addFunds(userAddress, amount, privateKey) {
    try {
      // Sistem cüzdanından kullanıcıya transfer
      const systemAddress = "SYSTEM_TREASURY_ADDRESS"; // Sistem hazine adresi
      
      const transaction = new Transaction(
        systemAddress,
        userAddress,
        parseFloat(amount),
        "Bakiye Yükleme"
      );
      
      // Sistem işlemi olduğu için özel bir imzalama yöntemi kullanılabilir
      transaction.signature = "SYSTEM_TRANSACTION_" + Date.now();
      
      // İşlemi blockchain'e ekle
      await this.blockchain.addTransaction(transaction);
      
      // İşlemi hemen işle (isteğe bağlı)
      await this.mineBlock(systemAddress);
      
      return transaction;
    } catch (error) {
      throw error;
    }
  }
  
  // Mining ödül miktarını ayarla
  setMiningReward(amount) {
    this.blockchain.miningReward = amount;
    return this.blockchain.miningReward;
  }
}

// Singleton pattern
const blockchainService = new BlockchainService();
module.exports = blockchainService;