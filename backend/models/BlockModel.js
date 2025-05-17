const mongoose = require('mongoose');

const blockSchema = new mongoose.Schema({
  index: {
    type: Number,
    required: true,
    unique: true
  },
  hash: {
    type: String,
    required: true,
    unique: true
  },
  previousHash: {
    type: String,
    required: true
  },
  timestamp: {
    type: Number,
    required: true
  },
  transactions: [{
    fromAddress: String,
    toAddress: String,
    amount: Number,
    description: String,
    timestamp: Number,
    signature: String
  }],
  nonce: {
    type: Number,
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Block', blockSchema);