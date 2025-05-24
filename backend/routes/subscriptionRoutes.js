// backend/routes/subscriptionRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { isAdmin } = require('../middleware/adminMiddleware');
const {
    getSubscriptionPlans,
    createSubscription,
    getMySubscriptions,
    getSubscriptionById,
    renewSubscription,
    cancelSubscription,
    toggleAutoRenew,
    getAllSubscriptions
} = require('../controllers/subscriptionController');

// backend/routes/subscriptionRoutes.js başına ekleyin
router.get('/test', (req, res) => {
    res.json({
        success: true,
        message: 'Subscription routes çalışıyor!'
    });
});

// Public routes
router.get('/plans', getSubscriptionPlans);

// Protected routes - kullanıcı işlemleri
router.use(protect); // Bu noktadan sonra tüm route'lar korumalı

router.post('/create', createSubscription);
router.get('/my-subscriptions', getMySubscriptions);
router.get('/:id', getSubscriptionById);
router.post('/:id/renew', renewSubscription);
router.post('/:id/cancel', cancelSubscription);
router.patch('/:id/auto-renew', toggleAutoRenew);

// Admin routes
router.get('/admin/all', isAdmin, getAllSubscriptions);

module.exports = router;