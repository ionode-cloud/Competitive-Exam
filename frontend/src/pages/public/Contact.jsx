/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import {
  Mail, Phone, MapPin, Clock, Send, MessageCircle,
  Share2, Globe, ExternalLink, Video, ChevronDown, CheckCircle
} from 'lucide-react';
import PublicLayout from '../../layouts/PublicLayout';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5117';

const defaultFaqs = [
  { q: 'How quickly will I get a response?', a: 'We respond to all emails within 24 hours on weekdays. For urgent issues, use our phone support.' },
  { q: 'Do you offer student discounts?', a: 'Yes! Students with a valid college ID get 20% off premium plans. Contact us with proof.' },
  { q: 'Is there a refund policy?', a: 'We offer full refund within 7 days if you are not satisfied. No questions asked.' },
  { q: 'Can I get a demo of the platform?', a: 'Absolutely! Book a free 30-minute demo with our team to explore all features.' },
];

function FaqItem({ q, a, index }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      className={`contact-faq-item glass ${open ? 'contact-faq-item--open' : ''}`}
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.07 }}
    >
      <button className="contact-faq-item__q" onClick={() => setOpen(p => !p)}>
        <span>{q}</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.3 }}>
          <ChevronDown size={16} />
        </motion.span>
      </button>
      {open && <div className="contact-faq-item__a"><p>{a}</p></div>}
    </motion.div>
  );
}

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Dynamic contact page content
  const [contactContent, setContactContent] = useState({
    heroTitle: "We're Here to Help You",
    heroSubtitle: 'Have questions? Our support team is available Monday to Saturday, 9AM – 6PM IST.',
    supportEmail: 'support@examsphere.in',
    supportPhone: '+91 98765 43210',
    supportAddress: 'Bhubaneswar, Odisha',
    supportHours: '9AM – 6PM IST',
    mapLatitude: '20.296059',
    mapLongitude: '85.824539',
    socials: [
      { label: 'Facebook', handle: '@ExamSphereIN', color: '#3b82f6' },
      { label: 'Instagram', handle: '@ExamSphere', color: '#ec4899' },
      { label: 'Twitter', handle: '@ExamSphere', color: '#0ea5e9' },
    ],
    faqs: defaultFaqs,
  });

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const res = await fetch(`${API}/api/page-content/contact`);
        const data = await res.json();
        if (data) {
          setContactContent(prev => ({
            ...prev,
            ...data,
            socials: data.socials && data.socials.length > 0 ? data.socials : prev.socials,
            faqs: data.faqs && data.faqs.length > 0 ? data.faqs : prev.faqs,
          }));
        }
      } catch (err) {
        console.warn('[Contact] Could not load custom page content:', err);
      }
    };
    fetchContent();
  }, []);

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await axios.post(`${API}/api/contacts`, form);
      setSuccess(true);
      setForm({ name: '', email: '', phone: '', message: '' });
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PublicLayout>
      {/* Hero */}
      <section className="page-hero">
        <div className="orb orb-orange" style={{ width: 400, height: 400, top: -100, right: -50 }} />
        <div className="container">
          <div className="page-hero__grid">
            {/* Left — Motion Text */}
            <motion.div 
              className="page-hero__text-col"
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: { staggerChildren: 0.15 }
                }
              }}
            >
              <motion.div 
                className="section-label page-hero__label"
                variants={{
                  hidden: { opacity: 0, x: -20 },
                  visible: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 100 } }
                }}
              >
                <MessageCircle size={12} /> Get In Touch
              </motion.div>
              
              <motion.h1 
                className="page-hero__title"
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
                }}
              >
                {contactContent.heroTitle}
              </motion.h1>
              
              <motion.p 
                className="page-hero__subtitle"
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
                }}
              >
                {contactContent.heroSubtitle}
              </motion.p>
            </motion.div>

            {/* Right — Centered image with 4-side icons */}
            <motion.div
              className="page-hero__image-col"
              initial={{ opacity: 0, scale: 0.92, x: 30 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              transition={{ duration: 0.9, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="page-hero__image-mixture page-hero__image-mixture--contact">

                {/* Center rounded image */}
                <div className="contact-hero__circle">
                  <div className="contact-hero__ring" />
                  <img
                    src={contactContent.heroImageMain || "/contact_support.png"}
                    alt="Support Team"
                  />
                </div>

                {/* TOP icon — Mail */}
                <div className="page-hero__bubble contact-bubble--top">
                  <Mail size={20} />
                  <span>Email</span>
                </div>

                {/* BOTTOM icon — Phone */}
                <div className="page-hero__bubble contact-bubble--bottom">
                  <Phone size={20} />
                  <span>Call</span>
                </div>

                {/* LEFT icon — Chat */}
                <div className="page-hero__bubble contact-bubble--left">
                  <MessageCircle size={20} />
                  <span>Chat</span>
                </div>

                {/* RIGHT icon — Globe */}
                <div className="page-hero__bubble contact-bubble--right">
                  <Globe size={20} />
                  <span>Social</span>
                </div>

              </div>
            </motion.div>
          </div>
        </div>
      </section>


      {/* Support Cards */}
      <section className="section" style={{ paddingBottom: '2rem' }}>
        <div className="container">
          <div className="support-cards">
            {[
              { icon: Mail,  title: 'Email Us',      value: contactContent.supportEmail,   sub: contactContent.emailSub        || 'Reply within 24 hours',  color: '#3b82f6' },
              { icon: Phone, title: 'Call Us',        value: contactContent.supportPhone,   sub: contactContent.phoneSub        || 'Mon–Sat, 9AM–6PM IST',  color: '#10b981' },
              { icon: MapPin, title: 'Visit Us',      value: contactContent.supportAddress, sub: contactContent.addressSub      || 'STPI Tech Park, Phase 3', color: '#ff6b00' },
              { icon: Clock, title: 'Working Hours',  value: contactContent.supportHours,   sub: contactContent.workingHoursSub || 'Monday to Saturday',    color: '#8b5cf6' },
            ].map((card, i) => (
              <motion.div
                key={card.title}
                className="support-card glass"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -4, borderColor: card.color }}
              >
                <div className="support-card__icon" style={{ background: `${card.color}20`, borderColor: `${card.color}40`, color: card.color }}>
                  <card.icon size={22} />
                </div>
                <div className="support-card__title">{card.title}</div>
                <div className="support-card__value">{card.value}</div>
                <div className="support-card__sub">{card.sub}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Form + Map */}
      <section className="section">
        <div className="container">
          <div className="contact-grid">
            {/* Form */}
            <motion.div
              className="contact-form-card glass"
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <h2 className="contact-form-card__title">Send Us a Message</h2>
              <p className="contact-form-card__sub">Fill in the form and we'll get back to you within 24 hours.</p>

              {success ? (
                <div className="contact-success">
                  <CheckCircle size={48} color="var(--success)" />
                  <h3>Message Sent!</h3>
                  <p>We'll get back to you within 24 hours.</p>
                  <button className="btn btn-primary" onClick={() => setSuccess(false)}>Send Another</button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="contact-form">
                  <div className="contact-form__row">
                    <div className="input-group">
                      <label htmlFor="contact-name">Full Name *</label>
                      <input id="contact-name" name="name" type="text" className="input-field" placeholder="Your name" value={form.name} onChange={handleChange} required />
                    </div>
                    <div className="input-group">
                      <label htmlFor="contact-email">Email *</label>
                      <input id="contact-email" name="email" type="email" className="input-field" placeholder="your@email.com" value={form.email} onChange={handleChange} required />
                    </div>
                  </div>
                  <div className="input-group">
                    <label htmlFor="contact-phone">Phone Number</label>
                    <input id="contact-phone" name="phone" type="tel" className="input-field" placeholder="+91 XXXXX XXXXX" value={form.phone} onChange={handleChange} />
                  </div>
                  <div className="input-group">
                    <label htmlFor="contact-message">Message *</label>
                    <textarea id="contact-message" name="message" className="input-field contact-textarea" placeholder="How can we help you?" rows={5} value={form.message} onChange={handleChange} required />
                  </div>
                  {error && <div className="contact-error">{error}</div>}
                  <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                    {loading ? 'Sending...' : <><Send size={16} /> Send Message</>}
                  </button>
                </form>
              )}
            </motion.div>

            {/* Right: Map + Social */}
            <motion.div
              className="contact-right"
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              {/* Map Placeholder */}
              <div className="map-placeholder glass">
                <div className="map-placeholder__inner">
                  <MapPin size={40} color="var(--primary)" />
                  <p>{contactContent.supportAddress}</p>
                  <a
                    href={`https://maps.google.com/?q=${contactContent.mapLatitude || '20.296059'},${contactContent.mapLongitude || '85.824539'}(${encodeURIComponent(contactContent.supportAddress || 'Bhubaneswar, Odisha')})`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-outline btn-sm"
                  >
                    Open in Google Maps
                  </a>
                </div>
                {/* Embed iframe (google maps embed) */}
                <iframe
                  src={`https://maps.google.com/maps?q=${contactContent.mapLatitude || '20.296059'},${contactContent.mapLongitude || '85.824539'}(${encodeURIComponent(contactContent.supportAddress || 'Bhubaneswar, Odisha')})&z=15&output=embed`}
                  width="100%"
                  height="100%"
                  style={{ border: 0, opacity: 0.7, position: 'absolute', inset: 0, borderRadius: 'var(--radius-lg)' }}
                  loading="lazy"
                  allowFullScreen
                  title="ExamSphere Location"
                />
              </div>

              {/* Social Media */}
              <div className="social-section glass">
                <h3 className="social-section__title">Follow Us</h3>
                <div className="social-links">
                  {(contactContent.socials || []).map((social, idx) => {
                    const icons = [Share2, ExternalLink, Globe, Video];
                    const Icon = icons[idx % icons.length];
                    const href = social.url && social.url.startsWith('http') ? social.url : '#';
                    return (
                      <a key={social.label || idx} href={href} target="_blank" rel="noreferrer" className="social-link glass" style={{ '--sl-color': social.color || '#94a3b8' }}>
                        <Icon size={18} />
                        <div>
                          <div className="social-link__label">{social.label}</div>
                          <div className="social-link__handle">{social.handle || ''}</div>
                        </div>
                      </a>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>


    </PublicLayout>
  );
}
