const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

dotenv.config();

const connectDB = require('./config/db');
const Admin = require('./models/Admin');

// Existing routes
const adminRoutes       = require('./routes/adminRoutes');
const studentRoutes     = require('./routes/studentRoutes');
const questionRoutes    = require('./routes/questionRoutes');
const examRoutes        = require('./routes/examRoutes');
const subjectRoutes     = require('./routes/subjectRoutes');
const resultRoutes      = require('./routes/resultRoutes');

// ExamSphere existing routes
const userRoutes        = require('./routes/userRoutes');
const paymentRoutes     = require('./routes/paymentRoutes');
const contactRoutes     = require('./routes/contactRoutes');
const pageContentRoutes = require('./routes/pageContentRoutes');

// New platform routes
const courseRoutes       = require('./routes/courseRoutes');
const mockTestRoutes     = require('./routes/mockTestRoutes');
const couponRoutes       = require('./routes/couponRoutes');
const certificateRoutes  = require('./routes/certificateRoutes');
const scheduleRoutes     = require('./routes/scheduleRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const questionBookRoutes = require('./routes/questionBookRoutes');
const questionBookSubjectRoutes = require('./routes/questionBookSubjectRoutes');

const app = express();

// Connect Database
connectDB();

// Middleware
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, Postman) or any localhost port
    if (!origin || /^http:\/\/localhost(:\d+)?$/.test(origin) || /^http:\/\/127\.0\.0\.1(:\d+)?$/.test(origin)) {
      return callback(null, true);
    }
    // Allow deployed frontend domains
    const allowed = [
      'https://examsphere.in',
      'https://www.examsphere.in',
      'https://sunilsiracademy.com',
      'https://www.sunilsiracademy.com',
    ];
    if (allowed.includes(origin)) return callback(null, true);
    console.warn('CORS blocked origin:', origin);
    callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 0, // Disable CORS preflight caching so stale responses don't persist
}));

app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

// Routes
app.get("/", (req, res) => {
  res.send("ExamSphere API Running Successfully");
});

// Existing routes
app.use('/api', adminRoutes);
app.use('/api', studentRoutes);
app.use('/api', questionRoutes);
app.use('/api', examRoutes);
app.use('/api', subjectRoutes);
app.use('/api', resultRoutes);

// ExamSphere existing routes
app.use('/api', userRoutes);
app.use('/api', paymentRoutes);
app.use('/api', contactRoutes);
app.use('/api', pageContentRoutes);

// New platform routes
app.use('/api', courseRoutes);
app.use('/api', mockTestRoutes);
app.use('/api', couponRoutes);
app.use('/api', certificateRoutes);
app.use('/api', scheduleRoutes);
app.use('/api', notificationRoutes);
app.use('/api', questionBookRoutes);
app.use('/api', questionBookSubjectRoutes);

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
