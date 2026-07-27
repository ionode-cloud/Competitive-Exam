const MaterialCategory = require('../models/MaterialCategory');

const DEFAULT_MATERIAL_CATEGORIES = [
  { title: 'Computer Material', name: 'Computer Material', description: 'Computer notes and study materials', icon: 'computer', link: '/materials?cat=Computer', color: '#1957D6', bg: '#EAF1FD', status: 'active', displayOrder: 1 },
  { title: 'English Material',  name: 'English Material',  description: 'English grammar and language materials', icon: 'book', link: '/materials?cat=English', color: '#0F9D58', bg: '#E8F8EE', status: 'active', displayOrder: 2 },
  { title: 'Odia Material',     name: 'Odia Material',     description: 'Odia grammar and study materials', icon: 'font', link: '/materials?cat=Odia', color: '#7C3AED', bg: '#F3ECFE', status: 'active', displayOrder: 3 },
  { title: 'Math Material',     name: 'Math Material',     description: 'Mathematics notes and practice materials', icon: 'calculator', link: '/materials?cat=Mathematics', color: '#B4232F', bg: '#FCEBEA', status: 'active', displayOrder: 4 },
  { title: 'GK Material',       name: 'GK Material',       description: 'General knowledge study materials', icon: 'globe', link: '/materials?cat=Static GK', color: '#EA7A1E', bg: '#FEF1E4', status: 'active', displayOrder: 5 },
];

async function seedIfEmpty() {
  const count = await MaterialCategory.countDocuments();
  if (count === 0) {
    await MaterialCategory.insertMany(DEFAULT_MATERIAL_CATEGORIES);
  }
}

// ── Public (no auth) ──────────────────────────────────────────────────────────
exports.getPublicCategories = async (req, res, next) => {
  try {
    await seedIfEmpty();
    const cats = await MaterialCategory.find({ status: 'active' }).sort({ displayOrder: 1, createdAt: 1 });
    res.json({ success: true, data: cats });
  } catch (err) { next(err); }
};

// ── Admin CRUD ────────────────────────────────────────────────────────────────
exports.getCategories = async (req, res, next) => {
  try {
    await seedIfEmpty();
    const cats = await MaterialCategory.find().sort({ displayOrder: 1, createdAt: 1 });
    res.json({ success: true, data: cats });
  } catch (err) { next(err); }
};

exports.createCategory = async (req, res, next) => {
  try {
    const { title, name, description, icon, link, color, bg, status, displayOrder } = req.body;
    
    let order = displayOrder;
    if (order === undefined || order === null) {
      const maxItem = await MaterialCategory.findOne().sort('-displayOrder');
      order = maxItem ? (maxItem.displayOrder || 0) + 1 : 1;
    }

    const catName = title || name;
    const cat = await MaterialCategory.create({
      title: catName,
      name: catName,
      description: description || '',
      icon: icon || 'book',
      link: link || `/materials?cat=${encodeURIComponent(catName || '')}`,
      color: color || '#1957D6',
      bg: bg || '#EAF1FD',
      status: status || 'active',
      displayOrder: Number(order) || 1,
    });

    res.status(201).json({ success: true, data: cat });
  } catch (err) {
    next(err);
  }
};

exports.updateCategory = async (req, res, next) => {
  try {
    const updateData = { ...req.body };
    if (updateData.title && !updateData.name) updateData.name = updateData.title;
    if (updateData.name && !updateData.title) updateData.title = updateData.name;

    const cat = await MaterialCategory.findByIdAndUpdate(
      req.params.id, updateData, { new: true, runValidators: true }
    );
    if (!cat) return res.status(404).json({ success: false, message: 'Category not found' });
    res.json({ success: true, data: cat });
  } catch (err) {
    next(err);
  }
};

exports.deleteCategory = async (req, res, next) => {
  try {
    const cat = await MaterialCategory.findById(req.params.id);
    if (!cat) return res.status(404).json({ success: false, message: 'Category not found' });
    await cat.deleteOne();
    res.json({ success: true, message: 'Category deleted' });
  } catch (err) { next(err); }
};

exports.reorderCategories = async (req, res, next) => {
  try {
    const { items } = req.body; // array of { _id, displayOrder }
    if (!Array.isArray(items)) {
      return res.status(400).json({ success: false, message: 'Items array is required' });
    }

    const promises = items.map((item, index) =>
      MaterialCategory.findByIdAndUpdate(item._id, { displayOrder: index + 1 }, { new: true })
    );
    await Promise.all(promises);

    const updatedList = await MaterialCategory.find().sort({ displayOrder: 1, createdAt: 1 });
    res.json({ success: true, data: updatedList });
  } catch (err) {
    next(err);
  }
};
