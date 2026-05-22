const Result = require('../models/Result');
const Exam = require('../models/Exam');

// Student Submit Test
const submitTest = async (req, res) => {
  try {
    const { studentId, examId, answers, timeTaken } = req.body;
    const exam = await Exam.findById(examId).populate('questions');
    if (!exam) return res.status(404).json({ message: 'Exam not found' });
    
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
  } catch (err) {
    console.error('Submit test error:', err);
    res.status(500).json({ message: 'Failed to submit test results' });
  }
};

// Get All Results (Admin View)
const getAllResults = async (req, res) => {
  try {
    const results = await Result.find()
      .populate('student', 'name rollNumber')
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

module.exports = {
  submitTest,
  getAllResults,
  getStudentResults,
  deleteAllResults
};
