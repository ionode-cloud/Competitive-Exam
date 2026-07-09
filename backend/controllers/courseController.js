const Course    = require('../models/Course');
const MockTest  = require('../models/MockTest');
const Category  = require('../models/Category');

/* ─── GET ALL COURSES (public) ─── */
const getCourses = async (req, res) => {
  try {
    const { category, difficulty, search, active } = req.query;
    const filter = {};
    if (active !== 'false') filter.isActive = true;
    if (category)   filter.category = category;
    if (difficulty) filter.difficulty = difficulty;
    if (search)     filter.title = { $regex: search, $options: 'i' };

    const courses = await Course.find(filter)
      .populate('category', 'name icon color')
      .sort({ createdAt: -1 });

    // Attach mocktest count per course
    const courseIds = courses.map(c => c._id);
    const mockCounts = await MockTest.aggregate([
      { $match: { course: { $in: courseIds }, isActive: true } },
      { $group: { _id: '$course', count: { $sum: 1 } } }
    ]);
    const countMap = {};
    mockCounts.forEach(m => { countMap[m._id.toString()] = m.count; });

    const result = courses.map(c => ({
      ...c.toObject(),
      totalMockTests: countMap[c._id.toString()] || c.totalMockTests || 0
    }));

    res.json(result);
  } catch (err) {
    console.error('getCourses error:', err);
    res.status(500).json({ message: 'Error fetching courses' });
  }
};

/* ─── GET SINGLE COURSE (public) ─── */
const getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).populate('category', 'name icon color');
    if (!course) return res.status(404).json({ message: 'Course not found' });

    const mockTests = await MockTest.find({ course: course._id, isActive: true })
      .populate('exam', 'subjectName topicName duration')
      .sort({ testNumber: 1 });

    res.json({ ...course.toObject(), mockTests });
  } catch (err) {
    console.error('getCourseById error:', err);
    res.status(500).json({ message: 'Error fetching course' });
  }
};

/* ─── CREATE COURSE (admin) ─── */
const createCourse = async (req, res) => {
  try {
    const course = new Course(req.body);
    await course.save();
    res.status(201).json(course);
  } catch (err) {
    console.error('createCourse error:', err);
    res.status(500).json({ message: 'Error creating course' });
  }
};

/* ─── UPDATE COURSE (admin) ─── */
const updateCourse = async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!course) return res.status(404).json({ message: 'Course not found' });
    res.json(course);
  } catch (err) {
    res.status(500).json({ message: 'Error updating course' });
  }
};

/* ─── DELETE COURSE (admin) ─── */
const deleteCourse = async (req, res) => {
  try {
    await Course.findByIdAndDelete(req.params.id);
    // Also remove associated mock tests
    await MockTest.deleteMany({ course: req.params.id });
    res.json({ message: 'Course and its mock tests deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting course' });
  }
};

/* ─── GET ALL CATEGORIES (public) ─── */
const getCategories = async (req, res) => {
  try {
    const cats = await Category.find({ isActive: true }).sort({ name: 1 });
    res.json(cats);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching categories' });
  }
};

/* ─── CREATE CATEGORY (admin) ─── */
const createCategory = async (req, res) => {
  try {
    if (req.body.name) {
      req.body.slug = req.body.name
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/&/g, '-and-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-');
    }
    const cat = new Category(req.body);
    await cat.save();
    res.status(201).json(cat);
  } catch (err) {
    console.error('createCategory error:', err);
    res.status(500).json({ message: 'Error creating category' });
  }
};

/* ─── UPDATE CATEGORY (admin) ─── */
const updateCategory = async (req, res) => {
  try {
    if (req.body.name) {
      req.body.slug = req.body.name
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/&/g, '-and-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-');
    }
    const cat = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!cat) return res.status(404).json({ message: 'Category not found' });
    res.json(cat);
  } catch (err) {
    console.error('updateCategory error:', err);
    res.status(500).json({ message: 'Error updating category' });
  }
};

/* ─── DELETE CATEGORY (admin) ─── */
const deleteCategory = async (req, res) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    res.json({ message: 'Category deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting category' });
  }
};

/* ─── COURSE STATS (admin) ─── */
const getCourseStats = async (req, res) => {
  try {
    const Payment = require('../models/Payment');
    const courseId = req.params.id;
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    const mockTests = await MockTest.find({ course: courseId });
    const mockTestIds = mockTests.map(m => m._id);

    const revenue = await Payment.aggregate([
      { $match: { courseId: course._id, status: 'success' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    res.json({
      course,
      totalMockTests: mockTests.length,
      totalRevenue: (revenue[0]?.total || 0) / 100,  // paise → rupees
      enrolledCount: course.enrolledCount,
    });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching stats' });
  }
};

module.exports = {
  getCourses, getCourseById, createCourse, updateCourse, deleteCourse,
  getCategories, createCategory, updateCategory, deleteCategory,
  getCourseStats
};
