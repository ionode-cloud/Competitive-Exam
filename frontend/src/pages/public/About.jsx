import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import {
  Target, Eye, Users, Award, BookOpen, TrendingUp, Heart,
  CheckCircle, Star, Zap, Globe, Shield, User
} from 'lucide-react';
import PublicLayout from '../../layouts/PublicLayout';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5117';

const defaultTeam = [
  { name: 'Arjun Mishra', role: 'Founder & CEO', initials: 'AM', color: '#ff6b00', desc: '10+ years in EdTech. Former SSC & Banking mentor.' },
  { name: 'Priya Rout', role: 'Head of Content', initials: 'PR', color: '#8b5cf6', desc: 'UPSC topper. Expert in content strategy and question design.' },
  { name: 'Rajesh Kumar', role: 'CTO', initials: 'RK', color: '#0ea5e9', desc: 'Full-stack engineer. Built the adaptive learning engine.' },
  { name: 'Sunita Panda', role: 'Lead Educator', initials: 'SP', color: '#10b981', desc: 'Odisha subject expert. 12+ years in competitive exam coaching.' },
];

const defaultValues = [
  { icon: Heart, title: 'Student First', desc: 'Every decision we make is centered around student success and learning outcomes.' },
  { icon: Shield, title: 'Trust & Integrity', desc: 'We deliver what we promise — accurate questions, fair tests, real results.' },
  { icon: TrendingUp, title: 'Continuous Growth', desc: 'Our platform evolves daily — new questions, updated patterns, better analytics.' },
  { icon: Globe, title: 'Accessible to All', desc: 'Quality education should not be a privilege. We keep costs minimal and offer free tiers.' },
];

const team = defaultTeam;
const values = defaultValues;





export default function About() {
  const [content, setContent] = useState({
    heroTitle: "Empowering India's Aspirants to Succeed",
    heroSubtitle: "We're on a mission to make world-class competitive exam preparation accessible to every student in India — from metro cities to the smallest villages.",
    missionTitle: 'Our Mission',
    missionDesc: 'To revolutionize competitive exam preparation in India by providing AI-powered, data-driven, and affordable learning tools that level the playing field for every aspirant — regardless of their background or location.',
    visionTitle: 'Our Vision',
    visionDesc: "A future where every deserving candidate in India gets their dream government job — where preparation quality isn't determined by coaching fees or geographical location, but by dedication and the right platform.",
    values: defaultValues.map(({ icon, ...rest }) => rest),
    team: defaultTeam,
    founderName: 'Arjun Mishra',
    founderTitle: 'Founder & CEO',
    founderMessage: 'We started ExamSphere with a simple belief: that quality guidance and practice are key to clearing any competitive exam, and they should be accessible to all regardless of financial status.',
    founderImage: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&auto=format&fit=crop&q=70',
  });

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const res = await fetch(`${API}/api/page-content/about`);
        const data = await res.json();
        if (data) {
          setContent(prev => ({
            ...prev,
            ...data,
            values: data.values || prev.values,
            team: data.team || prev.team,
          }));
        }
      } catch (err) {
        console.warn('[About] Could not load custom page content:', err);
      }
    };
    fetchContent();
  }, []);

  return (
    <PublicLayout>
      {/* Hero */}
      <section className="page-hero">
        <div className="orb orb-orange" style={{ width: 500, height: 500, top: -100, right: -100 }} />
        <div className="orb orb-blue" style={{ width: 300, height: 300, bottom: 0, left: -50 }} />
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
                <Zap size={12} /> About ExamSphere
              </motion.div>
              
              <motion.h1 
                className="page-hero__title"
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
                }}
              >
                {content.heroTitle}
              </motion.h1>
              
              <motion.p 
                className="page-hero__subtitle"
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
                }}
              >
                {content.heroSubtitle}
              </motion.p>
            </motion.div>

            {/* Right — Mixture of Images */}
            <motion.div 
              className="page-hero__image-col"
              initial={{ opacity: 0, scale: 0.95, x: 30 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className="page-hero__image-single glass">
                <div className="page-hero__img-glow" style={{ backgroundImage: `url(${content.heroImageMain || 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&auto=format&fit=crop&q=60'})` }} />
                <div className="page-hero__img-zoom-wrap">
                  <img src={content.heroImageMain || "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&auto=format&fit=crop&q=60"} alt="About Banner" />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Meet Our Founder */}
      <section className="section" style={{ background: 'linear-gradient(180deg, transparent, rgba(255,107,0,0.02) 50%, transparent)', borderBottom: '1px solid var(--border)' }}>
        <div className="container">
          <div className="founder-section-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: '48px', alignItems: 'center' }}>
            {/* Founder Image block */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, x: -30 }}
              whileInView={{ opacity: 1, scale: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}
            >
              <div className="founder-image-wrapper" style={{ position: 'relative', borderRadius: '24px', overflow: 'hidden', border: '1px solid var(--border)', maxWidth: '340px', width: '100%', aspectRatio: '1/1.1', boxShadow: 'var(--shadow-lg)' }}>
                <img 
                  src={content.founderImage || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&auto=format&fit=crop&q=70'} 
                  alt={content.founderName || 'Founder'} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
                <div style={{ position: 'absolute', bottom: 0, insetInline: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)', padding: '20px', textAlign: 'center' }}>
                  <h4 style={{ color: 'white', margin: 0, fontWeight: 800, fontSize: '1.15rem' }}>{content.founderName || 'Arjun Mishra'}</h4>
                  <p style={{ color: 'var(--primary)', margin: '4px 0 0', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{content.founderTitle || 'Founder & CEO'}</p>
                </div>
              </div>
            </motion.div>

            {/* Founder message block */}
            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.1 }}
              style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
            >
              <div className="section-label" style={{ alignSelf: 'flex-start' }}>
                <User size={12} /> Meet Our Founder
              </div>
              <h2 className="section-title" style={{ margin: 0, fontSize: '2rem' }}>
                A Message From Our <span className="gradient-text">Founder</span>
              </h2>
              <blockquote style={{ borderLeft: '3px solid var(--primary)', paddingLeft: '20px', margin: '10px 0 0', color: 'var(--text-secondary)', fontStyle: 'italic', fontSize: '1.05rem', lineHeight: '1.8' }}>
                "{content.founderMessage || 'We started ExamSphere with a simple belief: that quality guidance and practice are key to clearing any competitive exam, and they should be accessible to all regardless of financial status.'}"
              </blockquote>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="section" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="container">
          <div className="mv-grid">
            <motion.div className="mv-card glass" initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>
              <div className="mv-card__icon"><Target size={28} /></div>
              <h2 className="mv-card__title">{content.missionTitle || 'Our Mission'}</h2>
              <p className="mv-card__text">
                {content.missionDesc}
              </p>
              <ul className="mv-card__list">
                {['Pattern-accurate mock tests', 'Deep performance analytics', 'Daily updated content', 'Personalized study plans'].map(item => (
                  <li key={item}><CheckCircle size={14} /> {item}</li>
                ))}
              </ul>
            </motion.div>
            <motion.div className="mv-card glass mv-card--vision" initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>
              <div className="mv-card__icon mv-card__icon--purple"><Eye size={28} /></div>
              <h2 className="mv-card__title">{content.visionTitle || 'Our Vision'}</h2>
              <p className="mv-card__text">
                {content.visionDesc}
              </p>
              <div className="mv-card__stats">
                <div><div className="mv-stat-val">50K+</div><div className="mv-stat-label">Students</div></div>
                <div><div className="mv-stat-val">95%</div><div className="mv-stat-label">Success Rate</div></div>
                <div><div className="mv-stat-val">500+</div><div className="mv-stat-label">Mock Tests</div></div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="section" style={{ overflow: 'hidden' }}>
        <div className="container">
          <div className="section-header section-header--center">
            <motion.div className="section-label" style={{ margin: '0 auto 1rem' }} whileInView={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 20 }} viewport={{ once: true }}>
              <Users size={12} /> The Team
            </motion.div>
            <motion.h2 className="section-title" whileInView={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 30 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
              Meet the <span className="gradient-text">People</span> Behind ExamSphere
            </motion.h2>
          </div>
        </div>

        <div className="container-fluid" style={{ padding: '0 20px' }}>
          <div className="team-marquee-container">
            <div className="team-marquee-track">
              {[...(content.team || defaultTeam), ...(content.team || defaultTeam)].map((member, i) => (
                <div
                  key={i}
                  className="team-card team-marquee-card glass"
                  style={{ transition: 'all 0.3s' }}
                >
                  {member.image ? (
                    <img 
                      src={member.image} 
                      alt={member.name} 
                      style={{ width: '72px', height: '72px', borderRadius: '50%', objectFit: 'cover', display: 'block', margin: '0 auto 1rem', boxShadow: '0 8px 24px rgba(0,0,0,0.3)', border: '2px solid var(--border)' }} 
                    />
                  ) : (
                    <div className="team-card__avatar" style={{ background: member.color || '#ff6b00' }}>
                      {member.initials || member.name?.split(' ').map(n=>n[0]).join('')}
                    </div>
                  )}
                  <h3 className="team-card__name">{member.name}</h3>
                  <div className="team-card__role">{member.role}</div>
                  <p className="team-card__desc">{member.desc}</p>
                  <div className="team-card__stars">
                    {[...Array(5)].map((_, j) => <Star key={j} size={12} fill="currentColor" color="#f59e0b" />)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="section" style={{ background: 'var(--bg-dark-2)' }}>
        <div className="container">
          <div className="section-header section-header--center">
            <motion.div className="section-label" style={{ margin: '0 auto 1rem' }} whileInView={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 20 }} viewport={{ once: true }}>
              <Heart size={12} /> Our Values
            </motion.div>
            <motion.h2 className="section-title" whileInView={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 30 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
              What We <span className="gradient-text">Stand For</span>
            </motion.h2>
          </div>
          <div className="values-grid">
            {(content.values || defaultValues).map((v, i) => {
              // icon is a React component, re-map from default by matching title
              const matched = defaultValues.find(d => d.title === v.title);
              const IconComp = matched ? matched.icon : Heart;
              return (
              <motion.div
                key={v.title}
                className="value-card glass"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ borderColor: 'var(--border-orange)', y: -4 }}
              >
                <div className="value-card__icon"><IconComp size={24} /></div>
                <h3 className="value-card__title">{v.title}</h3>
                <p className="value-card__desc">{v.desc}</p>
              </motion.div>
              );
            })}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
