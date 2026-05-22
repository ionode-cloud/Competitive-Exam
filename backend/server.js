const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

dotenv.config();

const connectDB = require('./config/db');
const Admin = require('./models/Admin');

const adminRoutes = require('./routes/adminRoutes');
const studentRoutes = require('./routes/studentRoutes');
const questionRoutes = require('./routes/questionRoutes');
const examRoutes = require('./routes/examRoutes');
const resultRoutes = require('./routes/resultRoutes');

const app = express();

// Connect Database
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get("/", (req, res) => {
  res.send("TechFusion API Running Successfully");
});

app.use('/api', adminRoutes);
app.use('/api', studentRoutes);
app.use('/api', questionRoutes);
app.use('/api', examRoutes);
app.use('/api', resultRoutes);

// Initial Admin Creation (Seed)
const seedAdmin = async () => {
  try {
    const count = await Admin.countDocuments();
    if (count === 0) {
      const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);
      await Admin.create({
        email: process.env.ADMIN_EMAIL,
        password: hashedPassword,
        plainPassword: process.env.ADMIN_PASSWORD
      });
      console.log('Seed admin created');
    }
  } catch (err) {
    console.error('Admin seeding failed:', err);
  }
};
seedAdmin();

const PORT = process.env.PORT;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
