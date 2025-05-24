// backend/controllers/subscriptionController.js
const Subscription = require('../models/Subscription');
const User = require('../models/User');
const blockchainService = require('../services/blockchainService');

// Abonelik paketleri
const SUBSCRIPTION_PLANS = {
    BASIC: {
        name: 'Temel Paket',
        monthlyFee: 10,
        features: [
            'Günlük 100 işlem limiti',
            'Temel raporlama',
            'Email desteği'
        ]
    },
    PREMIUM: {
        name: 'Premium Paket',
        monthlyFee: 25,
        features: [
            'Günlük 1000 işlem limiti',
            'Gelişmiş raporlama',
            'Öncelikli destek',
            'API erişimi',
            'Özel dashboard'
        ]
    },
    ENTERPRISE: {
        name: 'Kurumsal Paket',
        monthlyFee: 100,
        features: [
            'Sınırsız işlem',
            'Özel raporlama',
            '7/24 telefon desteği',
            'Tam API erişimi',
            'Özel entegrasyonlar',
            'Dedicated account manager'
        ]
    }
};

// Abonelik paketlerini getir
exports.getSubscriptionPlans = async (req, res) => {
    try {
        res.json({
            success: true,
            plans: SUBSCRIPTION_PLANS
        });
    } catch (error) {
        console.error('Abonelik paketleri getirme hatası:', error);
        res.status(500).json({ message: error.message });
    }
};

// Yeni abonelik oluştur
exports.createSubscription = async (req, res) => {
    try {
        const { serviceId, duration, autoRenew, privateKey } = req.body;
        const userId = req.user._id;
        const userAddress = req.user.walletAddress;

        // Paket kontrolü
        const plan = SUBSCRIPTION_PLANS[serviceId];
        if (!plan) {
            return res.status(400).json({ message: 'Geçersiz abonelik paketi' });
        }

        // Aktif abonelik kontrolü
        const activeSubscription = await Subscription.findOne({
            userId,
            serviceId,
            status: 'ACTIVE'
        });

        if (activeSubscription) {
            return res.status(400).json({
                message: 'Bu paket için zaten aktif bir aboneliğiniz var'
            });
        }

        // Toplam tutarı hesapla
        const totalAmount = plan.monthlyFee * duration;

        // Bakiye kontrolü
        const balance = await blockchainService.getBalance(userAddress, true);
        if (balance < totalAmount) {
            return res.status(400).json({
                message: `Yetersiz bakiye. Gerekli: ${totalAmount} MikroCoin, Mevcut: ${balance} MikroCoin`
            });
        }

        // Blockchain işlemi oluştur
        const transaction = await blockchainService.createTransaction(
            userAddress,
            process.env.SUBSCRIPTION_WALLET_ADDRESS || 'SUBSCRIPTION_SERVICE_ADDRESS',
            totalAmount,
            `Abonelik ödemesi: ${plan.name} - ${duration} ay`,
            privateKey
        );

        // Abonelik oluştur
        const subscription = await Subscription.create({
            userId,
            userAddress,
            serviceId,
            serviceName: plan.name,
            monthlyFee: plan.monthlyFee,
            totalAmount,
            duration,
            endDate: new Date(Date.now() + (duration * 30 * 24 * 60 * 60 * 1000)),
            nextPaymentDate: autoRenew ? new Date(Date.now() + (duration * 30 * 24 * 60 * 60 * 1000)) : null,
            autoRenew,
            status: 'ACTIVE',
            features: plan.features,
            paymentHistory: [{
                transactionId: transaction.signature,
                amount: totalAmount,
                paymentDate: new Date(),
                status: 'SUCCESS'
            }]
        });

        res.status(201).json({
            success: true,
            message: `${plan.name} aboneliği başarıyla oluşturuldu`,
            subscription: {
                _id: subscription._id,
                serviceName: subscription.serviceName,
                monthlyFee: subscription.monthlyFee,
                duration: subscription.duration,
                totalAmount: subscription.totalAmount,
                startDate: subscription.startDate,
                endDate: subscription.endDate,
                autoRenew: subscription.autoRenew,
                status: subscription.status,
                features: subscription.features
            },
            transaction: {
                txId: transaction.signature.substring(0, 24),
                amount: totalAmount
            }
        });

    } catch (error) {
        console.error('Abonelik oluşturma hatası:', error);
        res.status(500).json({ message: error.message });
    }
};

// Kullanıcının aboneliklerini getir
exports.getMySubscriptions = async (req, res) => {
    try {
        const userId = req.user._id;

        const subscriptions = await Subscription.find({ userId })
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            subscriptions: subscriptions.map(sub => ({
                _id: sub._id,
                serviceId: sub.serviceId,
                serviceName: sub.serviceName,
                monthlyFee: sub.monthlyFee,
                startDate: sub.startDate,
                endDate: sub.endDate,
                status: sub.status,
                autoRenew: sub.autoRenew,
                isActive: sub.isActive(),
                features: sub.features,
                daysRemaining: Math.ceil((sub.endDate - new Date()) / (1000 * 60 * 60 * 24))
            }))
        });

    } catch (error) {
        console.error('Abonelikleri getirme hatası:', error);
        res.status(500).json({ message: error.message });
    }
};

// Abonelik detayı
exports.getSubscriptionById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const subscription = await Subscription.findOne({ _id: id, userId });

        if (!subscription) {
            return res.status(404).json({ message: 'Abonelik bulunamadı' });
        }

        res.json({
            success: true,
            subscription: {
                _id: subscription._id,
                serviceId: subscription.serviceId,
                serviceName: subscription.serviceName,
                monthlyFee: subscription.monthlyFee,
                totalAmount: subscription.totalAmount,
                duration: subscription.duration,
                startDate: subscription.startDate,
                endDate: subscription.endDate,
                nextPaymentDate: subscription.nextPaymentDate,
                autoRenew: subscription.autoRenew,
                status: subscription.status,
                isActive: subscription.isActive(),
                features: subscription.features,
                paymentHistory: subscription.paymentHistory,
                daysRemaining: Math.ceil((subscription.endDate - new Date()) / (1000 * 60 * 60 * 24))
            }
        });

    } catch (error) {
        console.error('Abonelik detayı getirme hatası:', error);
        res.status(500).json({ message: error.message });
    }
};

// Abonelik yenileme
exports.renewSubscription = async (req, res) => {
    try {
        const { id } = req.params;
        const { duration, privateKey } = req.body;
        const userId = req.user._id;
        const userAddress = req.user.walletAddress;

        const subscription = await Subscription.findOne({ _id: id, userId });

        if (!subscription) {
            return res.status(404).json({ message: 'Abonelik bulunamadı' });
        }

        // Toplam tutarı hesapla
        const totalAmount = subscription.monthlyFee * duration;

        // Bakiye kontrolü
        const balance = await blockchainService.getBalance(userAddress, true);
        if (balance < totalAmount) {
            return res.status(400).json({
                message: `Yetersiz bakiye. Gerekli: ${totalAmount} MikroCoin`
            });
        }

        // Blockchain işlemi
        const transaction = await blockchainService.createTransaction(
            userAddress,
            process.env.SUBSCRIPTION_WALLET_ADDRESS || 'SUBSCRIPTION_SERVICE_ADDRESS',
            totalAmount,
            `Abonelik yenileme: ${subscription.serviceName} - ${duration} ay`,
            privateKey
        );

        // Aboneliği yenile
        subscription.duration = duration;
        subscription.totalAmount = totalAmount;
        await subscription.renew(transaction.signature);

        res.json({
            success: true,
            message: 'Abonelik başarıyla yenilendi',
            subscription: {
                _id: subscription._id,
                serviceName: subscription.serviceName,
                endDate: subscription.endDate,
                status: subscription.status
            }
        });

    } catch (error) {
        console.error('Abonelik yenileme hatası:', error);
        res.status(500).json({ message: error.message });
    }
};

// Abonelik iptali
exports.cancelSubscription = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        const userId = req.user._id;

        const subscription = await Subscription.findOne({ _id: id, userId });

        if (!subscription) {
            return res.status(404).json({ message: 'Abonelik bulunamadı' });
        }

        if (subscription.status === 'CANCELLED') {
            return res.status(400).json({ message: 'Abonelik zaten iptal edilmiş' });
        }

        await subscription.cancel(reason);

        res.json({
            success: true,
            message: 'Abonelik başarıyla iptal edildi',
            subscription: {
                _id: subscription._id,
                serviceName: subscription.serviceName,
                status: subscription.status,
                cancellationDate: subscription.cancellationDate
            }
        });

    } catch (error) {
        console.error('Abonelik iptal hatası:', error);
        res.status(500).json({ message: error.message });
    }
};

// Otomatik yenileme değiştir
exports.toggleAutoRenew = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const subscription = await Subscription.findOne({ _id: id, userId });

        if (!subscription) {
            return res.status(404).json({ message: 'Abonelik bulunamadı' });
        }

        subscription.autoRenew = !subscription.autoRenew;
        subscription.nextPaymentDate = subscription.autoRenew ? subscription.endDate : null;
        await subscription.save();

        res.json({
            success: true,
            message: `Otomatik yenileme ${subscription.autoRenew ? 'açıldı' : 'kapatıldı'}`,
            autoRenew: subscription.autoRenew
        });

    } catch (error) {
        console.error('Otomatik yenileme değiştirme hatası:', error);
        res.status(500).json({ message: error.message });
    }
};

// Admin: Tüm abonelikleri getir
exports.getAllSubscriptions = async (req, res) => {
    try {
        if (!req.user.isAdmin) {
            return res.status(403).json({ message: 'Bu işlem için yetkiniz yok' });
        }

        const { status, serviceId, page = 1, limit = 10 } = req.query;

        const query = {};
        if (status) query.status = status;
        if (serviceId) query.serviceId = serviceId;

        const subscriptions = await Subscription.find(query)
            .populate('userId', 'username email')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Subscription.countDocuments(query);

        res.json({
            success: true,
            subscriptions,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });

    } catch (error) {
        console.error('Tüm abonelikleri getirme hatası:', error);
        res.status(500).json({ message: error.message });
    }
};