// subscriptionController.js — Plan CRUD
const SubscriptionPlan        = require('../models/SubscriptionPlan');
const UserSubscription        = require('../models/UserSubscription');
const { paginate, paginateResponse } = require('../utils/pagination');

/* ── GET all plans ─────────────────────────────────────────────────────────── */
exports.getPlans = async (req, res, next) => {
  try {
    const { search = '', status, page = 1, limit = 20 } = req.query;
    const filter = { isDeleted: false };
    if (search) filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { code: { $regex: search, $options: 'i' } },
    ];
    if (status === 'active')   filter.isActive = true;
    if (status === 'inactive') filter.isActive = false;

    const { skip, limit: lim } = paginate(null, page, limit);
    const [data, total] = await Promise.all([
      SubscriptionPlan.find(filter).sort('-createdAt').skip(skip).limit(lim),
      SubscriptionPlan.countDocuments(filter),
    ]);
    res.json({ success: true, ...paginateResponse(data, total, page, lim) });
  } catch (err) { next(err); }
};

/* ── GET single plan ───────────────────────────────────────────────────────── */
exports.getPlan = async (req, res, next) => {
  try {
    const plan = await SubscriptionPlan.findOne({ _id: req.params.id, isDeleted: false });
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });
    res.json({ success: true, data: plan });
  } catch (err) { next(err); }
};

/* ── CREATE plan ───────────────────────────────────────────────────────────── */
exports.createPlan = async (req, res, next) => {
  try {
    const plan = await SubscriptionPlan.create(req.body);
    res.status(201).json({ success: true, data: plan, message: 'Plan created' });
  } catch (err) { next(err); }
};

/* ── UPDATE plan ───────────────────────────────────────────────────────────── */
exports.updatePlan = async (req, res, next) => {
  try {
    const plan = await SubscriptionPlan.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      req.body,
      { new: true, runValidators: true }
    );
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });
    res.json({ success: true, data: plan, message: 'Plan updated' });
  } catch (err) { next(err); }
};

/* ── TOGGLE status ─────────────────────────────────────────────────────────── */
exports.togglePlanStatus = async (req, res, next) => {
  try {
    const plan = await SubscriptionPlan.findOne({ _id: req.params.id, isDeleted: false });
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });
    plan.isActive = !plan.isActive;
    await plan.save();
    res.json({ success: true, data: plan, message: `Plan ${plan.isActive ? 'activated' : 'deactivated'}` });
  } catch (err) { next(err); }
};

/* ── DUPLICATE plan ────────────────────────────────────────────────────────── */
exports.duplicatePlan = async (req, res, next) => {
  try {
    const src = await SubscriptionPlan.findOne({ _id: req.params.id, isDeleted: false });
    if (!src) return res.status(404).json({ success: false, message: 'Plan not found' });

    const obj = src.toObject();
    delete obj._id; delete obj.createdAt; delete obj.updatedAt; delete obj.__v;
    obj.name = obj.name + ' (Copy)';
    obj.code = obj.code + '_COPY_' + Date.now();
    obj.subscriberCount = 0;
    obj.isActive = false;

    const copy = await SubscriptionPlan.create(obj);
    res.status(201).json({ success: true, data: copy, message: 'Plan duplicated' });
  } catch (err) { next(err); }
};

/* ── DELETE plan (soft) ────────────────────────────────────────────────────── */
exports.deletePlan = async (req, res, next) => {
  try {
    const plan = await SubscriptionPlan.findOne({ _id: req.params.id, isDeleted: false });
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });

    // Check active subscribers
    const activeCount = await UserSubscription.countDocuments({ planId: plan._id, status: 'active' });
    if (activeCount > 0) {
      // Soft delete only — deactivate
      plan.isActive = false;
      plan.isDeleted = true;
      await plan.save();
      return res.json({ success: true, message: `Plan deactivated (${activeCount} active subscribers retained)` });
    }

    plan.isDeleted = true;
    await plan.save();
    res.json({ success: true, message: 'Plan deleted' });
  } catch (err) { next(err); }
};
