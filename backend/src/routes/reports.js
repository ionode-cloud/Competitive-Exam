const express = require('express');
const router = express.Router();
const Purchase = require('../models/Purchase');
const User = require('../models/User');
const MockTest = require('../models/MockTest');
const Question = require('../models/Question');
const XLSX = require('xlsx');
const { protect } = require('../middleware/auth');
const { adminOnly } = require('../middleware/rbac');

// Revenue report
router.get('/revenue', protect, adminOnly, async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const match = { status: 'completed' };
    if (from || to) {
      match.createdAt = {};
      if (from) match.createdAt.$gte = new Date(from);
      if (to) match.createdAt.$lte = new Date(to);
    }

    const data = await Purchase.aggregate([
      { $match: match },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' }, day: { $dayOfMonth: '$createdAt' } },
          revenue: { $sum: '$finalAmount' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
    ]);

    res.json({ success: true, data });
  } catch (err) { next(err); }
});

// Student growth report
router.get('/students', protect, adminOnly, async (req, res, next) => {
  try {
    const data = await User.aggregate([
      { $match: { role: 'student' } },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

// Top mock tests
router.get('/top-tests', protect, adminOnly, async (req, res, next) => {
  try {
    const data = await MockTest.find({ status: 'published' })
      .sort('-totalAttempts').limit(10)
      .select('name examination totalAttempts averageScore')
      .populate('examination', 'name');
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

// Export revenue to Excel
router.get('/export/revenue', protect, adminOnly, async (req, res, next) => {
  try {
    const purchases = await Purchase.find({ status: 'completed' })
      .populate('student', 'name email')
      .sort('-createdAt')
      .lean();

    const rows = purchases.map(p => ({
      'Order ID': p.orderId,
      Student: p.student?.name,
      Email: p.student?.email,
      Product: p.productName,
      Amount: p.finalAmount,
      Currency: p.currency,
      Date: new Date(p.createdAt).toLocaleDateString(),
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Revenue');
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', `attachment; filename=revenue_report_${Date.now()}.xlsx`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (err) { next(err); }
});

module.exports = router;
