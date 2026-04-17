const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

const AdminSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  plainPassword: { type: String }
});

const Admin = mongoose.model('Admin', AdminSchema);

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Connected to DB');
    const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);
    
    // Upsert the admin user
    await Admin.findOneAndUpdate(
      {}, // filter (any admin)
      { 
        email: process.env.ADMIN_EMAIL, 
        password: hashedPassword,
        plainPassword: process.env.ADMIN_PASSWORD
      },
      { upsert: true, new: true }
    );
    console.log(`Admin updated to ${process.env.ADMIN_EMAIL}`);
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
