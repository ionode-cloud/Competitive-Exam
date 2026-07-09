import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { Zap, Mail, Phone, MapPin, ArrowRight, Send } from 'lucide-react';

// Custom SVG Brand Icons to avoid missing exports in early lucide-react package
const FacebookIcon = (props) => (
  <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const InstagramIcon = (props) => (
  <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

const YoutubeIcon = (props) => (
  <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
    <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
  </svg>
);

const WhatsappIcon = (props) => (
  <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </svg>
);

const DEFAULT_FOOTER = {
  logoText: 'ExamSphere',
  tagline: "India's smartest competitive exam preparation platform. Trusted by 50,000+ students across the nation.",
  email: 'support@examsphere.in',
  phone: '+91 98765 43210',
  address: 'Bhubaneswar, Odisha, India',
  platformLinks: [
    { label: 'Exam Login', path: '/' },
    { label: 'Home', path: '/home' },
    { label: 'About Us', path: '/about' },
    { label: 'Courses', path: '/services' },
    { label: 'Gallery', path: '/gallery' },
    { label: 'Contact', path: '/contact' },
  ],
  examLinks: [
    { label: 'Banking & Finance', path: '/services' },
    { label: 'SSC Exams', path: '/services' },
    { icon: null, label: 'Railway (RRB)', path: '/services' },
    { label: 'UPSC Civil Services', path: '/services' },
    { label: 'Odisha State Exams', path: '/services' },
  ],
  resourceLinks: [
    { label: 'Free Mock Tests', path: '/dashboard' },
    { label: 'Current Affairs', path: '/services' },
    { label: 'Daily Quiz', path: '/dashboard' },
    { label: 'Leaderboard', path: '/dashboard' },
    { label: 'Results & Analysis', path: '/dashboard' },
  ],
  newsletterText: 'Get daily current affairs, exam tips & special offers.',
  newsletterPlaceholder: 'Enter your email',
  copyright: '© 2025 ExamSphere. All rights reserved. Made with ❤️ in India.',
  privacyPolicy: { label: 'Privacy Policy', path: '#' },
  termsOfService: { label: 'Terms of Service', path: '#' },
  refundPolicy: { label: 'Refund Policy', path: '#' },
  facebookUrl: 'https://facebook.com',
  instagramUrl: 'https://instagram.com',
  youtubeUrl: 'https://youtube.com',
  whatsappUrl: 'https://wa.me/919876543210'
};

export default function Footer() {
  const [email, setEmail] = useState('');
  const [content, setContent] = useState(DEFAULT_FOOTER);

  const socialLinks = [
    { icon: FacebookIcon,  href: content.facebookUrl || '#', label: 'Facebook' },
    { icon: InstagramIcon, href: content.instagramUrl || '#', label: 'Instagram' },
    { icon: YoutubeIcon,   href: content.youtubeUrl || '#', label: 'YouTube' },
    { icon: WhatsappIcon,  href: content.whatsappUrl || '#', label: 'WhatsApp' },
  ];

  useEffect(() => {
    const fetchFooter = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5117';
        const res = await axios.get(`${API_URL}/api/page-content/footer`);
        if (res.data) {
          setContent(prev => ({
            ...prev,
            ...res.data
          }));
        }
      } catch (err) {
        console.warn('Failed to load customized Footer content, using defaults.', err);
      }
    };
    fetchFooter();
  }, []);

  const handleNewsletter = (e) => {
    e.preventDefault();
    setEmail('');
    // Placeholder function for newsletter signup
  };

  return (
    <footer className="footer">
      {/* Top gradient line */}
      <div className="footer__topline" />

      <div className="footer__inner">
        {/* Brand Column */}
        <div className="footer__brand">
          <Link to="/home" className="footer__logo">
            <div className="footer__logo-icon"><Zap size={18} strokeWidth={2.5} /></div>
            <span>{content.logoText || 'Exam'}<span className="text-orange">Sphere</span></span>
          </Link>
          <p className="footer__tagline">
            {content.tagline}
          </p>
          <div className="footer__contact-info">
            {content.email && (
              <a href={`mailto:${content.email}`} className="footer__contact-item">
                <Mail size={14} /> {content.email}
              </a>
            )}
            {content.phone && (
              <a href={`tel:${content.phone?.replace(/\s/g, '')}`} className="footer__contact-item">
                <Phone size={14} /> {content.phone}
              </a>
            )}
            {content.address && (
              <span className="footer__contact-item">
                <MapPin size={14} /> {content.address}
              </span>
            )}
          </div>
          <div className="footer__socials">
            {socialLinks.map(({ icon: Icon, href, label }) => (
              <a key={label} href={href} className="footer__social-btn" aria-label={label}>
                <Icon size={16} />
              </a>
            ))}
          </div>
        </div>

        {/* Link Columns */}
        <div className="footer__links-grid">
          {/* Platform Links */}
          <div className="footer__link-col">
            <h4 className="footer__col-title">Platform</h4>
            <ul className="footer__link-list">
              {(content.platformLinks || DEFAULT_FOOTER.platformLinks).map(({ label, path }) => (
                <li key={label}>
                  <Link to={path} className="footer__link">
                    <ArrowRight size={12} />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Exam Links */}
          <div className="footer__link-col">
            <h4 className="footer__col-title">Exam Categories</h4>
            <ul className="footer__link-list">
              {(content.examLinks || DEFAULT_FOOTER.examLinks).map(({ label, path }) => (
                <li key={label}>
                  <Link to={path} className="footer__link">
                    <ArrowRight size={12} />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources Links */}
          <div className="footer__link-col">
            <h4 className="footer__col-title">Resources</h4>
            <ul className="footer__link-list">
              {(content.resourceLinks || DEFAULT_FOOTER.resourceLinks).map(({ label, path }) => (
                <li key={label}>
                  <Link to={path} className="footer__link">
                    <ArrowRight size={12} />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div className="footer__link-col">
            <h4 className="footer__col-title">Newsletter</h4>
            <p className="footer__newsletter-text">
              {content.newsletterText}
            </p>
            <form onSubmit={handleNewsletter} className="footer__newsletter-form">
              <input
                type="email"
                placeholder={content.newsletterPlaceholder || 'Enter your email'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="footer__newsletter-input"
                required
              />
              <button type="submit" className="footer__newsletter-btn">
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="footer__bottom">
        <div className="footer__bottom-inner">
          <p>{content.copyright}</p>
          <div className="footer__bottom-links">
            <Link to={content.privacyPolicy?.path || '#'}>{content.privacyPolicy?.label || 'Privacy Policy'}</Link>
            <Link to={content.termsOfService?.path || '#'}>{content.termsOfService?.label || 'Terms of Service'}</Link>
            <Link to={content.refundPolicy?.path || '#'}>{content.refundPolicy?.label || 'Refund Policy'}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
