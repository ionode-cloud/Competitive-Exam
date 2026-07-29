const mongoose = require('mongoose');

const contactConfigSchema = new mongoose.Schema({
  // Contact Cards Info
  phoneValue:    { type: String, default: '+91 98765 43210' },
  phoneSub:      { type: String, default: 'Mon–Sat, 9 AM – 7 PM' },

  emailValue:    { type: String, default: 'info@prephub.in' },
  emailSub:      { type: String, default: 'Reply within 24 hours' },

  whatsappValue: { type: String, default: '+91 98765 43210' },
  whatsappSub:   { type: String, default: 'Chat instantly' },

  addressValue:  { type: String, default: 'PrepHub HQ, Bhubaneswar' },
  addressSub:    { type: String, default: 'Odisha – 751001, India' },

  // Social Handles & Links
  youtubeHandle:  { type: String, default: '@PrepHubOdisha' },
  youtubeLink:    { type: String, default: 'https://youtube.com' },

  telegramHandle: { type: String, default: 't.me/PrepHubOdisha' },
  telegramLink:   { type: String, default: 'https://t.me/PrepHubOdisha' },

  instagramHandle:{ type: String, default: '@prephub.in' },
  instagramLink:  { type: String, default: 'https://instagram.com' },

  facebookHandle: { type: String, default: 'PrepHub Odisha' },
  facebookLink:   { type: String, default: 'https://facebook.com' },

  // Support Hours
  weekdayHours:  { type: String, default: '9:00 AM – 7:00 PM' },
  saturdayHours: { type: String, default: '10:00 AM – 5:00 PM' },
  sundayHours:   { type: String, default: 'Closed' },

  // Hero Banner Settings
  bannerEyebrow:  { type: String, default: 'Contact Us' },
  bannerHeading:  { type: String, default: 'Get In Touch With Us' },
  bannerSubtitle: { type: String, default: "Have questions? We're here to help you on your exam journey — Mon to Sat, 9 AM–7 PM." },
}, { timestamps: true });

module.exports = mongoose.model('ContactConfig', contactConfigSchema);
