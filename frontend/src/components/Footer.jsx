// Footer.jsx — Professional multi-column footer
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
  { icon: <FaYoutube />, label: 'YouTube', href: '#' },
  { icon: <FaTelegramPlane />, label: 'Telegram', href: '#' },
  { icon: <FaWhatsapp />, label: 'WhatsApp', href: '#' },
  { icon: <FaInstagram />, label: 'Instagram', href: '#' },
  { icon: <FaLinkedin />, label: 'LinkedIn', href: '#' },
];

const quickLinks = [
  { label: 'Home',            href: '#' },
  { label: 'About Us',        href: '#' },
  { label: 'All Courses',     href: '#' },
  { label: 'Test Series',     href: '#tests' },
  { label: 'Contact Us',      href: '#' },
];

const examLinks = [
  { label: 'OSSSC RI / ARI',      href: '#' },
  { label: 'OPSC OAS',            href: '#' },
  { label: 'Odisha Police SI',     href: '#' },
  { label: 'OSSC CGL',            href: '#' },
  { label: 'Railway NTPC',         href: '#' },
];

const resourceLinks = [
  { label: 'PDF Study Material',  href: '#materials' },
  { label: 'PYQ Papers',          href: '#pyq' },
  { label: 'Live Batches',        href: '#live' },
  { label: 'Video Lectures',      href: '#subjects' },
  { label: 'Admit Card Alerts',   href: '#' },
];

export default function Footer() {
  return (
    <footer className="pro-footer">
      {/* ── Main columns ── */}
      <div className="footer-main">

        {/* Brand column */}
        <div className="footer-brand-col">
          <a href="#" className="footer-logo">
            <span className="f-mark"><img style={{borderRadius:'10px'}} src={Logo} alt="" /></span>
            <span className="f-name">SS Academy</span>
          </a>
          <p className="footer-tagline">
            Odisha's #1 platform for competitive exam preparation. We help
            lakhs of aspirants crack OSSSC, OPSC, SSC, Banking & Railway
            exams with expert-crafted content.
          </p>

          {/* Social icons */}
          <div className="footer-socials">
            {socials.map((s, i) => (
              <a key={i} className="social-btn" href={s.href} title={s.label}>
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
              <li key={i}><a href={l.href}>{l.label}</a></li>
            ))}
          </ul>
        </div>

        {/* Exams */}
        <div className="footer-col">
          <h4>Exams</h4>
          <ul>
            {examLinks.map((l, i) => (
              <li key={i}><a href={l.href}>{l.label}</a></li>
            ))}
          </ul>
        </div>

        {/* Resources */}
        <div className="footer-col">
          <h4>Resources</h4>
          <ul>
            {resourceLinks.map((l, i) => (
              <li key={i}><a href={l.href}>{l.label}</a></li>
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
            <a href="#">
              <span className="fc-icon"><FaMapMarkerAlt /></span>
              Bhubaneswar, Odisha — 751001
            </a><br/>
          </div>
          <div className="newsletter-form">
            <input
              className="newsletter-input"
              type="tel"
              placeholder="Mobile number (optional)"
            />
            <button className="newsletter-btn">
              <FaBell /> Subscribe Now
            </button>
          </div>
        </div>
      </div>

      {/* ── Bottom bar ── */}
      <div className="footer-bottom">
        <div className="footer-bottom-left">
          © 2026 PrepHub. Made with <span className="heart"><FaHeart /></span> for
          Odisha aspirants. All rights reserved.
        </div>
        <div className="footer-bottom-right">
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Use</a>
          <a href="#">Refund Policy</a>
          <a href="#">Disclaimer</a>
          <a href="#">Sitemap</a>
        </div>
      </div>
    </footer>
  );
}
