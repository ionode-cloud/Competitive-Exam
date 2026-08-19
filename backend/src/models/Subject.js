const mongoose = require('mongoose');

const topicSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  subTopics: [{ type: String, trim: true }]
}, { _id: false });

const subjectSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Subject name is required'], unique: true, trim: true },
  slug: { type: String, unique: true },
  description: { type: String },
  syllabus: { type: String }, // HTML rich text
  icon: { type: String },
  color: { type: String, default: '#6366f1' },
  price: { type: Number, default: 0 },
  isFree: { type: Boolean, default: false },
  status: { type: String, enum: ['active', 'inactive', 'draft'], default: 'active' },
  order: { type: Number, default: 0 },
  showInPyqEbook: { type: Boolean, default: true },
  questionCount: { type: Number, default: 0 },
  chapterCount: { type: Number, default: 0 },
  topics: [{ type: String }],
  topicList: [topicSchema],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

subjectSchema.pre('save', function (next) {
  if (this.isModified('name')) {
    this.slug = this.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
  }
  if (Array.isArray(this.topicList) && this.topicList.length > 0) {
    this.topics = this.topicList.map(t => t.name).filter(Boolean);
  }
  next();
});

module.exports = mongoose.model('Subject', subjectSchema);
