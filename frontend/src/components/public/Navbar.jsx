/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Zap, Users, LogIn } from 'lucide-react';
import { useUser } from '../../context/UserContext';

const navLinks = [
  { label: 'Home',    path: '/home' },
  // { label: 'Courses', path: '/courses' },
  { label: 'About',   path: '/about' },
  { label: 'Previous Year Question', path: '/ebook' },
  { label: 'Moke Test', path: '/services' },
  // { label: 'Gallery', path: '/gallery' },
  { label: 'Contact', path: '/contact' },
];

export default function Navbar() {
  const [scrolled, setScrolled]       = useState(false);
  const [mobileOpen, setMobileOpen]   = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { openLogin, user } = useUser();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // close mobile menu on route change
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  return (
    <>
      <motion.nav
        className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="navbar__inner">
          {/* Logo */}
          <Link to="/home" className="navbar__logo">
            <div className="navbar__logo-icon">
              <Zap size={18} strokeWidth={2.5} />
            </div>
            <span className="navbar__logo-text">
              Exam<span className="navbar__logo-accent">Sphere</span>
            </span>
          </Link>

          {/* Desktop Links */}
          <ul className="navbar__links">
            {navLinks.map((link) => (
              <li key={link.path}>
                <Link
                  to={link.path}
                  className={`navbar__link ${location.pathname === link.path ? 'navbar__link--active' : ''}`}
                >
                  {link.label}
                  {location.pathname === link.path && (
                    <motion.span
                      className="navbar__link-dot"
                      layoutId="nav-dot"
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                </Link>
              </li>
            ))}
          </ul>

          {/* Right Actions */}
          <div className="navbar__actions">
            {user ? (
              <Link to="/dashboard" className="btn btn-primary btn-sm hide-mobile" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Users size={14} />
                {user.name || 'Dashboard'}
              </Link>
            ) : (
              <button onClick={openLogin} className="btn btn-primary btn-sm hide-mobile">
                <LogIn size={15} />
                Login
              </button>
            )}

            {/* Mobile Hamburger */}
            <button
              className="navbar__hamburger show-mobile"
              onClick={() => setMobileOpen((p) => !p)}
              aria-label="Toggle menu"
            >
              <AnimatePresence mode="wait">
                {mobileOpen
                  ? <motion.span key="x"    initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}><X size={22} /></motion.span>
                  : <motion.span key="menu" initial={{ rotate: 90, opacity: 0 }}  animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }}><Menu size={22} /></motion.span>
                }
              </AnimatePresence>
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              className="mobile-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              className="mobile-menu"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <div className="mobile-menu__header">
                <Link to="/home" className="navbar__logo">
                  <div className="navbar__logo-icon"><Zap size={18} strokeWidth={2.5} /></div>
                  <span className="navbar__logo-text">Exam<span className="navbar__logo-accent">Sphere</span></span>
                </Link>
              </div>

              <nav className="mobile-menu__nav">
                {navLinks.map((link, i) => (
                  <motion.div
                    key={link.path}
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.07 }}
                  >
                    <Link
                      to={link.path}
                      className={`mobile-menu__link ${location.pathname === link.path ? 'mobile-menu__link--active' : ''}`}
                    >
                      {link.label}
                    </Link>
                  </motion.div>
                ))}
              </nav>

              <div className="mobile-menu__footer">
                {user ? (
                  <Link to="/dashboard" className="btn btn-primary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <Users size={16} />
                    {user.name || 'Dashboard'}
                  </Link>
                ) : (
                  <button onClick={openLogin} className="btn btn-primary" style={{ width: '100%' }}>
                    <LogIn size={16} /> Login
                  </button>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
