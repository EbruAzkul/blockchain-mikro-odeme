// backend/models/Subscription.js
const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    userAddress: {
        type: String,
        required: true
    },
    serviceId: {
        type: String,
        required: true,
        enum: ['BASIC', 'PREMIUM', 'ENTERPRISE', 'CUSTOM']
    },
    serviceName: {
        type: String,
        required: true
    },
    monthlyFee: {
        type: Number,
        required: true
    },
    totalAmount: {
        type: Number,
        required: true
    },
    duration: {
        type: Number, // Ay cinsinden
        required: true
    },
    startDate: {
        type: Date,
        default: Date.now
    },
    endDate: {
        type: Date,
        required: true
    },
    nextPaymentDate: {
        type: Date
    },
    autoRenew: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        enum: ['ACTIVE', 'CANCELLED', 'EXPIRED', 'PENDING', 'SUSPENDED'],
        default: 'PENDING'
    },
    paymentHistory: [{
        transactionId: String,
        amount: Number,
        paymentDate: Date,
        status: String
    }],
    cancellationReason: {
        type: String
    },
    cancellationDate: {
        type: Date
    },
    features: [{
        type: String
    }],
    metadata: {
        type: Object,
        default: {}
    }
}, {
    timestamps: true
});

// İndeksler
subscriptionSchema.index({ userId: 1, status: 1 });
subscriptionSchema.index({ endDate: 1 });
subscriptionSchema.index({ nextPaymentDate: 1 });

// Aktif abonelik kontrolü
subscriptionSchema.methods.isActive = function() {
    return this.status === 'ACTIVE' && this.endDate > new Date();
};

// Abonelik yenileme
subscriptionSchema.methods.renew = async function(transactionId) {
    this.startDate = new Date();
    this.endDate = new Date(Date.now() + (this.duration * 30 * 24 * 60 * 60 * 1000));
    this.nextPaymentDate = this.autoRenew ? new Date(this.endDate) : null;
    this.status = 'ACTIVE';

    this.paymentHistory.push({
        transactionId,
        amount: this.totalAmount,
        paymentDate: new Date(),
        status: 'SUCCESS'
    });

    return this.save();
};

// Abonelik iptali
subscriptionSchema.methods.cancel = async function(reason) {
    this.status = 'CANCELLED';
    this.autoRenew = false;
    this.cancellationReason = reason;
    this.cancellationDate = new Date();
    this.nextPaymentDate = null;

    return this.save();
};

module.exports = mongoose.model('Subscription', subscriptionSchema);