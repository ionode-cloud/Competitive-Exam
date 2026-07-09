const PageContent = require('../models/PageContent');

const getPageContent = async (req, res) => {
  try {
    const { page } = req.params;
    const pageData = await PageContent.findOne({ page });
    if (!pageData) {
      return res.json(null);
    }
    res.json(pageData.content);
  } catch (err) {
    console.error('Get page content error:', err);
    res.status(500).json({ message: 'Server error retrieving page content' });
  }
};

const updatePageContent = async (req, res) => {
  try {
    const { page } = req.params;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ message: 'Content is required' });
    }

    const updatedData = await PageContent.findOneAndUpdate(
      { page },
      { content },
      { new: true, upsert: true }
    );

    res.json({ message: 'Page content updated successfully!', data: updatedData.content });
  } catch (err) {
    console.error('Update page content error:', err);
    res.status(500).json({ message: 'Server error updating page content' });
  }
};

module.exports = { getPageContent, updatePageContent };
