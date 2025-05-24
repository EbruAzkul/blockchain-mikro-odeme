// backend/services/subscriptionService.js
const Subscription = require('../models/Subscription');
const blockchainService = require('./blockchainService');
const cron = require('node-cron');

class SubscriptionService {
    constructor() {
        this.initCronJobs();
    }

    // Cron job'ları başlat
    initCronJobs() {
        // Her gün saat 00:00'da çalışacak
        cron.schedule('0 0 * * *', async () => {
            console.log('Abonelik kontrolleri başlatılıyor...');
            await this.checkExpiredSubscriptions();
            await this.processAutoRenewals();
        });

        // Her 6 saatte bir çalışacak - yaklaşan bitişler için bildirim
        cron.schedule('0 */6 * * *', async () => {
            await this.sendExpirationNotifications();
        });
    }

    // Süresi dolan abonelikleri kontrol et
    async checkExpiredSubscriptions() {
        try {
            const expiredSubscriptions = await Subscription.find({
                status: 'ACTIVE',
                endDate: { $lt: new Date() }
            });

            for (const subscription of expiredSubscriptions) {
                subscription.status = 'EXPIRED';
                await subscription.save();

                console.log(`Abonelik süresi doldu: ${subscription._id}`);

                // Kullanıcıya bildirim gönder (email/notification service entegrasyonu)
                // await notificationService.sendSubscriptionExpired(subscription);
            }

            console.log(`${expiredSubscriptions.length} abonelik süresi doldu olarak işaretlendi`);
        } catch (error) {
            console.error('Süresi dolan abonelikleri kontrol hatası:', error);
        }
    }

    // Otomatik yenilemeleri işle
    async processAutoRenewals() {
        try {
            const subscriptionsToRenew = await Subscription.find({
                status: 'ACTIVE',
                autoRenew: true,
                nextPaymentDate: { $lte: new Date() }
            }).populate('userId');

            for (const subscription of subscriptionsToRenew) {
                try {
                    // Kullanıcı bakiyesini kontrol et
                    const balance = await blockchainService.getBalance(subscription.userAddress, true);

                    if (balance >= subscription.monthlyFee) {
                        // Otomatik ödeme işlemi oluştur
                        const transaction = await blockchainService.createTransaction(
                            subscription.userAddress,
                            process.env.SUBSCRIPTION_WALLET_ADDRESS || 'SUBSCRIPTION_SERVICE_ADDRESS',
                            subscription.monthlyFee,
                            `Otomatik abonelik yenileme: ${subscription.serviceName}`,
                            'AUTO_RENEWAL_KEY' // Bu kısım gerçek uygulamada farklı olmalı
                        );

                        // Aboneliği 1 ay uzat
                        await subscription.renew(transaction.signature);

                        console.log(`Abonelik otomatik yenilendi: ${subscription._id}`);

                        // Başarılı yenileme bildirimi
                        // await notificationService.sendAutoRenewalSuccess(subscription);
                    } else {
                        // Yetersiz bakiye durumu
                        subscription.status = 'SUSPENDED';
                        subscription.autoRenew = false;
                        await subscription.save();

                        console.log(`Yetersiz bakiye nedeniyle abonelik askıya alındı: ${subscription._id}`);

                        // Yetersiz bakiye bildirimi
                        // await notificationService.sendInsufficientBalance(subscription);
                    }
                } catch (error) {
                    console.error(`Abonelik yenileme hatası ${subscription._id}:`, error);
                }
            }

            console.log(`${subscriptionsToRenew.length} otomatik yenileme işlendi`);
        } catch (error) {
            console.error('Otomatik yenileme işleme hatası:', error);
        }
    }

    // Yaklaşan bitiş bildirimlerini gönder
    async sendExpirationNotifications() {
        try {
            // 7 gün içinde bitecek abonelikler
            const sevenDaysFromNow = new Date();
            sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

            const expiringSubscriptions = await Subscription.find({
                status: 'ACTIVE',
                autoRenew: false,
                endDate: {
                    $gte: new Date(),
                    $lte: sevenDaysFromNow
                },
                'metadata.notificationSent7Days': { $ne: true }
            }).populate('userId');

            for (const subscription of expiringSubscriptions) {
                // Bildirim gönder
                console.log(`Abonelik bitiş uyarısı gönderiliyor: ${subscription._id}`);

                // Bildirim gönderildi olarak işaretle
                subscription.metadata = subscription.metadata || {};
                subscription.metadata.notificationSent7Days = true;
                await subscription.save();
            }

            console.log(`${expiringSubscriptions.length} kullanıcıya bitiş uyarısı gönderildi`);
        } catch (error) {
            console.error('Bitiş bildirimi gönderme hatası:', error);
        }
    }

    // Abonelik durumunu kontrol et
    async checkSubscriptionAccess(userId, serviceId) {
        try {
            const subscription = await Subscription.findOne({
                userId,
                serviceId,
                status: 'ACTIVE',
                endDate: { $gt: new Date() }
            });

            return {
                hasAccess: !!subscription,
                subscription
            };
        } catch (error) {
            console.error('Abonelik erişim kontrolü hatası:', error);
            return { hasAccess: false, subscription: null };
        }
    }

    // İstatistikleri getir
    async getSubscriptionStats() {
        try {
            const stats = await Subscription.aggregate([
                {
                    $group: {
                        _id: '$serviceId',
                        totalActive: {
                            $sum: { $cond: [{ $eq: ['$status', 'ACTIVE'] }, 1, 0] }
                        },
                        totalRevenue: {
                            $sum: { $cond: [{ $eq: ['$status', 'ACTIVE'] }, '$totalAmount', 0] }
                        },
                        averageDuration: { $avg: '$duration' }
                    }
                }
            ]);

            return stats;
        } catch (error) {
            console.error('İstatistik hesaplama hatası:', error);
            return [];
        }
    }
}

// Singleton instance
const subscriptionService = new SubscriptionService();

module.exports = subscriptionService;