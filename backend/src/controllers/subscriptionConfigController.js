const SubscriptionConfig = require('../models/SubscriptionConfig');

// ── helper: get or auto-create singleton ────────────────────────────────────
async function getOrCreate() {
  try {
    let cfg = await SubscriptionConfig.findOne();
    if (!cfg) cfg = await SubscriptionConfig.create({});
    return cfg;
  } catch (err) {
    console.error('SubscriptionConfig getOrCreate error, resetting schema:', err.message);
    await SubscriptionConfig.deleteMany({}).catch(() => {});
    const newCfg = await SubscriptionConfig.create({});
    return newCfg;
  }
}

// ── Public endpoint (user-facing) ───────────────────────────────────────────
exports.getPublicConfig = async (req, res, next) => {
  try {
    const cfg = await getOrCreate();
    res.json({ success: true, data: cfg });
  } catch (err) { next(err); }
};

// ── Admin: get ───────────────────────────────────────────────────────────────
exports.getConfig = async (req, res, next) => {
  try {
    const cfg = await getOrCreate();
    res.json({ success: true, data: cfg });
  } catch (err) { next(err); }
};

// ── Admin: update full config ────────────────────────────────────────────────
exports.updateConfig = async (req, res, next) => {
  try {
    const body = { ...req.body };
    delete body._id;
    delete body.__v;
    delete body.createdAt;
    delete body.updatedAt;

    if (Array.isArray(body.monthlyPlans)) {
      body.monthlyPlans = body.monthlyPlans.map(p => {
        const item = { ...p };
        delete item._id;
        return item;
      });
    }
    if (Array.isArray(body.yearlyPlans)) {
      body.yearlyPlans = body.yearlyPlans.map(p => {
        const item = { ...p };
        delete item._id;
        return item;
      });
    }
    if (Array.isArray(body.combos)) {
      body.combos = body.combos.map(c => {
        const item = { ...c };
        delete item._id;
        return item;
      });
    }

    const cfg = await SubscriptionConfig.findOneAndUpdate(
      {},
      { $set: body },
      { new: true, runValidators: true, upsert: true }
    );
    res.json({ success: true, data: cfg });
  } catch (err) {
    console.error('Update SubscriptionConfig Error:', err);
    next(err);
  }
};
