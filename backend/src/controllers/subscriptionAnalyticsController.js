// subscriptionAnalyticsController.js
const UserSubscription        = require('../models/UserSubscription');
const SubscriptionPlan        = require('../models/SubscriptionPlan');
const SubscriptionTransaction = require('../models/SubscriptionTransaction');

/* ── GET dashboard analytics ─────────────────────────────────────────────── */
exports.getAnalytics = async (req, res, next) => {
  try {
    const now = new Date();
    const in30 = new Date(now); in30.setDate(in30.getDate() + 30);

    const [
      totalPlans, activePlans,
      totalSubscribers, activeSubscribers,
      expiredSubscribers, cancelledSubscribers, suspendedSubscribers,
      expiringSoon,
      revenueAgg,
      todayRevAgg,
    ] = await Promise.all([
      SubscriptionPlan.countDocuments({ isDeleted: false }),
      SubscriptionPlan.countDocuments({ isDeleted: false, isActive: true }),
      UserSubscription.countDocuments({}),
      UserSubscription.countDocuments({ status: 'active' }),
      UserSubscription.countDocuments({ status: 'expired' }),
      UserSubscription.countDocuments({ status: 'cancelled' }),
      UserSubscription.countDocuments({ status: 'suspended' }),
      UserSubscription.countDocuments({ status: 'active', expiryDate: { $gte: now, $lte: in30 } }),
      SubscriptionTransaction.aggregate([
        { $match: { status: 'success' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      SubscriptionTransaction.aggregate([
        { $match: { status: 'success', paymentDate: { $gte: new Date(now.toDateString()) } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
    ]);

    const totalRevenue = revenueAgg[0]?.total || 0;
    const todayRevenue = todayRevAgg[0]?.total || 0;

    res.json({
      success: true,
      data: {
        totalPlans, activePlans,
        totalSubscribers, activeSubscribers,
        expiredSubscribers, cancelledSubscribers, suspendedSubscribers,
        expiringSoon,
        totalRevenue, todayRevenue,
      },
    });
  } catch (err) { next(err); }
};

/* ── GET revenue breakdown + plan performance ─────────────────────────────── */
exports.getRevenue = async (req, res, next) => {
  try {
    const now = new Date();

    // This week / month / year boundaries
    const startOfWeek  = new Date(now); startOfWeek.setDate(now.getDate() - now.getDay());  startOfWeek.setHours(0,0,0,0);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear  = new Date(now.getFullYear(), 0, 1);

    const [weekAgg, monthAgg, yearAgg, planPerf, monthlyBreakdown] = await Promise.all([
      SubscriptionTransaction.aggregate([
        { $match: { status: 'success', paymentDate: { $gte: startOfWeek } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      SubscriptionTransaction.aggregate([
        { $match: { status: 'success', paymentDate: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      SubscriptionTransaction.aggregate([
        { $match: { status: 'success', paymentDate: { $gte: startOfYear } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      // Per-plan subscriber count + revenue
      UserSubscription.aggregate([
        { $group: { _id: '$planId', count: { $sum: 1 }, revenue: { $sum: '$amount' } } },
        { $lookup: { from: 'subscriptionplans', localField: '_id', foreignField: '_id', as: 'plan' } },
        { $unwind: { path: '$plan', preserveNullAndEmpty: true } },
        { $project: { _id: 0, planName: '$plan.name', planCode: '$plan.code', count: 1, revenue: 1 } },
        { $sort: { revenue: -1 } },
      ]),
      // Monthly revenue for last 12 months
      SubscriptionTransaction.aggregate([
        { $match: { status: 'success', paymentDate: { $gte: startOfYear } } },
        { $group: { _id: { month: { $month: '$paymentDate' }, year: { $year: '$paymentDate' } }, total: { $sum: '$amount' } } },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),
    ]);

    res.json({
      success: true,
      data: {
        thisWeek:   weekAgg[0]?.total  || 0,
        thisMonth:  monthAgg[0]?.total || 0,
        thisYear:   yearAgg[0]?.total  || 0,
        planPerformance: planPerf,
        monthlyBreakdown,
      },
    });
  } catch (err) { next(err); }
};

/* ── GET expiring soon ────────────────────────────────────────────────────── */
exports.getExpiringSoon = async (req, res, next) => {
  try {
    const { days = 30 } = req.query;
    const now = new Date();
    const threshold = new Date(now); threshold.setDate(now.getDate() + Number(days));

    const data = await UserSubscription.find({
      status: 'active',
      expiryDate: { $gte: now, $lte: threshold },
    })
      .sort('expiryDate')
      .populate('userId', 'name email phone avatar')
      .populate('planId', 'name code');

    res.json({ success: true, data });
  } catch (err) { next(err); }
};
