const ContactMessage = require('../models/ContactMessage');
const { paginate, paginateResponse } = require('../utils/pagination');

// Public: Submit a contact message from user panel
exports.createContactMessage = async (req, res, next) => {
  try {
    const { name, email, phone, subject, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ success: false, message: 'Name, email and message are required' });
    }
    const newMessage = await ContactMessage.create({
      name,
      email,
      phone: phone || '',
      subject: subject || 'General Enquiry',
      message,
    });
    res.status(201).json({ success: true, message: 'Message sent successfully!', data: newMessage });
  } catch (err) {
    next(err);
  }
};

// Admin: Get all contact messages with search & status pagination
exports.getContactMessages = async (req, res, next) => {
  try {
    const { search, status, page = 1, limit = 10, sort = '-createdAt' } = req.query;
    const filter = {};
    if (status && status !== 'all') filter.status = status;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
        { message: { $regex: search, $options: 'i' } },
      ];
    }
    const { skip, limit: lim } = paginate(null, page, limit);
    const [data, total, unreadCount, repliedCount] = await Promise.all([
      ContactMessage.find(filter).sort(sort).skip(skip).limit(lim),
      ContactMessage.countDocuments(filter),
      ContactMessage.countDocuments({ status: 'unread' }),
      ContactMessage.countDocuments({ status: 'replied' }),
    ]);
    res.json({
      success: true,
      unreadCount,
      repliedCount,
      ...paginateResponse(data, total, page, lim)
    });
  } catch (err) {
    next(err);
  }
};

// Admin: Update status of a message (unread / read / replied)
exports.updateContactStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const msg = await ContactMessage.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!msg) return res.status(404).json({ success: false, message: 'Message not found' });
    res.json({ success: true, data: msg });
  } catch (err) {
    next(err);
  }
};

// Admin: Delete a contact message
exports.deleteContactMessage = async (req, res, next) => {
  try {
    const msg = await ContactMessage.findById(req.params.id);
    if (!msg) return res.status(404).json({ success: false, message: 'Message not found' });
    await msg.deleteOne();
    res.json({ success: true, message: 'Message deleted successfully' });
  } catch (err) {
    next(err);
  }
};
