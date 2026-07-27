const User = require('../models/User');
const MockTest = require('../models/MockTest');
const Question = require('../models/Question');
const Subject = require('../models/Subject');
const Purchase = require('../models/Purchase');

// @desc    Dashboard stats
// @route   GET /api/dashboard
exports.getDashboardStats = async (req, res, next) => {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const [
      totalStudents, totalMockTests, publishedTests, draftTests,
      questionCount, subjectCount, totalRevenue, todayRevenue,
      liveExams, pendingExams,
      recentStudents, recentPayments,
      monthlyRevenue, studentGrowth, mockTestAttempts,
    ] = await Promise.all([
      User.countDocuments({ role: 'student' }),
      MockTest.countDocuments(),
      MockTest.countDocuments({ status: 'published' }),
      MockTest.countDocuments({ status: 'draft' }),
      Question.countDocuments(),
      Subject.countDocuments(),
      Purchase.aggregate([{ $match: { status: 'completed' } }, { $group: { _id: null, total: { $sum: '$finalAmount' } } }]),
      Purchase.aggregate([{ $match: { status: 'completed', createdAt: { $gte: todayStart } } }, { $group: { _id: null, total: { $sum: '$finalAmount' } } }]),
      MockTest.countDocuments({ status: 'published', examStartTime: { $lte: now }, examEndTime: { $gte: now } }),
      MockTest.countDocuments({ status: 'scheduled' }),
      User.find({ role: 'student' }).sort('-createdAt').limit(5).select('name email avatar createdAt'),
      Purchase.find({ status: 'completed' }).sort('-createdAt').limit(5).populate('student', 'name email').populate('paymentId', 'amount method'),

      // Monthly revenue for last 6 months
      Purchase.aggregate([
        { $match: { status: 'completed', createdAt: { $gte: new Date(now.getFullYear(), now.getMonth() - 5, 1) } } },
        { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, revenue: { $sum: '$finalAmount' }, orders: { $sum: 1 } } },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),

      // Student growth for last 6 months
      User.aggregate([
        { $match: { role: 'student', createdAt: { $gte: new Date(now.getFullYear(), now.getMonth() - 5, 1) } } },
        { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),

      // Mock test attempts by exam
      MockTest.aggregate([
        { $group: { _id: '$examination', attempts: { $sum: '$totalAttempts' }, count: { $sum: 1 } } },
        { $lookup: { from: 'examinations', localField: '_id', foreignField: '_id', as: 'exam' } },
        { $unwind: '$exam' },
        { $project: { name: '$exam.name', attempts: 1, count: 1 } },
        { $sort: { attempts: -1 } },
        { $limit: 5 },
      ]),
    ]);

    res.json({
      success: true,
      data: {
        stats: {
          totalStudents,
          totalMockTests,
          publishedTests,
          draftTests,
          questionCount,
          subjectCount,
          totalRevenue: totalRevenue[0]?.total || 0,
          todayRevenue: todayRevenue[0]?.total || 0,
          liveExams,
          pendingExams,
        },
        recentStudents,
        recentPayments,
        charts: {
          monthlyRevenue,
          studentGrowth,
          mockTestAttempts,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};
