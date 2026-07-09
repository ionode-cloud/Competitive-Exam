const Subject = require('../models/Subject');

// Get all subjects
const getSubjects = async (req, res) => {
  try {
    const subjects = await Subject.find().sort({ name: 1 });
    res.json(subjects);
  } catch (err) {
    console.error('Failed to get subjects:', err);
    res.status(500).json({ message: 'Failed to fetch subjects' });
  }
};

// Create new subject
const createSubject = async (req, res) => {
  try {
    const { name, description, syllabusPoints, preparationStrategy, applicableExams, isActive } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Subject name is required' });
    }

    const existing = await Subject.findOne({ name: name.trim() });
    if (existing) {
      return res.status(400).json({ message: 'Subject name already exists' });
    }

    const subject = new Subject({
      name: name.trim(),
      description: description || '',
      syllabusPoints: Array.isArray(syllabusPoints) ? syllabusPoints : [],
      preparationStrategy: preparationStrategy || '',
      applicableExams: Array.isArray(applicableExams) ? applicableExams : [],
      isActive: isActive !== undefined ? isActive : true
    });
    await subject.save();
    res.status(201).json(subject);
  } catch (err) {
    console.error('Failed to create subject:', err);
    res.status(500).json({ message: 'Failed to create subject' });
  }
};

// Update subject
const updateSubject = async (req, res) => {
  try {
    const { name, description, syllabusPoints, preparationStrategy, applicableExams, isActive } = req.body;
    const subject = await Subject.findById(req.params.id);
    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    // Only check uniqueness if name is changing
    if (name && name.trim() !== subject.name) {
      const existing = await Subject.findOne({ name: name.trim(), _id: { $ne: req.params.id } });
      if (existing) {
        return res.status(400).json({ message: 'Subject name already exists' });
      }
      subject.name = name.trim();
    } else if (name) {
      subject.name = name.trim();
    }

    if (description !== undefined) {
      subject.description = description;
    }

    if (Array.isArray(syllabusPoints)) {
      subject.syllabusPoints = syllabusPoints;
    }

    if (preparationStrategy !== undefined) {
      subject.preparationStrategy = preparationStrategy;
    }

    if (Array.isArray(applicableExams)) {
      subject.applicableExams = applicableExams;
    }

    if (isActive !== undefined) {
      subject.isActive = isActive;
    }

    await subject.save();
    res.json(subject);
  } catch (err) {
    console.error('Failed to update subject:', err);
    res.status(500).json({ message: 'Failed to update subject' });
  }
};

// Delete subject
const deleteSubject = async (req, res) => {
  try {
    const subject = await Subject.findByIdAndDelete(req.params.id);
    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }
    res.json({ message: 'Subject deleted successfully' });
  } catch (err) {
    console.error('Failed to delete subject:', err);
    res.status(500).json({ message: 'Failed to delete subject' });
  }
};

module.exports = {
  getSubjects,
  createSubject,
  updateSubject,
  deleteSubject
};

