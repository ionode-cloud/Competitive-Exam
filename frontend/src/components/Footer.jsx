// Footer.jsx — Professional multi-column footer with React Router navigation
import { Link } from 'react-router-dom';
import '../footer.css';
import {
  FaYoutube,
  FaTelegramPlane,
  FaWhatsapp,
  FaInstagram,
  FaLinkedin,
  FaPhoneAlt,
  FaEnvelope,
  FaMapMarkerAlt,
  FaBell,
  FaHeart,
} from 'react-icons/fa';
import Logo from '../assets/image.png';

const socials = [
  { icon: <FaYoutube />, label: 'YouTube', href: 'https://youtube.com' },
  { icon: <FaTelegramPlane />, label: 'Telegram', href: 'https://telegram.org' },
  { icon: <FaWhatsapp />, label: 'WhatsApp', href: 'https://whatsapp.com' },
  { icon: <FaInstagram />, label: 'Instagram', href: 'https://instagram.com' },
  { icon: <FaLinkedin />, label: 'LinkedIn', href: 'https://linkedin.com' },
];

const quickLinks = [
  { label: 'Home',            to: '/' },
  { label: 'About Us',        to: '/about-us' },
  { label: 'Mock Tests',      to: '/mock-test' },
  { label: 'Subject Tests',  to: '/subject-test' },
  { label: 'Subscription',   to: '/subscription' },
  { label: 'Contact Us',      to: '/contact' },
];

const examLinks = [
  { label: 'OSSSC RI / ARI',      to: '/mock-test' },
  { label: 'OPSC OAS',            to: '/mock-test' },
  { label: 'Odisha Police SI',     to: '/mock-test' },
  { label: 'OSSC CGL',            to: '/mock-test' },
  { label: 'Railway NTPC',         to: '/mock-test' },
];

const resourceLinks = [
  { label: 'PDF Study Material',  to: '/materials' },
  { label: 'PYQ Papers & E-Books',to: '/pyq-ebook' },
  { label: 'Subject-Wise Practice',to: '/subject-test' },
  { label: 'Full Mock Test Series', to: '/mock-test' },
  { label: 'My Orders & Purchases', to: '/profile' },
];

export default function Footer() {
  return (
    <footer className="pro-footer">
      {/* ── Main columns ── */}
      <div className="footer-main">

        {/* Brand column */}
        <div className="footer-brand-col">
          <Link to="/" className="footer-logo">
            <span className="f-mark"><img style={{borderRadius:'10px'}} src={Logo} alt="SS Academy" /></span>
            <span className="f-name">SS Academy</span>
          </Link>
          <p className="footer-tagline">
            Odisha's #1 platform for competitive exam preparation. We help
            lakhs of aspirants crack OSSSC, OPSC, SSC, Banking & Railway
            exams with expert-crafted content.
          </p>

          {/* Social icons */}
          <div className="footer-socials">
            {socials.map((s, i) => (
              <a key={i} className="social-btn" href={s.href} target="_blank" rel="noreferrer" title={s.label}>
                {s.icon}
              </a>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div className="footer-col">
          <h4>Quick Links</h4>
          <ul>
            {quickLinks.map((l, i) => (
              <li key={i}><Link to={l.to}>{l.label}</Link></li>
            ))}
          </ul>
        </div>

        {/* Exams */}
        <div className="footer-col">
          <h4>Exams</h4>
          <ul>
            {examLinks.map((l, i) => (
              <li key={i}><Link to={l.to}>{l.label}</Link></li>
            ))}
          </ul>
        </div>

        {/* Resources */}
        <div className="footer-col">
          <h4>Resources</h4>
          <ul>
            {resourceLinks.map((l, i) => (
              <li key={i}><Link to={l.to}>{l.label}</Link></li>
            ))}
          </ul>
        </div>

        {/* Newsletter */}
        <div className="footer-newsletter-col">
          <h4>Stay Updated</h4>
          <div className="footer-contact-mini">
            <a href="tel:+919876543210">
              <span className="fc-icon"><FaPhoneAlt /></span>
              +91 98765 43210 
            </a>
            <a href="mailto:info@prephub.in">
              <span className="fc-icon"><FaEnvelope /></span>
              info@prephub.in
            </a>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#94a3b8', fontSize: 13, marginTop: 4 }}>
              <span className="fc-icon"><FaMapMarkerAlt /></span>
              Bhubaneswar, Odisha — 751001
            </span>
          </div>
          <div className="newsletter-form" style={{ marginTop: 12 }}>
            <input
              className="newsletter-input"
              type="tel"
              placeholder="Mobile number (optional)"
            />
            <button className="newsletter-btn">
              <FaBell /> Subscribe
            </button>
          </div>
        </div>
      </div>

      {/* ── Bottom bar ── */}
      <div className="footer-bottom">
        <div className="footer-bottom-left">
          © 2026 SS Academy. Made with <span className="heart"><FaHeart /></span> for
          Odisha aspirants. All rights reserved.
        </div>
        <div className="footer-bottom-right">
          <Link to="/privacy-policy">Privacy Policy</Link>
          <Link to="/terms">Terms of Use</Link>
          <Link to="/refund-policy">Refund Policy</Link>
          <Link to="/disclaimer">Disclaimer</Link>
          <Link to="/about-us">About Us</Link>
        </div>
      </div>
    </footer>
  );
}
