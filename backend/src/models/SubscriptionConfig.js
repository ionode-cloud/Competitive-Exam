const mongoose = require('mongoose');

// ── Feature item inside a plan ───────────────────────────────────────────────
const featureSchema = new mongoose.Schema({
  ok:   { type: Boolean, default: true },
  text: { type: String,  default: '' },
}, { _id: false });

// ── Single subscription plan ─────────────────────────────────────────────────
const planSchema = new mongoose.Schema({
  name:      { type: String, default: 'Plan' },
  price:     { type: String, default: '₹999' },
  duration:  { type: String, default: '/month' },
  color:     { type: String, default: '#1957D6' },
  bg:        { type: String, default: '#EAF1FD' },
  highlight: { type: Boolean, default: false },
  badge:     { type: String, default: '' },
  features:  { type: [featureSchema], default: [] },
  order:     { type: Number, default: 0 },
  // UPI/payment details per plan
  upiId:     { type: String, default: '' },
  qrCode:    { type: String, default: '' }, // base64 or URL
}, { _id: true });

// ── Single combo pack item ───────────────────────────────────────────────────
const comboSchema = new mongoose.Schema({
  name:  { type: String, default: 'Bundle' },
  price: { type: String, default: '₹1,999' },
  orig:  { type: String, default: '₹3,999' },
  icon:  { type: String, default: 'file' },
  color: { type: String, default: '#1957D6' },
  bg:    { type: String, default: '#EAF1FD' },
  items: { type: [String], default: [] },
  order: { type: Number, default: 0 },
  upiId: { type: String, default: '' },
  qrCode:{ type: String, default: '' },
}, { _id: true });

// ── Default plan data ────────────────────────────────────────────────────────
const DEFAULT_MONTHLY_PLANS = [
  {
    name: 'Starter', price: '₹499', duration: '/month',
    color: '#1957D6', bg: '#EAF1FD', highlight: false, badge: '',
    features: [
      { ok: true,  text: '5 Full-Length Mock Tests' },
      { ok: true,  text: '10 Subject-Wise Tests' },
      { ok: true,  text: '2 PYQ E-Books (Free Titles)' },
      { ok: true,  text: 'Basic Study Materials' },
      { ok: false, text: 'Live Classes Access' },
      { ok: false, text: 'Video Course Library' },
      { ok: false, text: 'Doubt Clearing Sessions' },
      { ok: false, text: 'All-India Rank & Analytics' },
    ], order: 0,
  },
  {
    name: 'Pro', price: '₹1,499', duration: '/month',
    color: '#7C3AED', bg: '#F3ECFE', highlight: true, badge: 'Most Popular',
    features: [
      { ok: true,  text: '50 Full-Length Mock Tests' },
      { ok: true,  text: 'All Subject-Wise Tests' },
      { ok: true,  text: 'All PYQ E-Books' },
      { ok: true,  text: 'Complete Study Materials' },
      { ok: true,  text: 'Live Classes Access' },
      { ok: true,  text: 'Video Course Library' },
      { ok: false, text: 'Doubt Clearing Sessions' },
      { ok: false, text: 'All-India Rank & Analytics' },
    ], order: 1,
  },
  {
    name: 'Super', price: '₹2,999', duration: '/month',
    color: '#B4232F', bg: '#FCEBEA', highlight: false, badge: 'Best Value',
    features: [
      { ok: true, text: 'Unlimited Mock Tests' },
      { ok: true, text: 'All Subject-Wise Tests' },
      { ok: true, text: 'All PYQ E-Books + New Editions' },
      { ok: true, text: 'Premium Study Materials' },
      { ok: true, text: 'All Live Classes + Recordings' },
      { ok: true, text: 'Full Video Course Library' },
      { ok: true, text: 'Daily Doubt Clearing Sessions' },
      { ok: true, text: 'All-India Rank & Deep Analytics' },
    ], order: 2,
  },
];

const DEFAULT_YEARLY_PLANS = [
  {
    name: 'Starter', price: '₹3,999', duration: '/year',
    color: '#1957D6', bg: '#EAF1FD', highlight: false, badge: 'Save 33%',
    features: [
      { ok: true,  text: '5 Full-Length Mock Tests' },
      { ok: true,  text: '10 Subject-Wise Tests' },
      { ok: true,  text: '2 PYQ E-Books (Free Titles)' },
      { ok: true,  text: 'Basic Study Materials' },
      { ok: false, text: 'Live Classes Access' },
      { ok: false, text: 'Video Course Library' },
      { ok: false, text: 'Doubt Clearing Sessions' },
      { ok: false, text: 'All-India Rank & Analytics' },
    ], order: 0,
  },
  {
    name: 'Pro', price: '₹10,799', duration: '/year',
    color: '#7C3AED', bg: '#F3ECFE', highlight: true, badge: 'Most Popular',
    features: [
      { ok: true,  text: '50 Full-Length Mock Tests' },
      { ok: true,  text: 'All Subject-Wise Tests' },
      { ok: true,  text: 'All PYQ E-Books' },
      { ok: true,  text: 'Complete Study Materials' },
      { ok: true,  text: 'Live Classes Access' },
      { ok: true,  text: 'Video Course Library' },
      { ok: false, text: 'Doubt Clearing Sessions' },
      { ok: false, text: 'All-India Rank & Analytics' },
    ], order: 1,
  },
  {
    name: 'Super', price: '₹21,599', duration: '/year',
    color: '#B4232F', bg: '#FCEBEA', highlight: false, badge: 'Best Value',
    features: [
      { ok: true, text: 'Unlimited Mock Tests' },
      { ok: true, text: 'All Subject-Wise Tests' },
      { ok: true, text: 'All PYQ E-Books + New Editions' },
      { ok: true, text: 'Premium Study Materials' },
      { ok: true, text: 'All Live Classes + Recordings' },
      { ok: true, text: 'Full Video Course Library' },
      { ok: true, text: 'Daily Doubt Clearing Sessions' },
      { ok: true, text: 'All-India Rank & Deep Analytics' },
    ], order: 2,
  },
];

// ── Singleton config schema ──────────────────────────────────────────────────
const subscriptionConfigSchema = new mongoose.Schema({
  /* Hero Banner */
  bannerEyebrow:  { type: String, default: 'Subscription' },
  bannerHeading:  { type: String, default: 'Choose Your Plan' },
  bannerSubtitle: { type: String, default: 'Invest in your preparation — unlock everything you need to crack the exam.' },
  bannerStats: {
    type: [{ n: String, label: String }],
    default: [
      { n: '3',   label: 'Plans' },
      { n: '4',   label: 'Combo Packs' },
      { n: '40%', label: 'Yearly Savings' },
    ],
  },

  /* Global UPI ID (fallback if plan doesn't have one) */
  globalUpiId: { type: String, default: '' },

  /* Monthly Plans */
  monthlyPlans: { type: [planSchema], default: DEFAULT_MONTHLY_PLANS },

  /* Yearly Plans */
  yearlyPlans: { type: [planSchema], default: DEFAULT_YEARLY_PLANS },

  /* Combo packs */
  combos: {
    type: [comboSchema],
    default: [
      { name: 'PDF Course Bundle',      price: '₹3,999', orig: '₹7,999',  icon: 'file',      color: '#1957D6', bg: '#EAF1FD', items: ['All Subject PDFs', 'PYQ E-Books', 'Free Updates 1 Year'], order: 0 },
      { name: 'Test Series Pack',        price: '₹1,299', orig: '₹2,999',  icon: 'clipboard', color: '#0F9D58', bg: '#E8F8EE', items: ['100+ Mock Tests', 'All-India Rank', 'Detailed Analysis'], order: 1 },
      { name: 'Live Batch + Materials',  price: '₹4,999', orig: '₹9,999',  icon: 'video',     color: '#7C3AED', bg: '#F3ECFE', items: ['60 Live Classes', 'Class Recordings', 'Study Notes'],    order: 2 },
      { name: 'All-in-One Super Plan',   price: '₹7,999', orig: '₹19,999', icon: 'trophy',    color: '#B4232F', bg: '#FCEBEA', items: ['Everything in Super', '6 Months Access', 'Priority Support'], order: 3 },
    ],
  },

  /* Combo section heading */
  comboSectionLabel:   { type: String, default: 'COMBO PACKS' },
  comboSectionHeading: { type: String, default: 'One-Time Packs — Pay Once, Save More' },

}, { timestamps: true });

module.exports = mongoose.model('SubscriptionConfig', subscriptionConfigSchema);
