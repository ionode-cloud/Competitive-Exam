// subscriptionSubscriberController.js — Subscriber management
const UserSubscription        = require('../models/UserSubscription');
const SubscriptionPlan        = require('../models/SubscriptionPlan');
const SubscriptionTransaction = require('../models/SubscriptionTransaction');
const User                    = require('../models/User');
const { paginate, paginateResponse } = require('../utils/pagination');

/* ── helpers ─────────────────────────────────────────────────────────────── */
function addDays(date, days)   { const d = new Date(date); d.setDate(d.getDate() + days); return d; }
function addMonths(date, m)    { const d = new Date(date); d.setMonth(d.getMonth() + m);  return d; }

function addDuration(date, dur, unit) {
  if (unit === 'days')   return addDays(date, dur);
  if (unit === 'months') return addMonths(date, dur);
  if (unit === 'years')  return addMonths(date, dur * 12);
  return date;
}

/* ── GET subscribers (paginated, filtered) ──────────────────────────────── */
exports.getSubscribers = async (req, res, next) => {
  try {
    const { search = '', status, paymentStatus, plan, page = 1, limit = 15,
            dateFrom, dateTo } = req.query;

    // Build filter
    const filter = {};
    if (status)        filter.status        = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (plan)          filter.planId        = plan;
    if (dateFrom || dateTo) {
      filter.startDate = {};
      if (dateFrom) filter.startDate.$gte = new Date(dateFrom);
      if (dateTo)   filter.startDate.$lte = new Date(dateTo);
    }

    // User search → get matching user IDs first
    if (search) {
      const users = await User.find({
        $or: [
          { name:  { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } },
        ],
        role: 'student',
      }).select('_id');
      const ids = users.map(u => u._id);
      filter.$or = [
        { userId: { $in: ids } },
        { subscriptionId: { $regex: search, $options: 'i' } },
        { transactionId:  { $regex: search, $options: 'i' } },
      ];
    }

    const { skip, limit: lim } = paginate(null, page, limit);
    const [data, total] = await Promise.all([
      UserSubscription.find(filter)
        .sort('-createdAt').skip(skip).limit(lim)
        .populate('userId', 'name email phone avatar')
        .populate('planId', 'name code billingCycle'),
      UserSubscription.countDocuments(filter),
    ]);

    res.json({ success: true, ...paginateResponse(data, total, page, lim) });
  } catch (err) { next(err); }
};

/* ── GET single subscriber detail ────────────────────────────────────────── */
exports.getSubscriber = async (req, res, next) => {
  try {
    const sub = await UserSubscription.findById(req.params.id)
      .populate('userId', 'name email phone avatar')
      .populate('planId');
    if (!sub) return res.status(404).json({ success: false, message: 'Subscription not found' });

    // Related transactions
    const transactions = await SubscriptionTransaction.find({ subscriptionId: sub._id }).sort('-paymentDate');
    res.json({ success: true, data: sub, transactions });
  } catch (err) { next(err); }
};

/* ── POST manual subscription ────────────────────────────────────────────── */
exports.addManualSubscription = async (req, res, next) => {
  try {
    const { userId, planId, startDate, paymentStatus = 'paid',
            amount, transactionId, paymentMethod, notes } = req.body;

    const plan = await SubscriptionPlan.findById(planId);
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });

    const start  = startDate ? new Date(startDate) : new Date();
    const expiry = addDuration(start, plan.duration, plan.durationUnit);

    const sub = await UserSubscription.create({
      userId, planId,
      startDate: start, expiryDate: expiry,
      status: paymentStatus === 'paid' ? 'active' : 'pending',
      paymentStatus, amount: amount || plan.price,
      transactionId, paymentMethod, notes,
      timeline: [{ event: 'Subscription Created', description: 'Manually assigned by admin', by: 'admin' }],
    });

    // Create matching transaction
    if (transactionId || paymentStatus === 'paid') {
      await SubscriptionTransaction.create({
        userId, subscriptionId: sub._id, planId,
        amount: sub.amount, currency: plan.currency,
        paymentMethod, status: paymentStatus === 'paid' ? 'success' : paymentStatus,
        paymentDate: start, notes: 'Manual subscription by admin',
      });
    }

    // Increment plan subscriber count
    await SubscriptionPlan.findByIdAndUpdate(planId, { $inc: { subscriberCount: 1 } });

    const populated = await sub.populate([
      { path: 'userId', select: 'name email phone avatar' },
      { path: 'planId', select: 'name code billingCycle' },
    ]);
    res.status(201).json({ success: true, data: populated, message: 'Subscription assigned' });
  } catch (err) { next(err); }
};

/* ── PATCH extend subscription ───────────────────────────────────────────── */
exports.extendSubscription = async (req, res, next) => {
  try {
    const { days, months, reason } = req.body;
    const sub = await UserSubscription.findById(req.params.id);
    if (!sub) return res.status(404).json({ success: false, message: 'Subscription not found' });

    const oldExpiry = sub.expiryDate;
    let newExpiry = new Date(oldExpiry);
    if (days)   newExpiry = addDays(newExpiry, Number(days));
    if (months) newExpiry = addMonths(newExpiry, Number(months));

    sub.expiryDate = newExpiry;
    sub.extensions.push({ extendedBy: days || months, reason, newExpiry, extendedAt: new Date() });
    sub.timeline.push({ event: 'Subscription Extended', description: reason || 'Extended by admin', by: 'admin' });
    await sub.save();

    res.json({ success: true, data: sub, message: 'Subscription extended', oldExpiry, newExpiry });
  } catch (err) { next(err); }
};

/* ── PATCH change plan ───────────────────────────────────────────────────── */
exports.changePlan = async (req, res, next) => {
  try {
    const { planId, reason } = req.body;
    const newPlan = await SubscriptionPlan.findById(planId);
    if (!newPlan) return res.status(404).json({ success: false, message: 'Plan not found' });

    const sub = await UserSubscription.findById(req.params.id);
    if (!sub) return res.status(404).json({ success: false, message: 'Subscription not found' });

    const oldPlanId = sub.planId;
    sub.planId = planId;
    sub.expiryDate = addDuration(new Date(), newPlan.duration, newPlan.durationUnit);
    sub.timeline.push({ event: 'Plan Changed', description: `Changed to ${newPlan.name}. ${reason || ''}`, by: 'admin' });
    await sub.save();

    // Update subscriber counts
    await SubscriptionPlan.findByIdAndUpdate(oldPlanId, { $inc: { subscriberCount: -1 } });
    await SubscriptionPlan.findByIdAndUpdate(planId,    { $inc: { subscriberCount:  1 } });

    res.json({ success: true, data: sub, message: 'Plan changed' });
  } catch (err) { next(err); }
};

/* ── Generic status change helper ────────────────────────────────────────── */
async function changeStatus(req, res, next, newStatus, eventName, description) {
  try {
    const sub = await UserSubscription.findById(req.params.id);
    if (!sub) return res.status(404).json({ success: false, message: 'Subscription not found' });
    sub.status = newStatus;
    sub.timeline.push({ event: eventName, description, by: 'admin' });
    await sub.save();
    res.json({ success: true, data: sub, message: `Subscription ${newStatus}` });
  } catch (err) { next(err); }
}

exports.cancelSubscription  = (req, res, next) => changeStatus(req, res, next, 'cancelled',  'Subscription Cancelled',  req.body.reason || 'Cancelled by admin');
exports.suspendSubscription = (req, res, next) => changeStatus(req, res, next, 'suspended',  'Subscription Suspended',  req.body.reason || 'Suspended by admin');
exports.resumeSubscription  = (req, res, next) => changeStatus(req, res, next, 'active',     'Subscription Resumed',    'Resumed by admin');
exports.activateSubscription= (req, res, next) => changeStatus(req, res, next, 'active',     'Subscription Activated',  'Manually activated by admin');

/* ── PUT update subscriber (edit expiry, status, notes, amount) ──────────── */
exports.updateSubscriber = async (req, res, next) => {
  try {
    const { expiryDate, status, paymentStatus, amount, notes, transactionId, paymentMethod } = req.body;
    const sub = await UserSubscription.findById(req.params.id);
    if (!sub) return res.status(404).json({ success: false, message: 'Subscription not found' });

    if (expiryDate)     sub.expiryDate     = new Date(expiryDate);
    if (status)         sub.status         = status;
    if (paymentStatus)  sub.paymentStatus  = paymentStatus;
    if (amount !== undefined) sub.amount   = amount;
    if (notes !== undefined)  sub.notes    = notes;
    if (transactionId)  sub.transactionId  = transactionId;
    if (paymentMethod)  sub.paymentMethod  = paymentMethod;

    sub.timeline.push({ event: 'Subscription Updated', description: 'Updated by admin', by: 'admin' });
    await sub.save();

    const populated = await sub.populate([
      { path: 'userId', select: 'name email phone' },
      { path: 'planId', select: 'name code billingCycle' },
    ]);
    res.json({ success: true, data: populated, message: 'Subscription updated successfully' });
  } catch (err) { next(err); }
};

/* ── DELETE subscriber ────────────────────────────────────────────────────── */
exports.deleteSubscriber = async (req, res, next) => {
  try {
    const sub = await UserSubscription.findById(req.params.id);
    if (!sub) return res.status(404).json({ success: false, message: 'Subscription not found' });

    // Decrement plan subscriber count
    if (sub.planId) {
      await SubscriptionPlan.findByIdAndUpdate(sub.planId, { $inc: { subscriberCount: -1 } });
    }

    await UserSubscription.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Subscription deleted successfully' });
  } catch (err) { next(err); }
};
