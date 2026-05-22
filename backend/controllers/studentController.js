const Student = require('../models/Student');
const Result = require('../models/Result');

// Student Login
const studentLogin = async (req, res) => {
  try {
    const { name, rollNumber, subject } = req.body;
    let student = await Student.findOne({ rollNumber });
    if (!student) {
      student = new Student({ name, rollNumber, subject });
      await student.save();
    } else {
      // Update subject for subsequent logins
      student.subject = subject;
      await student.save();
    }
    res.json(student);
  } catch (err) {
    console.error('Student login error:', err);
    res.status(500).json({ message: 'Server error during student login' });
  }
};

// Get All Students (Admin View)
const getStudents = async (req, res) => {
  try {
    const students = await Student.find().populate('subject');
    res.json(students);
  } catch(err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete Student
const deleteStudent = async (req, res) => {
  try {
    await Student.findByIdAndDelete(req.params.id);
    // Also delete their results
    await Result.deleteMany({ student: req.params.id });
    res.json({ message: 'Student deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete student' });
  }
};

// Delete All Students
const deleteAllStudents = async (req, res) => {
  try {
    await Student.deleteMany({});
    // Also delete all results associated with students
    await Result.deleteMany({});
    res.json({ message: 'All student records cleared successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to clear student registry' });
  }
};

module.exports = {
  studentLogin,
  getStudents,
  deleteStudent,
  deleteAllStudents
};
