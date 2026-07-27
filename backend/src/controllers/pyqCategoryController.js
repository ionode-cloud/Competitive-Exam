const PyqCategory = require('../models/PyqCategory');

const DEFAULT_CATEGORIES = [
  { title: 'Computer PYQs', description: 'Previous computer science papers', icon: 'computer', link: '/pyq-ebook?q=Computer', status: 'active', displayOrder: 1 },
  { title: 'English PYQs',  description: 'Solved English grammar papers',   icon: 'book',     link: '/pyq-ebook?q=English',  status: 'active', displayOrder: 2 },
  { title: 'Odia PYQs',     description: 'Previous Odia grammar sheets',    icon: 'font',     link: '/pyq-ebook?q=Odia',     status: 'active', displayOrder: 3 },
  { title: 'Math PYQs',     description: 'Aptitude tests with solutions',   icon: 'calculator',link:'/pyq-ebook?q=Math',     status: 'active', displayOrder: 4 },
  { title: 'GK PYQs',       description: 'Solved general knowledge capsules',icon: 'globe',    link: '/pyq-ebook?q=GK',       status: 'active', displayOrder: 5 },
];

async function seedIfEmpty() {
  const count = await PyqCategory.countDocuments();
  if (count === 0) {
    await PyqCategory.insertMany(DEFAULT_CATEGORIES);
  }
}

// GET /api/pyq-ebooks
exports.getPyqCategories = async (req, res, next) => {
  try {
    await seedIfEmpty();
    const { publicOnly } = req.query;
    const filter = {};
    if (publicOnly === 'true') filter.status = 'active';

    const categories = await PyqCategory.find(filter).sort('displayOrder createdAt');
    res.json({ success: true, data: categories });
  } catch (err) {
    next(err);
  }
};

// POST /api/pyq-ebooks
exports.createPyqCategory = async (req, res, next) => {
  try {
    const { title, description, icon, link, status, displayOrder } = req.body;
    
    // Calculate display order if not provided
    let order = displayOrder;
    if (order === undefined || order === null) {
      const maxItem = await PyqCategory.findOne().sort('-displayOrder');
      order = maxItem ? (maxItem.displayOrder || 0) + 1 : 1;
    }

    const category = await PyqCategory.create({
      title,
      description: description || '',
      icon: icon || 'book',
      link: link || `/pyq-ebook?q=${encodeURIComponent(title || '')}`,
      status: status || 'active',
      displayOrder: Number(order) || 1,
    });

    res.status(201).json({ success: true, data: category });
  } catch (err) {
    next(err);
  }
};

// PUT /api/pyq-ebooks/reorder
exports.reorderPyqCategories = async (req, res, next) => {
  try {
    const { items } = req.body; // array of { _id, displayOrder }
    if (!Array.isArray(items)) {
      return res.status(400).json({ success: false, message: 'Items array is required' });
    }

    const promises = items.map((item, index) =>
      PyqCategory.findByIdAndUpdate(item._id, { displayOrder: index + 1 }, { new: true })
    );
    await Promise.all(promises);

    const updatedList = await PyqCategory.find().sort('displayOrder createdAt');
    res.json({ success: true, data: updatedList });
  } catch (err) {
    next(err);
  }
};

// PUT /api/pyq-ebooks/:id
exports.updatePyqCategory = async (req, res, next) => {
  try {
    const category = await PyqCategory.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    res.json({ success: true, data: category });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/pyq-ebooks/:id
exports.deletePyqCategory = async (req, res, next) => {
  try {
    const category = await PyqCategory.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    await category.deleteOne();
    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (err) {
    next(err);
  }
};
