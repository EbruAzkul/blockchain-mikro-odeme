const crypto = require('crypto');
const Transaction = require('./Transaction');

class SmartContract {
  constructor(blockchain) {
    this.blockchain = blockchain;
    this.owner = null;
    this.contractAddress = this.generateContractAddress();
    this.contractState = {};
  }

  generateContractAddress() {
    // Basit bir sözleşme adresi oluştur
    return 'contract_' + Math.random().toString(36).substring(2, 15);
  }

  deploy(ownerAddress) {
    this.owner = ownerAddress;
    console.log(`Contract deployed at ${this.contractAddress} by ${ownerAddress}`);
    return this.contractAddress;
  }

  // Örnek: Escrow akıllı sözleşmesi fonksiyonu
  async createEscrow(fromAddress, toAddress, amount, releaseTime, privateKey) {
    // Kontrat durumunu güncelle
    const escrowId = 'escrow_' + Date.now();
    this.contractState[escrowId] = {
      fromAddress,
      toAddress,
      amount,
      releaseTime,
      released: false
    };

    // Fonları sözleşmeye yatırma işlemi
    const transaction = new Transaction(
      fromAddress,
      this.contractAddress,
      amount,
      `Escrow deposit: ${escrowId}`
    );

    // İşlemi imzala
    const key = crypto.createECDH('secp256k1');
    key.setPrivateKey(Buffer.from(privateKey, 'hex'));
    transaction.signTransaction(key);

    // Blockchain'e işlemi ekle
    await this.blockchain.addTransaction(transaction);
    
    return escrowId;
  }

  // Emaneti serbest bırakma
  async releaseEscrow(escrowId, callerAddress) {
    const escrow = this.contractState[escrowId];
    
    if (!escrow) {
      throw new Error('Escrow not found');
    }
    
    if (escrow.released) {
      throw new Error('Escrow already released');
    }
    
    if (Date.now() < escrow.releaseTime && callerAddress !== this.owner) {
      throw new Error('Release time not reached and caller is not contract owner');
    }
    
    // Fonları alıcıya gönder
    const transaction = new Transaction(
      this.contractAddress,
      escrow.toAddress,
      escrow.amount,
      `Escrow release: ${escrowId}`
    );
    
    // Sistem işlemi olduğu için özel bir imzalama
    transaction.signature = 'SYSTEM_TRANSACTION';
    
    // Blockchain'e işlemi ekle
    await this.blockchain.addTransaction(transaction);
    
    // Durum güncelleme
    escrow.released = true;
    this.contractState[escrowId] = escrow;
    
    return true;
  }
}

module.exports = SmartContract;