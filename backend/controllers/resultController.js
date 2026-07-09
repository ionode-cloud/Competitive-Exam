const Result   = require('../models/Result');
const Exam     = require('../models/Exam');
const MockTest = require('../models/MockTest');
const Certificate = require('../models/Certificate');
const { sendNotification } = require('./notificationController');

// Student Submit Test (supports both old student flow and new user/mocktest flow)
const submitTest = async (req, res) => {
  try {
    const {
      studentId, examId, answers, timeTaken,
      userId, mockTestId, score: clientScore, correct, wrong, scoreBySection, totalMarks: clientTotalMarks
    } = req.body;

    const exam = await Exam.findById(examId).populate('questions');
    if (!exam) return res.status(404).json({ message: 'Exam not found' });

    // Recalculate score server-side for security
    let score = 0;
    const processedAnswers = answers.map(ans => {
      const question = exam.questions.find(q => q._id.toString() === ans.questionId);
      const isCorrect = question && question.correctOption === ans.selectedOption;
      if (isCorrect) score += question.marks || 1;
      else if (ans.selectedOption !== undefined && ans.selectedOption !== null) {
        score -= (exam.negativeMarking || 0);
      }
      return { ...ans, isCorrect };
    });

    const result = new Result({
      student:  studentId || userId,
      exam:     examId,
      answers:  processedAnswers,
      score,
      timeTaken
    });
    await result.save();

    // Auto-generate certificate if mockTest provided and passing marks met
    let certificate = null;
    if (mockTestId && userId) {
      const mt = await MockTest.findById(mockTestId);
      if (mt) {
        await MockTest.findByIdAndUpdate(mockTestId, { $inc: { attemptCount: 1 } });
        const totalMarks = exam.questions.reduce((sum, q) => sum + (q.marks || 1), 0);
        const percentage = (score / totalMarks) * 100;
        const passing    = mt.passingMarks || (totalMarks * 0.4);

        if (score >= passing) {
          try {
            const existing = await Certificate.findOne({ user: userId, mockTest: mockTestId });
            if (!existing) {
              certificate = new Certificate({
                user: userId, mockTest: mockTestId, course: mt.course,
                score, totalMarks, percentage: parseFloat(percentage.toFixed(2))
              });
              await certificate.save();

              await sendNotification({
                userId, type: 'certificate_ready',
                title: 'Certificate Available! 🏆',
                message: `Congratulations! Your certificate for "${mt.testName}" is ready.`,
                link: '/dashboard'
              });
            } else {
              certificate = existing;
            }
          } catch (certErr) {
            console.error('Certificate generation error:', certErr);
          }
        }

        // Send result notification
        await sendNotification({
          userId, type: 'result_published',
          title: 'Result Published 📊',
          message: `You scored ${score} marks in ${mt.testName}.`,
        });
      }
    }

    res.json({ ...result.toObject(), certificate });
  } catch (err) {
    console.error('Submit test error:', err);
    res.status(500).json({ message: 'Failed to submit test results' });
  }
};

// Get All Results (Admin View)
const getAllResults = async (req, res) => {
  try {
    const results = await Result.find()
      .populate('student', 'name rollNumber email')
      .populate('exam', 'subjectName topicName totalMarks questions')
      .sort({ submittedAt: -1 });
    res.json(results);
  } catch(err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Get Results (Student View)
const getStudentResults = async (req, res) => {
  try {
    const results = await Result.find({ student: req.params.studentId }).populate('exam');
    res.json(results);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch student results' });
  }
};

// Delete All Results
const deleteAllResults = async (req, res) => {
  try {
    await Result.deleteMany({});
    res.json({ message: 'All results cleared successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to clear results' });
  }
};

// Analytics stats for admin
const getResultStats = async (req, res) => {
  try {
    const total   = await Result.countDocuments();
    const today   = new Date(); today.setHours(0,0,0,0);
    const todayCount = await Result.countDocuments({ submittedAt: { $gte: today } });

    const scores  = await Result.find().select('score');
    const avgScore = scores.length ? (scores.reduce((s, r) => s + r.score, 0) / scores.length).toFixed(1) : 0;

    res.json({ total, today: todayCount, avgScore });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching stats' });
  }
};

module.exports = { submitTest, getAllResults, getStudentResults, deleteAllResults, getResultStats };
