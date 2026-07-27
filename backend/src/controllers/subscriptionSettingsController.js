// subscriptionSettingsController.js
const SubscriptionSettingsModel = require('../models/SubscriptionSettingsModel');

exports.getSettings = async (req, res, next) => {
  try {
    const settings = await SubscriptionSettingsModel.getOrCreate();
    res.json({ success: true, data: settings });
  } catch (err) { next(err); }
};

exports.updateSettings = async (req, res, next) => {
  try {
    let settings = await SubscriptionSettingsModel.getOrCreate();
    Object.assign(settings, req.body);
    await settings.save();
    res.json({ success: true, data: settings, message: 'Settings saved' });
  } catch (err) { next(err); }
};
