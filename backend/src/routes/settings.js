const express = require('express');
const router = express.Router();
const Setting = require('../models/Setting');
const { protect } = require('../middleware/auth');
const { adminOnly, superAdminOnly } = require('../middleware/rbac');

router.get('/', protect, adminOnly, async (req, res, next) => {
  try {
    const settings = await Setting.find({ isPublic: true }).lean();
    const obj = {};
    settings.forEach(s => { obj[s.key] = s.value; });
    res.json({ success: true, data: obj });
  } catch (err) { next(err); }
});

router.get('/all', protect, superAdminOnly, async (req, res, next) => {
  try {
    const settings = await Setting.find().lean();
    res.json({ success: true, data: settings });
  } catch (err) { next(err); }
});

router.put('/', protect, superAdminOnly, async (req, res, next) => {
  try {
    const updates = req.body; // { key: value, key2: value2 }
    const ops = Object.entries(updates).map(([key, value]) => ({
      updateOne: {
        filter: { key },
        update: { $set: { key, value, updatedBy: req.user._id } },
        upsert: true,
      },
    }));
    await Setting.bulkWrite(ops);
    res.json({ success: true, message: 'Settings updated' });
  } catch (err) { next(err); }
});

module.exports = router;
