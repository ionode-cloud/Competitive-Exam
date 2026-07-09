const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Resend } = require('resend');
const Admin = require('../models/Admin');
const OtpModel = require('../models/Otp');

const resend = new Resend(process.env.RESEND_API_KEY);

// FORGOT PASSWORD - Step 1: Send OTP via Email
const forgotPasswordSendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    // Check if admin exists
    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(404).json({ message: 'No admin account found with this email' });

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Remove any existing OTP for this email
    await OtpModel.deleteMany({ email });

    // Save new OTP
    await OtpModel.create({ email, otp });

    // Send OTP via Resend
    const { error } = await resend.emails.send({
      from: 'Exam Admin <onboarding@resend.dev>',
      to: [email],
      subject: 'Password Reset OTP - Exam Management System',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 32px; background: #0f172a; border-radius: 12px; color: #e2e8f0;">
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="width: 60px; height: 60px; border-radius: 50%; background: #6366f1; display: inline-flex; align-items: center; justify-content: center; font-size: 28px;">🔐</div>
            <h2 style="margin: 16px 0 4px; color: #fff;">Password Reset Request</h2>
            <p style="color: #94a3b8; margin: 0;">Exam Management System - Admin Panel</p>
          </div>
          <div style="background: rgba(99,102,241,0.12); border: 1px solid rgba(99,102,241,0.3); border-radius: 10px; padding: 24px; text-align: center; margin-bottom: 24px;">
            <p style="margin: 0 0 8px; color: #94a3b8; font-size: 14px;">Your One-Time Password (OTP)</p>
            <div style="font-size: 42px; font-weight: 700; letter-spacing: 10px; color: #818cf8;">${otp}</div>
            <p style="margin: 12px 0 0; color: #64748b; font-size: 12px;">⏱ This OTP expires in <strong style="color:#f59e0b;">5 minutes</strong></p>
          </div>
          <p style="color: #94a3b8; font-size: 13px; text-align: center; margin: 0;">If you did not request a password reset, please ignore this email. Your account is safe.</p>
        </div>
      `
    });

    if (error) {
      console.error('Resend error:', error);
      return res.status(500).json({ message: 'Failed to send OTP email. Please try again.' });
    }

    res.json({ message: 'OTP sent successfully to your email', success: true });
  } catch (err) {
    console.error('Send OTP error:', err);
    res.status(500).json({ message: 'Server error while sending OTP' });
  }
};

// FORGOT PASSWORD - Step 2: Verify OTP
const forgotPasswordVerifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ message: 'Email and OTP are required' });

    const record = await OtpModel.findOne({ email });
    if (!record) return res.status(400).json({ message: 'OTP expired or not found. Please request a new one.' });
    if (record.otp !== otp) return res.status(400).json({ message: 'Invalid OTP. Please try again.' });

    // OTP valid - issue a temporary reset token
    const resetToken = jwt.sign({ email, purpose: 'password-reset' }, process.env.JWT_SECRET, { expiresIn: '10m' });

    // Delete used OTP
    await OtpModel.deleteMany({ email });

    res.json({ message: 'OTP verified successfully', resetToken, success: true });
  } catch (err) {
    console.error('Verify OTP error:', err);
    res.status(500).json({ message: 'Server error while verifying OTP' });
  }
};

// FORGOT PASSWORD - Step 3: Reset Password
const forgotPasswordReset = async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;
    if (!resetToken || !newPassword) return res.status(400).json({ message: 'Reset token and new password are required' });
    if (newPassword.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });

    // Verify reset token
    let decoded;
    try {
      decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
    } catch (e) {
      return res.status(400).json({ message: 'Reset session expired. Please start over.' });
    }

    if (decoded.purpose !== 'password-reset') return res.status(400).json({ message: 'Invalid reset token' });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await Admin.findOneAndUpdate(
      { email: decoded.email },
      { password: hashedPassword, plainPassword: newPassword }
    );

    res.json({ message: 'Password reset successfully! You can now login with your new password.', success: true });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ message: 'Server error while resetting password' });
  }
};

// Admin Login
const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await Admin.findOne({ email });
    if (!admin || !await bcrypt.compare(password, admin.password)) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: admin._id, role: admin.role }, process.env.JWT_SECRET);
    res.json({ token, role: admin.role, email: admin.email, id: admin._id });
  } catch (err) {
    console.error('Admin login error:', err);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// Get Admins
const getAdmins = async (req, res) => {
  try {
    const admins = await Admin.find().select('-password');
    res.json(admins);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Create Admin
const createAdmin = async (req, res) => {
  try {
    const { email, password, role } = req.body;
    const existing = await Admin.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Admin already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const admin = new Admin({ email, password: hashedPassword, plainPassword: password, role: role || 'Admin' });
    await admin.save();

    res.status(201).json({ _id: admin._id, email: admin.email, plainPassword: admin.plainPassword, role: admin.role });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Update Admin
const updateAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, password, role } = req.body;

    const adminInstance = await Admin.findById(id);
    if (!adminInstance) return res.status(404).json({ message: 'Admin not found' });

    if (email && email !== adminInstance.email) {
      const existing = await Admin.findOne({ email });
      if (existing) return res.status(400).json({ message: 'Email already in use' });
      adminInstance.email = email;
    }

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      adminInstance.password = hashedPassword;
      adminInstance.plainPassword = password;
    }

    if (role) {
      adminInstance.role = role;
    }

    await adminInstance.save();
    res.json({ _id: adminInstance._id, email: adminInstance.email, plainPassword: adminInstance.plainPassword, role: adminInstance.role });
  } catch (err) {
    console.error('Update admin error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete Admin
const deleteAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Don't delete self
    if (req.admin && req.admin.id === id) {
      return res.status(400).json({ message: 'You cannot delete your own account' });
    }

    // Don't delete the last admin
    const count = await Admin.countDocuments();
    if (count <= 1) {
      return res.status(400).json({ message: 'Cannot delete the only remaining admin' });
    }

    const deleted = await Admin.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: 'Admin not found' });

    res.json({ message: 'Admin deleted successfully' });
  } catch (err) {
    console.error('Delete admin error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  forgotPasswordSendOtp,
  forgotPasswordVerifyOtp,
  forgotPasswordReset,
  adminLogin,
  getAdmins,
  createAdmin,
  updateAdmin,
  deleteAdmin
};

