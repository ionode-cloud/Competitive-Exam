// subscriptionTransactionController.js
const SubscriptionTransaction = require('../models/SubscriptionTransaction');
const { paginate, paginateResponse } = require('../utils/pagination');

/* ── GET all transactions ────────────────────────────────────────────────── */
exports.getTransactions = async (req, res, next) => {
  try {
    const { search = '', status, paymentMethod, plan, dateFrom, dateTo, page = 1, limit = 15 } = req.query;

    const filter = {};
    if (status)        filter.status        = status;
    if (paymentMethod) filter.paymentMethod = { $regex: paymentMethod, $options: 'i' };
    if (plan)          filter.planId        = plan;
    if (dateFrom || dateTo) {
      filter.paymentDate = {};
      if (dateFrom) filter.paymentDate.$gte = new Date(dateFrom);
      if (dateTo)   filter.paymentDate.$lte = new Date(dateTo);
    }
    if (search) {
      filter.$or = [
        { transactionId: { $regex: search, $options: 'i' } },
      ];
    }

    const { skip, limit: lim } = paginate(null, page, limit);
    const [data, total] = await Promise.all([
      SubscriptionTransaction.find(filter)
        .sort('-createdAt').skip(skip).limit(lim)
        .populate('userId', 'name email phone')
        .populate('planId', 'name code')
        .populate('subscriptionId', 'subscriptionId status'),
      SubscriptionTransaction.countDocuments(filter),
    ]);
    res.json({ success: true, ...paginateResponse(data, total, page, lim) });
  } catch (err) { next(err); }
};

/* ── GET single transaction ──────────────────────────────────────────────── */
exports.getTransaction = async (req, res, next) => {
  try {
    const txn = await SubscriptionTransaction.findById(req.params.id)
      .populate('userId', 'name email phone avatar')
      .populate('planId')
      .populate('subscriptionId');
    if (!txn) return res.status(404).json({ success: false, message: 'Transaction not found' });
    res.json({ success: true, data: txn });
  } catch (err) { next(err); }
};
