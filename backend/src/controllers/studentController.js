const User = require('../models/User');
const Purchase = require('../models/Purchase');
const MockTest = require('../models/MockTest');
const XLSX = require('xlsx');
const { paginate, paginateResponse } = require('../utils/pagination');

exports.getStudents = async (req, res, next) => {
  try {
    const { search, status, page = 1, limit = 10, sort = '-createdAt' } = req.query;
    const filter = { role: 'student' };
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }
    if (status === 'active') filter.isActive = true;
    if (status === 'banned') filter.isBanned = true;
    if (status === 'inactive') filter.isActive = false;

    const { skip, limit: lim } = paginate(null, page, limit);
    const [data, total] = await Promise.all([
      User.find(filter).sort(sort).skip(skip).limit(lim).select('-password -refreshToken'),
      User.countDocuments(filter),
    ]);
    res.json({ success: true, ...paginateResponse(data, total, page, lim) });
  } catch (err) { next(err); }
};

exports.getStudent = async (req, res, next) => {
  try {
    const student = await User.findById(req.params.id).select('-password -refreshToken')
      .populate('purchasedCourses', 'name').populate('purchasedMockTests', 'name');
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    const orders = await Purchase.find({ student: student._id }).populate('product', 'name').sort('-createdAt').limit(20);
    res.json({ success: true, data: student, orders });
  } catch (err) { next(err); }
};

exports.banStudent = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const student = await User.findByIdAndUpdate(req.params.id,
      { isBanned: true, banReason: reason || 'Banned by admin' },
      { new: true }
    );
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    res.json({ success: true, data: student, message: 'Student banned' });
  } catch (err) { next(err); }
};

exports.unbanStudent = async (req, res, next) => {
  try {
    const student = await User.findByIdAndUpdate(req.params.id,
      { isBanned: false, banReason: null },
      { new: true }
    );
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    res.json({ success: true, data: student, message: 'Student unbanned' });
  } catch (err) { next(err); }
};

exports.deleteStudent = async (req, res, next) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Student deleted' });
  } catch (err) { next(err); }
};

exports.exportStudents = async (req, res, next) => {
  try {
    const students = await User.find({ role: 'student' }).select('name email phone createdAt isActive isBanned lastLogin').lean();
    const rows = students.map(s => ({
      Name: s.name,
      Email: s.email,
      Phone: s.phone || '',
      Status: s.isBanned ? 'Banned' : s.isActive ? 'Active' : 'Inactive',
      'Registered On': new Date(s.createdAt).toLocaleDateString(),
      'Last Login': s.lastLogin ? new Date(s.lastLogin).toLocaleDateString() : 'Never',
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Students');
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', `attachment; filename=students_${Date.now()}.xlsx`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (err) { next(err); }
};

exports.getAdminUsers = async (req, res, next) => {
  try {
    const { search, role, page = 1, limit = 10, sort = '-createdAt' } = req.query;
    const filter = { role: { $ne: 'student' } };
    if (role) filter.role = role;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const { skip, limit: lim } = paginate(null, page, limit);
    const [data, total] = await Promise.all([
      User.find(filter).sort(sort).skip(skip).limit(lim).select('-password -refreshToken'),
      User.countDocuments(filter),
    ]);
    res.json({ success: true, ...paginateResponse(data, total, page, lim) });
  } catch (err) { next(err); }
};

exports.createAdminUser = async (req, res, next) => {
  try {
    const { name, email, password, phone, role, permissions } = req.body;
    const allowedRoles = ['admin', 'superadmin', 'sub_admin', 'content_manager', 'question_creator', 'support'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role for admin creation' });
    }
    const user = await User.create({ name, email, password, plainPassword: password, phone, role, permissions });
    res.status(201).json({ success: true, data: user, message: 'Admin user created successfully' });
  } catch (err) { next(err); }
};

exports.updateAdminUser = async (req, res, next) => {
  try {
    const { name, email, password, phone, role, permissions, isActive } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'Admin user not found' });

    if (name) user.name = name;
    if (email) user.email = email;
    if (phone !== undefined) user.phone = phone;
    if (role) user.role = role;
    if (permissions) user.permissions = permissions;
    if (isActive !== undefined) user.isActive = isActive;
    if (password) {
      user.password = password;
      user.plainPassword = password;
    }

    await user.save();
    res.json({ success: true, data: user, message: 'Admin user updated successfully' });
  } catch (err) { next(err); }
};

exports.deleteAdminUser = async (req, res, next) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own admin account' });
    }
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'Admin user not found' });
    await user.deleteOne();
    res.json({ success: true, message: 'Admin user deleted successfully' });
  } catch (err) { next(err); }
};
