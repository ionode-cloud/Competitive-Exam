const Question = require('../models/Question');
const Exam = require('../models/Exam');

// Get All Questions
const getQuestions = async (req, res) => {
  try {
    const questions = await Question.find().populate('exam', 'topicName subjectName');
    res.json(questions);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch questions' });
  }
};

// Create Question
const createQuestion = async (req, res) => {
  try {
    const { examId, subjectName, topicName, ...questionData } = req.body;
    if (examId) questionData.exam = examId;
    if (subjectName) questionData.subjectName = subjectName;
    if (topicName) questionData.topicName = topicName;
    const question = new Question(questionData);
    await question.save();
    
    if (examId) {
      await Exam.findByIdAndUpdate(examId, { $push: { questions: question._id } });
    }
    
    res.status(201).json(question);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create question' });
  }
};

// Update Question
const updateQuestion = async (req, res) => {
  try {
    const { examId, subjectName, topicName, ...updateData } = req.body;
    if (examId) updateData.exam = examId;
    if (subjectName !== undefined) updateData.subjectName = subjectName;
    if (topicName !== undefined) updateData.topicName = topicName;
    const question = await Question.findByIdAndUpdate(req.params.id, updateData, { new: true });
    res.json(question);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update question' });
  }
};

// Delete Question
const deleteQuestion = async (req, res) => {
  try {
    const question = await Question.findByIdAndDelete(req.params.id);
    if (question && question.exam) {
      await Exam.findByIdAndUpdate(question.exam, { $pull: { questions: question._id } });
    }
    res.json({ message: 'Question deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete question' });
  }
};

// Delete all questions in a Topic
const deleteTopicQuestions = async (req, res) => {
  try {
    const { topicName } = req.query;
    if (!topicName || topicName === 'General Question Bank') {
      await Question.deleteMany({
        exam: null,
        $or: [
          { topicName: '' },
          { topicName: null },
          { topicName: 'General Question Bank' }
        ]
      });
    } else {
      const exams = await Exam.find({ topicName });
      const examIds = exams.map(e => e._id);
      await Question.deleteMany({
        $or: [
          { exam: { $in: examIds } },
          { topicName: topicName }
        ]
      });
      // Remove these questions from exams as well
      await Exam.updateMany({ topicName }, { $set: { questions: [] } });
    }
    res.json({ message: 'Topic questions deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete topic questions' });
  }
};

module.exports = {
  getQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  deleteTopicQuestions
};
