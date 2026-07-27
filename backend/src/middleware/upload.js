const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
['images', 'pdfs', 'imports'].forEach(d => {
  const sub = path.join(uploadDir, d);
  if (!fs.existsSync(sub)) fs.mkdirSync(sub, { recursive: true });
});

// Local disk storage
const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const isPdf = file.mimetype === 'application/pdf';
    const isExcel = ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv'].includes(file.mimetype);
    let dest = path.join(uploadDir, 'images');
    if (isPdf) dest = path.join(uploadDir, 'pdfs');
    if (isExcel) dest = path.join(uploadDir, 'imports');
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, unique + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
  ];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} not supported`), false);
  }
};

const upload = multer({
  storage: diskStorage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

exports.uploadImage = upload.single('image');
exports.uploadPdf = upload.single('pdf');
exports.uploadThumbnail = upload.single('thumbnail');
exports.uploadImport = upload.single('file');
exports.uploadMultiple = upload.fields([
  { name: 'pdf', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 },
]);

// Serve uploaded file URL
exports.getFileUrl = (req, filePath) => {
  if (!filePath) return null;
  const relative = filePath.replace(/\\/g, '/').split('uploads/')[1];
  return `${req.protocol}://${req.get('host')}/uploads/${relative}`;
};
