const MockTest = require('../models/MockTest');
const Course   = require('../models/Course');
const User     = require('../models/User');

/* ─── GET MOCK TESTS BY COURSE (public + auth-aware) ─── */
const getMockTestsByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.query.userId;

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    const mockTests = await MockTest.find({ course: courseId, isActive: true })
      .populate('exam', 'subjectName topicName duration')
      .sort({ testNumber: 1 });

    // Determine which tests are free based on course.freeTestsCount
    const freeCount = course.freeTestsCount || 2;

    // Get user purchases if userId provided
    let userPurchasedIds = new Set();
    if (userId) {
      const user = await User.findById(userId).select('purchases');
      if (user && user.purchases) {
        user.purchases.forEach(id => userPurchasedIds.add(id.toString()));
      }
    }

    const result = mockTests.map((mt, index) => {
      const isFreeByIndex = index < freeCount;
      const isUnlocked = isFreeByIndex || mt.isFree || userPurchasedIds.has(mt._id.toString());
      return {
        ...mt.toObject(),
        isFree: isFreeByIndex || mt.isFree,
        isUnlocked
      };
    });

    res.json({ course, mockTests: result });
  } catch (err) {
    console.error('getMockTestsByCourse error:', err);
    res.status(500).json({ message: 'Error fetching mock tests' });
  }
};

/* ─── GET SINGLE MOCK TEST (validates user access) ─── */
const getMockTestById = async (req, res) => {
  try {
    const mt = await MockTest.findById(req.params.id)
      .populate('exam')
      .populate('course', 'title freeTestsCount');
    if (!mt) return res.status(404).json({ message: 'Mock test not found' });
    res.json(mt);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching mock test' });
  }
};

/* ─── CREATE MOCK TEST (admin) ─── */
const createMockTest = async (req, res) => {
  try {
    const mt = new MockTest(req.body);
    await mt.save();
    // Update course mock test count
    await Course.findByIdAndUpdate(mt.course, { $inc: { totalMockTests: 1 } });
    res.status(201).json(mt);
  } catch (err) {
    console.error('createMockTest error:', err);
    res.status(500).json({ message: 'Error creating mock test' });
  }
};

/* ─── UPDATE MOCK TEST (admin) ─── */
const updateMockTest = async (req, res) => {
  try {
    const mt = await MockTest.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!mt) return res.status(404).json({ message: 'Mock test not found' });
    res.json(mt);
  } catch (err) {
    res.status(500).json({ message: 'Error updating mock test' });
  }
};

/* ─── DELETE MOCK TEST (admin) ─── */
const deleteMockTest = async (req, res) => {
  try {
    const mt = await MockTest.findByIdAndDelete(req.params.id);
    if (!mt) return res.status(404).json({ message: 'Mock test not found' });
    await Course.findByIdAndUpdate(mt.course, { $inc: { totalMockTests: -1 } });
    res.json({ message: 'Mock test deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting mock test' });
  }
};

/* ─── DUPLICATE MOCK TEST (admin) ─── */
const duplicateMockTest = async (req, res) => {
  try {
    const original = await MockTest.findById(req.params.id);
    if (!original) return res.status(404).json({ message: 'Mock test not found' });
    const { _id, createdAt, updatedAt, ...data } = original.toObject();
    const copy = new MockTest({ ...data, testName: `${data.testName} (Copy)`, attemptCount: 0 });
    await copy.save();
    res.status(201).json(copy);
  } catch (err) {
    res.status(500).json({ message: 'Error duplicating mock test' });
  }
};

/* ─── TOGGLE MOCK TEST STATUS (admin) ─── */
const toggleMockTestStatus = async (req, res) => {
  try {
    const mt = await MockTest.findById(req.params.id);
    if (!mt) return res.status(404).json({ message: 'Mock test not found' });
    mt.isActive = !mt.isActive;
    await mt.save();
    res.json(mt);
  } catch (err) {
    res.status(500).json({ message: 'Error toggling status' });
  }
};

/* ─── GET ALL MOCK TESTS (admin) ─── */
const getAllMockTests = async (req, res) => {
  try {
    const mts = await MockTest.find()
      .populate('course', 'title')
      .populate('exam', 'subjectName topicName')
      .sort({ createdAt: -1 });
    res.json(mts);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching mock tests' });
  }
};

/* ─── GET PUBLIC TRENDING MOCK TESTS (home page, no auth) ─── */
const getPublicMockTests = async (req, res) => {
  try {
    const { ids } = req.query;
    let query = { isActive: true };
    if (ids) {
      query._id = { $in: ids.split(',') };
    }
    const mts = await MockTest.find(query)
      .populate('course', 'title')
      .sort({ attemptCount: -1, createdAt: -1 })
      .limit(6);
    res.json(mts);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching public mock tests' });
  }
};

module.exports = {
  getMockTestsByCourse, getMockTestById, createMockTest,
  updateMockTest, deleteMockTest, duplicateMockTest,
  toggleMockTestStatus, getAllMockTests, getPublicMockTests
};
