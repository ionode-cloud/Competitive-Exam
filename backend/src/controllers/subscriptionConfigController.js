const SubscriptionConfig = require('../models/SubscriptionConfig');

// ── helper: get or auto-create singleton ────────────────────────────────────
async function getOrCreate() {
  let cfg = await SubscriptionConfig.findOne();
  if (!cfg) cfg = await SubscriptionConfig.create({});
  return cfg;
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
    let cfg = await SubscriptionConfig.findOne();
    if (!cfg) {
      cfg = await SubscriptionConfig.create(req.body);
    } else {
      Object.assign(cfg, req.body);
      await cfg.save();
    }
    res.json({ success: true, data: cfg });
  } catch (err) { next(err); }
};
