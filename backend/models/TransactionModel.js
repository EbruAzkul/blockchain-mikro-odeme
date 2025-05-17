const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  fromAddress: {
    type: String,
    required: function() { return this.fromAddress !== null; }
  },
  toAddress: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  timestamp: {
    type: Number,
    required: true,
    default: Date.now
  },
  signature: {
    type: String,
    required: function() { return this.fromAddress !== null; }
  },
  processed: {
    type: Boolean,
    default: false
  },
  blockIndex: {
    type: Number,
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Transaction', transactionSchema);