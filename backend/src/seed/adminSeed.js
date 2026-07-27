require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const Setting = require('../models/Setting');

const defaultSettings = [
  { key: 'site_name', value: 'ExamPlatform', group: 'general', label: 'Site Name', type: 'string', isPublic: true },
  { key: 'site_email', value: 'support@examplatform.com', group: 'general', label: 'Support Email', type: 'string', isPublic: true },
  { key: 'currency', value: 'INR', group: 'general', label: 'Currency', type: 'string', isPublic: true },
  { key: 'maintenance_mode', value: false, group: 'general', label: 'Maintenance Mode', type: 'boolean', isPublic: false },
  { key: 'free_trial_days', value: 7, group: 'general', label: 'Free Trial Days', type: 'number', isPublic: true },
];

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Create superadmin
    const existing = await User.findOne({ email: 'admin@examplatform.com' });
    if (!existing) {
      await User.create({
        name: 'Super Admin',
        email: 'admin@examplatform.com',
        password: 'Admin@123',
        role: 'superadmin',
        isActive: true,
        emailVerified: true,
      });
      console.log('✅ Superadmin created: admin@examplatform.com / Admin@123');
    } else {
      console.log('ℹ️  Superadmin already exists');
    }

    // Seed default settings
    for (const setting of defaultSettings) {
      await Setting.findOneAndUpdate({ key: setting.key }, setting, { upsert: true });
    }
    console.log('✅ Default settings seeded');

    console.log('\n🎉 Seed complete!\n');
    console.log('Admin Login:');
    console.log('  Email   : admin@examplatform.com');
    console.log('  Password: Admin@123');
    console.log('  URL     : http://localhost:5173/login\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err);
    process.exit(1);
  }
};

seed();
