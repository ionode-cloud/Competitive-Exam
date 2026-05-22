const Exam = require('../models/Exam');
const Question = require('../models/Question');

// Bulk Create Exam and Questions
const createExam = async (req, res) => {
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
};

// Update Exam Status
const updateExamStatus = async (req, res) => {
  try {
    const { isActive } = req.body;
    const exam = await Exam.findByIdAndUpdate(req.params.id, { isActive }, { new: true });
    if (!exam) return res.status(404).json({ message: 'Exam not found' });
    res.json(exam);
  } catch (err) {
    res.status(500).json({ message: 'Error updating exam status' });
  }
};

// Delete Exam
const deleteExam = async (req, res) => {
  try {
    const exam = await Exam.findByIdAndDelete(req.params.id);
    if (!exam) return res.status(404).json({ message: 'Exam not found' });
    res.json({ message: 'Exam deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting exam' });
  }
};

// Get All Exams
const getExams = async (req, res) => {
  try {
    const exams = await Exam.find().populate('questions');
    res.json(exams);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching exams' });
  }
};

// Get Exam Instructions
const getExamInstructions = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id).populate('questions');
    if (!exam) return res.status(404).json({ message: 'Exam not found' });
    res.json(exam);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch instructions' });
  }
};

// Update Exam Instructions & Languages
const updateExamInstructions = async (req, res) => {
  try {
    const { instructions, languages, customSections, negativeMarking } = req.body;

    const updatePayload = { $set: { languages } };
    if (instructions) {
      if (instructions.English !== undefined) updatePayload.$set['instructions.English'] = instructions.English;
      if (instructions.Hindi   !== undefined) updatePayload.$set['instructions.Hindi']   = instructions.Hindi;
      if (instructions.Odia    !== undefined) updatePayload.$set['instructions.Odia']    = instructions.Odia;
    }
    if (customSections !== undefined) {
      updatePayload.$set.customSections = customSections;
    }
    if (negativeMarking !== undefined) {
      updatePayload.$set.negativeMarking = Number(negativeMarking);
    }

    const exam = await Exam.findByIdAndUpdate(
      req.params.id,
      updatePayload,
      { new: true, strict: false }
    );
    if (!exam) return res.status(404).json({ message: 'Exam not found' });
    res.json(exam);
  } catch (err) {
    console.error('Update instructions error:', err);
    res.status(500).json({ message: 'Failed to update instructions' });
  }
};

module.exports = {
  createExam,
  updateExamStatus,
  deleteExam,
  getExams,
  getExamInstructions,
  updateExamInstructions
};
