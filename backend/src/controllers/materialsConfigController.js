const MaterialsConfig = require('../models/MaterialsConfig');

// ── helper: get or create singleton ─────────────────────────────────────────
async function getOrCreate() {
  let cfg = await MaterialsConfig.findOne();
  if (!cfg) cfg = await MaterialsConfig.create({});
  return cfg;
}

// ── Public endpoint ──────────────────────────────────────────────────────────
exports.getPublicConfig = async (req, res, next) => {
  try {
    const cfg = await getOrCreate();
    res.json({ success: true, data: cfg });
  } catch (err) { next(err); }
};

// ── Admin get ────────────────────────────────────────────────────────────────
exports.getConfig = async (req, res, next) => {
  try {
    const cfg = await getOrCreate();
    res.json({ success: true, data: cfg });
  } catch (err) { next(err); }
};

// ── Admin update ─────────────────────────────────────────────────────────────
exports.updateConfig = async (req, res, next) => {
  try {
    let cfg = await MaterialsConfig.findOne();
    if (!cfg) {
      cfg = await MaterialsConfig.create(req.body);
    } else {
      Object.assign(cfg, req.body);
      await cfg.save();
    }
    res.json({ success: true, data: cfg });
  } catch (err) { next(err); }
};
