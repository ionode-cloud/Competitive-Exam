// routes/subscriptions.js — all subscription API routes
const express   = require('express');
const router    = express.Router();
const { protect }   = require('../middleware/auth');
const { adminOnly } = require('../middleware/rbac');

// Controllers
const planCtrl        = require('../controllers/subscriptionController');
const subscriberCtrl  = require('../controllers/subscriptionSubscriberController');
const txnCtrl         = require('../controllers/subscriptionTransactionController');
const analyticsCtrl   = require('../controllers/subscriptionAnalyticsController');
const settingsCtrl    = require('../controllers/subscriptionSettingsController');

// All routes require auth + admin role
router.use(protect, adminOnly);

/* ── Analytics ──────────────────────────────────────────────────────────── */
router.get('/analytics',     analyticsCtrl.getAnalytics);
router.get('/revenue',       analyticsCtrl.getRevenue);
router.get('/expiring-soon', analyticsCtrl.getExpiringSoon);

/* ── Plans ──────────────────────────────────────────────────────────────── */
router.get('/plans',                    planCtrl.getPlans);
router.post('/plans',                   planCtrl.createPlan);
router.get('/plans/:id',                planCtrl.getPlan);
router.put('/plans/:id',                planCtrl.updatePlan);
router.delete('/plans/:id',             planCtrl.deletePlan);
router.patch('/plans/:id/status',       planCtrl.togglePlanStatus);
router.post('/plans/:id/duplicate',     planCtrl.duplicatePlan);

/* ── Subscribers ────────────────────────────────────────────────────────── */
router.get('/subscribers',              subscriberCtrl.getSubscribers);
router.post('/manual',                  subscriberCtrl.addManualSubscription);
router.get('/subscribers/:id',          subscriberCtrl.getSubscriber);
router.patch('/subscribers/:id/extend', subscriberCtrl.extendSubscription);
router.patch('/subscribers/:id/change-plan', subscriberCtrl.changePlan);
router.patch('/subscribers/:id/cancel',   subscriberCtrl.cancelSubscription);
router.patch('/subscribers/:id/suspend',  subscriberCtrl.suspendSubscription);
router.patch('/subscribers/:id/resume',   subscriberCtrl.resumeSubscription);
router.patch('/subscribers/:id/activate', subscriberCtrl.activateSubscription);

/* ── Transactions ───────────────────────────────────────────────────────── */
router.get('/transactions',         txnCtrl.getTransactions);
router.get('/transactions/:id',     txnCtrl.getTransaction);

/* ── Settings ───────────────────────────────────────────────────────────── */
router.get('/settings',   settingsCtrl.getSettings);
router.put('/settings',   settingsCtrl.updateSettings);

module.exports = router;
