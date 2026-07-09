const ExamSchedule = require('../models/ExamSchedule');

const getSchedules = async (req, res) => {
  try {
    const schedules = await ExamSchedule.find()
      .populate('course', 'title')
      .populate('mockTest', 'testName')
      .sort({ startDate: 1 });
    res.json(schedules);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching schedules' });
  }
};

/* ─── PUBLIC: active + live schedules for Home page ─── */
const getPublicSchedules = async (req, res) => {
  try {
    const { ids } = req.query;
    let query = { isActive: true };
    if (ids) {
      query._id = { $in: ids.split(',') };
    } else {
      const now = new Date();
      query.startDate = { $lte: now };
      query.endDate = { $gte: now };
    }
    const schedules = await ExamSchedule.find(query)
      .populate('course', 'title')
      .populate('mockTest', 'testName duration totalQuestions')
      .sort({ startDate: 1 })
      .limit(20);
    res.json(schedules);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching public schedules' });
  }
};

const createSchedule = async (req, res) => {
  try {
    const sched = new ExamSchedule(req.body);
    await sched.save();
    res.status(201).json(sched);
  } catch (err) {
    res.status(500).json({ message: 'Error creating schedule' });
  }
};

const updateSchedule = async (req, res) => {
  try {
    const sched = await ExamSchedule.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!sched) return res.status(404).json({ message: 'Schedule not found' });
    res.json(sched);
  } catch (err) {
    res.status(500).json({ message: 'Error updating schedule' });
  }
};

const deleteSchedule = async (req, res) => {
  try {
    await ExamSchedule.findByIdAndDelete(req.params.id);
    res.json({ message: 'Schedule deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting schedule' });
  }
};

module.exports = { getSchedules, getPublicSchedules, createSchedule, updateSchedule, deleteSchedule };
