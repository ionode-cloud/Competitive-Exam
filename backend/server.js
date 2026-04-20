const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Resend } = require('resend');

dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// --- Schemas ---

const AdminSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  plainPassword: { type: String }
});

const StudentSchema = new mongoose.Schema({
  name: String,
  rollNumber: { type: String, required: true, unique: true },
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam' }
});

const QuestionSchema = new mongoose.Schema({
  text: String,
  options: [String],
  correctOption: Number, // 0, 1, 2, 3
  section: String,
  marks: { type: Number, default: 1 },
  exam: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam' }
});

const ExamSchema = new mongoose.Schema({
  subjectName: String,
  topicName: String,
  negativeMarking: { type: Number, default: 0 },
  totalMarks: { type: Number, default: 0 },
  duration: Number, // in minutes
  sections: [String],
  questions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
  isActive: { type: Boolean, default: true }
});

const ResultSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
  exam: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam' },
  answers: [{
    questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
    selectedOption: Number,
    isCorrect: Boolean,
    status: { type: String, enum: ['answered', 'marked', 'not-answered', 'not-visited'] }
  }],
  score: Number,
  timeTaken: Number,
  submittedAt: { type: Date, default: Date.now }
});

// OTP Schema for forgot password
const OtpSchema = new mongoose.Schema({
  email: { type: String, required: true },
  otp: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: 300 } // auto-delete after 5 minutes
});

const Admin = mongoose.model('Admin', AdminSchema);
const Student = mongoose.model('Student', StudentSchema);
const Question = mongoose.model('Question', QuestionSchema);
const Exam = mongoose.model('Exam', ExamSchema);
const Result = mongoose.model('Result', ResultSchema);
const OtpModel = mongoose.model('Otp', OtpSchema);

// --- Middleware ---
const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization');
  if (!token) return res.status(401).json({ message: 'No token, authorization denied' });
  try {
    const decoded = jwt.verify(token.replace('Bearer ', ''), process.env.JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// --- Routes ---

// =============================================
// FORGOT PASSWORD - Step 1: Send OTP via Email
// =============================================
app.post('/api/admin/forgot-password/send-otp', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    // Check if admin exists
    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(404).json({ message: 'No admin account found with this email' });

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Remove any existing OTP for this email
    await OtpModel.deleteMany({ email });

    // Save new OTP
    await OtpModel.create({ email, otp });

    // Send OTP via Resend
    const { error } = await resend.emails.send({
      from: 'Exam Admin <onboarding@resend.dev>',
      to: [email],
      subject: 'Password Reset OTP - Exam Management System',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 32px; background: #0f172a; border-radius: 12px; color: #e2e8f0;">
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="width: 60px; height: 60px; border-radius: 50%; background: #6366f1; display: inline-flex; align-items: center; justify-content: center; font-size: 28px;">🔐</div>
            <h2 style="margin: 16px 0 4px; color: #fff;">Password Reset Request</h2>
            <p style="color: #94a3b8; margin: 0;">Exam Management System - Admin Panel</p>
          </div>
          <div style="background: rgba(99,102,241,0.12); border: 1px solid rgba(99,102,241,0.3); border-radius: 10px; padding: 24px; text-align: center; margin-bottom: 24px;">
            <p style="margin: 0 0 8px; color: #94a3b8; font-size: 14px;">Your One-Time Password (OTP)</p>
            <div style="font-size: 42px; font-weight: 700; letter-spacing: 10px; color: #818cf8;">${otp}</div>
            <p style="margin: 12px 0 0; color: #64748b; font-size: 12px;">⏱ This OTP expires in <strong style="color:#f59e0b;">5 minutes</strong></p>
          </div>
          <p style="color: #94a3b8; font-size: 13px; text-align: center; margin: 0;">If you did not request a password reset, please ignore this email. Your account is safe.</p>
        </div>
      `
    });

    if (error) {
      console.error('Resend error:', error);
      return res.status(500).json({ message: 'Failed to send OTP email. Please try again.' });
    }

    res.json({ message: 'OTP sent successfully to your email', success: true });
  } catch (err) {
    console.error('Send OTP error:', err);
    res.status(500).json({ message: 'Server error while sending OTP' });
  }
});

// =============================================
// FORGOT PASSWORD - Step 2: Verify OTP
// =============================================
app.post('/api/admin/forgot-password/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ message: 'Email and OTP are required' });

    const record = await OtpModel.findOne({ email });
    if (!record) return res.status(400).json({ message: 'OTP expired or not found. Please request a new one.' });
    if (record.otp !== otp) return res.status(400).json({ message: 'Invalid OTP. Please try again.' });

    // OTP valid - issue a temporary reset token
    const resetToken = jwt.sign({ email, purpose: 'password-reset' }, process.env.JWT_SECRET, { expiresIn: '10m' });

    // Delete used OTP
    await OtpModel.deleteMany({ email });

    res.json({ message: 'OTP verified successfully', resetToken, success: true });
  } catch (err) {
    console.error('Verify OTP error:', err);
    res.status(500).json({ message: 'Server error while verifying OTP' });
  }
});

// =============================================
// FORGOT PASSWORD - Step 3: Reset Password
// =============================================
app.post('/api/admin/forgot-password/reset', async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;
    if (!resetToken || !newPassword) return res.status(400).json({ message: 'Reset token and new password are required' });
    if (newPassword.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });

    // Verify reset token
    let decoded;
    try {
      decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
    } catch (e) {
      return res.status(400).json({ message: 'Reset session expired. Please start over.' });
    }

    if (decoded.purpose !== 'password-reset') return res.status(400).json({ message: 'Invalid reset token' });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await Admin.findOneAndUpdate(
      { email: decoded.email },
      { password: hashedPassword, plainPassword: newPassword }
    );

    res.json({ message: 'Password reset successfully! You can now login with your new password.', success: true });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ message: 'Server error while resetting password' });
  }
});

// Admin Login
app.post('/api/admin/login', async (req, res) => {
  const { email, password } = req.body;
  const admin = await Admin.findOne({ email });
  if (!admin || !await bcrypt.compare(password, admin.password)) {
    return res.status(400).json({ message: 'Invalid credentials' });
  }
  const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET);
  res.json({ token });
});

// Student Login
app.post('/api/student/login', async (req, res) => {
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
});

// Get All Students (Admin View)
app.get('/api/students', authMiddleware, async (req, res) => {
  try {
    const students = await Student.find().populate('subject');
    res.json(students);
  } catch(err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete Student
app.delete('/api/students/:id', authMiddleware, async (req, res) => {
  try {
    await Student.findByIdAndDelete(req.params.id);
    // Also delete their results
    await Result.deleteMany({ student: req.params.id });
    res.json({ message: 'Student deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete student' });
  }
});

// Delete All Students
app.delete('/api/students/bulk/all', authMiddleware, async (req, res) => {
  try {
    await Student.deleteMany({});
    // Also delete all results associated with students
    await Result.deleteMany({});
    res.json({ message: 'All student records cleared successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to clear student registry' });
  }
});
app.get('/api/questions', authMiddleware, async (req, res) => {
  const questions = await Question.find().populate('exam', 'topicName subjectName');
  res.json(questions);
});

app.post('/api/questions', authMiddleware, async (req, res) => {
  const { examId, ...questionData } = req.body;
  // If examId is provided, save it as a reference on the question
  if (examId) questionData.exam = examId;
  const question = new Question(questionData);
  await question.save();
  
  if (examId) {
    await Exam.findByIdAndUpdate(examId, { $push: { questions: question._id } });
  }
  
  res.status(201).json(question);
});

// Update Question
app.put('/api/questions/:id', authMiddleware, async (req, res) => {
  try {
    const { examId, ...updateData } = req.body;
    if (examId) updateData.exam = examId;
    const question = await Question.findByIdAndUpdate(req.params.id, updateData, { new: true });
    res.json(question);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update question' });
  }
});

// Delete Question
app.delete('/api/questions/:id', authMiddleware, async (req, res) => {
  try {
    const question = await Question.findByIdAndDelete(req.params.id);
    if (question && question.exam) {
      await Exam.findByIdAndUpdate(question.exam, { $pull: { questions: question._id } });
    }
    res.json({ message: 'Question deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete question' });
  }
});

// Delete all questions in a Topic
app.delete('/api/questions/bulk/topic', authMiddleware, async (req, res) => {
  try {
    const { topicName } = req.query;
    if (topicName === 'General Question Bank') {
      await Question.deleteMany({ exam: null });
    } else {
      const exams = await Exam.find({ topicName });
      const examIds = exams.map(e => e._id);
      await Question.deleteMany({ exam: { $in: examIds } });
      // Remove these questions from exams as well (though questions are deleted, cleaner to empty the arrays)
      await Exam.updateMany({ topicName }, { $set: { questions: [] } });
    }
    res.json({ message: 'Topic questions deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete topic questions' });
  }
});

// Manage Exams (Bulk Create)
app.post('/api/exams', authMiddleware, async (req, res) => {
  try {
    const { subjectName, topicName, negativeMarking, totalMarks, duration, questions: questionDatas } = req.body;
    
    // Automatically derive sections from questions
    const sections = [...new Set(questionDatas.map(q => q.section).filter(Boolean))];

    const exam = new Exam({ subjectName, topicName, negativeMarking, totalMarks, duration, sections });
    await exam.save();

    if (questionDatas && questionDatas.length > 0) {
      const questionsWithExamId = questionDatas.map(q => ({ ...q, exam: exam._id, marks: q.marks || 1 }));
      const savedQuestions = await Question.insertMany(questionsWithExamId);
      exam.questions = savedQuestions.map(q => q._id);
      await exam.save();
    }
    
    res.status(201).json(exam);
  } catch (err) {
    console.error('Exam bulk create error:', err);
    res.status(500).json({ message: 'Failed to create exam and questions' });
  }
});

app.put('/api/exams/:id/status', authMiddleware, async (req, res) => {
  try {
    const { isActive } = req.body;
    const exam = await Exam.findByIdAndUpdate(req.params.id, { isActive }, { new: true });
    if (!exam) return res.status(404).json({ message: 'Exam not found' });
    res.json(exam);
  } catch (err) {
    res.status(500).json({ message: 'Error updating exam status' });
  }
});

app.delete('/api/exams/:id', authMiddleware, async (req, res) => {
  try {
    const exam = await Exam.findByIdAndDelete(req.params.id);
    if (!exam) return res.status(404).json({ message: 'Exam not found' });
    res.json({ message: 'Exam deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting exam' });
  }
});

app.get('/api/exams', async (req, res) => {
  const exams = await Exam.find().populate('questions');
  res.json(exams);
});


// Student Submit Test
app.post('/api/submit', async (req, res) => {
  const { studentId, examId, answers, timeTaken } = req.body;
  const exam = await Exam.findById(examId).populate('questions');
  
  let score = 0;
  const processedAnswers = answers.map(ans => {
    const question = exam.questions.find(q => q._id.toString() === ans.questionId);
    const isCorrect = question && question.correctOption === ans.selectedOption;
    if (isCorrect) score += question.marks;
    return { ...ans, isCorrect };
  });

  const result = new Result({
    student: studentId,
    exam: examId,
    answers: processedAnswers,
    score,
    timeTaken
  });
  await result.save();
  res.json(result);
});

// Get All Results (Admin)
app.get('/api/results', authMiddleware, async (req, res) => {
  try {
    const results = await Result.find()
      .populate('student', 'name rollNumber')
      .populate('exam', 'subjectName topicName totalMarks questions')
      .sort({ submittedAt: -1 });
    res.json(results);
  } catch(err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get Results (Student)
app.get('/api/results/:studentId', async (req, res) => {
  const results = await Result.find({ student: req.params.studentId }).populate('exam');
  res.json(results);
});

// Delete All Results
app.delete('/api/results/all', authMiddleware, async (req, res) => {
  try {
    await Result.deleteMany({});
    res.json({ message: 'All results cleared successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to clear results' });
  }
});

// Manage Admins
app.get('/api/admins', authMiddleware, async (req, res) => {
  try {
    const admins = await Admin.find().select('-password');
    res.json(admins);
  } catch(err) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/admins', authMiddleware, async (req, res) => {
  try {
    const { email, password } = req.body;
    const existing = await Admin.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Admin already exists' });
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const admin = new Admin({ email, password: hashedPassword, plainPassword: password });
    await admin.save();
    
    res.status(201).json({ _id: admin._id, email: admin.email, plainPassword: admin.plainPassword });
  } catch(err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Initial Admin Creation (Seed)
const seedAdmin = async () => {
  const count = await Admin.countDocuments();
  if (count === 0) {
    const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);
    await Admin.create({
      email: process.env.ADMIN_EMAIL,
      password: hashedPassword,
      plainPassword: process.env.ADMIN_PASSWORD
    });
    console.log('Seed admin created');
  }
};
seedAdmin();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
