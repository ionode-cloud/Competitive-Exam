const EbookConfig = require('../models/EbookConfig');

async function getOrCreate() {
  let cfg = await EbookConfig.findOne();
  if (!cfg) cfg = await EbookConfig.create({});
  return cfg;
}

exports.getPublicConfig = async (req, res, next) => {
  try {
    const cfg = await getOrCreate();
    res.json({ success: true, data: cfg });
  } catch (err) { next(err); }
};

exports.getConfig = async (req, res, next) => {
  try {
    const cfg = await getOrCreate();
    res.json({ success: true, data: cfg });
  } catch (err) { next(err); }
};

exports.updateConfig = async (req, res, next) => {
  try {
    let cfg = await EbookConfig.findOne();
    if (!cfg) {
      cfg = await EbookConfig.create(req.body);
    } else {
      Object.assign(cfg, req.body);
      await cfg.save();
    }
    res.json({ success: true, data: cfg });
  } catch (err) { next(err); }
};
