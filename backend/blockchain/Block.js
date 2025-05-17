const crypto = require('crypto');

class Block {
  constructor(index, transactions, timestamp, previousHash, nonce = 0) {
    this.index = index;
    this.transactions = transactions;
    this.timestamp = timestamp;
    this.previousHash = previousHash;
    this.nonce = nonce;
    this.hash = this.calculateHash();
  }

  calculateHash() {
    const blockData = {
      index: this.index,
      transactions: this.transactions,
      timestamp: this.timestamp,
      previousHash: this.previousHash,
      nonce: this.nonce
    };
    
    const blockString = JSON.stringify(blockData, Object.keys(blockData).sort());
    return crypto.createHash('sha256').update(blockString).digest('hex');
  }

  mineBlock(difficulty) {
    // Proof of Work algoritması
    while (this.hash.substring(0, difficulty) !== Array(difficulty + 1).join('0')) {
      this.nonce++;
      this.hash = this.calculateHash();
    }
    
    console.log(`Block #${this.index} mined: ${this.hash}`);
    return this.hash;
  }
}

module.exports = Block;