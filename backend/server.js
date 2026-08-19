require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const cron = require('node-cron');

const connectDB = require('./src/config/db');
const errorHandler = require('./src/middleware/errorHandler');

// Route imports
const authRoutes = require('./src/routes/auth');
const examinationRoutes = require('./src/routes/examinations');
const mockTestRoutes = require('./src/routes/mocktests');
const questionRoutes = require('./src/routes/questions');
const subjectRoutes = require('./src/routes/subjects');
const chapterRoutes = require('./src/routes/chapters');
const subChapterRoutes = require('./src/routes/subchapters');
const ebookRoutes = require('./src/routes/ebooks');
const materialRoutes = require('./src/routes/materials');
const materialCategoryRoutes = require('./src/routes/materialCategories');
const materialsConfigRoutes  = require('./src/routes/materialsConfig');
const ebookConfigRoutes      = require('./src/routes/ebookConfig');
const pyqCategoryRoutes        = require('./src/routes/pyqCategories');
const subscriptionConfigRoutes = require('./src/routes/subscriptionConfig');
const subscriptionRoutes       = require('./src/routes/subscriptions');
const studentRoutes = require('./src/routes/students');
const orderRoutes = require('./src/routes/orders');
const paymentRoutes = require('./src/routes/payments');
const notificationRoutes = require('./src/routes/notifications');
const reportRoutes = require('./src/routes/reports');
const settingRoutes = require('./src/routes/settings');
const dashboardRoutes = require('./src/routes/dashboard');

const seedMockTestsIfEmpty = require('./src/utils/seedMockTests');

// Connect to database
connectDB().then(() => {
  seedMockTestsIfEmpty();
});

const app = express();
app.set('trust proxy', 1);

// Dynamic allowed origins whitelist from environment variables and production/dev defaults
const allowedOrigins = [
  process.env.CLIENT_URL,
  process.env.CLIENT_URL_WWW,
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:5303',
  'http://localhost:3000',
  'https://sunilsiracademy.com',
  'https://www.sunilsiracademy.com',
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests without Origin header (Postman, server-to-server, health checks, cron jobs)
    if (!origin) return callback(null, true);

    const cleanOrigin = origin.replace(/\/$/, '');
    const isAllowed = allowedOrigins.some(item => item && item.replace(/\/$/, '') === cleanOrigin);

    if (isAllowed || process.env.NODE_ENV !== 'production') {
      return callback(null, origin);
    }
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Body parser
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Logger
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Static files (for local uploads)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date(), env: process.env.NODE_ENV });
});

const odishaExamRoutes = require('./src/routes/odishaExams');

const contactRoutes = require('./src/routes/contact');

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/examinations', examinationRoutes);
app.use('/api/exams', examinationRoutes);
app.use('/api/odisha-exams', odishaExamRoutes);
app.use('/api/mocktests', mockTestRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/chapters', chapterRoutes);
app.use('/api/subchapters', subChapterRoutes);
app.use('/api/ebooks', ebookRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/material-categories', materialCategoryRoutes);
app.use('/api/materials-config',    materialsConfigRoutes);
app.use('/api/ebooks-config',        ebookConfigRoutes);
app.use('/api/pyq-ebooks',           pyqCategoryRoutes);
app.use('/api/pyq-categories',       pyqCategoryRoutes);
app.use('/api/subscription-config',  subscriptionConfigRoutes);
app.use('/api/subscriptions',        subscriptionRoutes);
app.use('/api/students',             studentRoutes);
app.use('/api/orders',               orderRoutes);
app.use('/api/payments',             paymentRoutes);
app.use('/api/notifications',        notificationRoutes);
app.use('/api/reports',              reportRoutes);
app.use('/api/settings',             settingRoutes);
const subjectTestRoutes = require('./src/routes/subjectTests');
const instructionRoutes = require('./src/routes/instructions');
const seedSubjectTests  = require('./src/utils/subjectTestSeed');

app.use('/api/subject-tests', subjectTestRoutes);
app.use('/api/instructions', instructionRoutes);

// Trigger initial seed check
seedSubjectTests();

// Cron job: auto-publish scheduled mock tests every minute
cron.schedule('* * * * *', async () => {
  try {
    const MockTest = require('./src/models/MockTest');
    const now = new Date();
    await MockTest.updateMany(
      { status: 'scheduled', publishAt: { $lte: now } },
      { $set: { status: 'published' } }
    );
  } catch (err) {
    console.error('Cron error:', err.message);
  }
});

// Error handler (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔗 API base: http://localhost:${PORT}/api`);
});

const { initSocket } = require('./src/utils/socket');
initSocket(server);

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err.message);
  server.close(() => process.exit(1));
});
