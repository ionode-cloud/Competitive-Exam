const QuestionBookSubject = require('../models/QuestionBookSubject');

// Get all eBook subjects
exports.getSubjects = async (req, res) => {
  try {
    const subjects = await QuestionBookSubject.find().sort({ name: 1 });
    res.json(subjects);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching subjects', error: error.message });
  }
};

// Create a new eBook subject (Admin only)
exports.createSubject = async (req, res) => {
  const { name, description, showOnHome } = req.body;
  try {
    if (!name) {
      return res.status(400).json({ message: 'Subject name is required' });
    }

    const exists = await QuestionBookSubject.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    if (exists) {
      return res.status(400).json({ message: 'Subject already exists' });
    }

    if (showOnHome === true) {
      const count = await QuestionBookSubject.countDocuments({ showOnHome: true });
      if (count >= 4) {
        return res.status(400).json({ message: 'You can only select up to 4 subjects to show on the Home tab' });
      }
    }

    const newSubject = new QuestionBookSubject({ name, description, showOnHome: showOnHome || false });
    await newSubject.save();
    res.status(201).json(newSubject);
  } catch (error) {
    res.status(500).json({ message: 'Server error creating subject', error: error.message });
  }
};

// Update eBook subject details (Admin only)
exports.updateSubject = async (req, res) => {
  const { name, description, showOnHome } = req.body;
  try {
    const subject = await QuestionBookSubject.findById(req.params.id);
    if (!subject) {
      return res.status(444).json({ message: 'Subject not found' });
    }

    if (name) {
      const exists = await QuestionBookSubject.findOne({ 
        name: { $regex: new RegExp(`^${name}$`, 'i') },
        _id: { $ne: req.params.id }
      });
      if (exists) {
        return res.status(400).json({ message: 'Another subject with this name already exists' });
      }
      subject.name = name;
    }

    if (description !== undefined) {
      subject.description = description;
    }

    if (showOnHome !== undefined) {
      if (showOnHome === true) {
        const count = await QuestionBookSubject.countDocuments({ showOnHome: true, _id: { $ne: req.params.id } });
        if (count >= 4) {
          return res.status(400).json({ message: 'You can only select up to 4 subjects to show on the Home tab' });
        }
      }
      subject.showOnHome = showOnHome;
    }

    await subject.save();
    res.json(subject);
  } catch (error) {
    res.status(500).json({ message: 'Server error updating subject', error: error.message });
  }
};

// Delete eBook subject (Admin only)
exports.deleteSubject = async (req, res) => {
  try {
    const subject = await QuestionBookSubject.findByIdAndDelete(req.params.id);
    if (!subject) {
      return res.status(444).json({ message: 'Subject not found' });
    }
    res.json({ message: 'Subject deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error deleting subject', error: error.message });
  }
};
