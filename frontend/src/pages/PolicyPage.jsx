// PolicyPage.jsx — Standard legal, policy, and information pages
import { useParams, Link } from 'react-router-dom';

const POLICY_CONTENT = {
  'privacy-policy': {
    title: 'Privacy Policy',
    updated: 'July 2026',
    content: (
      <>
        <p>Welcome to SS Academy. We value your privacy and are committed to protecting your personal data when you use our website, mobile application, and competitive exam preparation services.</p>
        
        <h3>1. Information We Collect</h3>
        <p>We collect personal information that you provide to us when registering an account, purchasing a subscription or course material, taking mock tests, or contacting support:</p>
        <ul>
          <li><strong>Personal Identifiers:</strong> Full Name, Email Address, Phone Number, and State/City.</li>
          <li><strong>Payment Information:</strong> Processed securely via Razorpay (we do not store raw credit card numbers or UPI PINs).</li>
          <li><strong>Usage &amp; Test Performance Data:</strong> Mock test scores, rank analytics, time spent per question, and study progress.</li>
        </ul>

        <h3>2. How We Use Your Information</h3>
        <ul>
          <li>To provide, manage, and personalize your competitive exam learning experience.</li>
          <li>To process transactions, generate tax invoices, and issue subscription access.</li>
          <li>To calculate All-India Ranks, scoreboards, and performance analytics.</li>
          <li>To communicate updates, new test series announcements, or technical notifications.</li>
        </ul>

        <h3>3. Data Protection &amp; Security</h3>
        <p>We implement industry-standard encryption (SSL/TLS) and secure MongoDB database protocols to safeguard your personal data against unauthorized access, loss, or misuse.</p>

        <h3>4. Contact Us</h3>
        <p>If you have questions regarding this Privacy Policy, please email us at <strong>support@ssacademy.in</strong>.</p>
      </>
    ),
  },

  'terms': {
    title: 'Terms of Use',
    updated: 'July 2026',
    content: (
      <>
        <p>By accessing or using SS Academy's website, mock test portal, or study materials, you agree to be bound by these Terms of Use.</p>

        <h3>1. Account Registration &amp; Security</h3>
        <p>Aspirants are responsible for maintaining the confidentiality of their account credentials. You agree not to share your account login with third parties or attempt to resell proprietary mock tests or PDF study materials.</p>

        <h3>2. Intellectual Property Rights</h3>
        <p>All content, mock questions, solutions, PYQ e-books, video lectures, and study materials provided on SS Academy are copyrighted intellectual property. Content cannot be reproduced, duplicated, or distributed without written permission.</p>

        <h3>3. Fair Use &amp; Exam Rules</h3>
        <p>Using automated scripts, bots, or unauthorized means to tamper with test timers, scoreboards, or rank rankings will result in immediate account suspension.</p>
      </>
    ),
  },

  'refund-policy': {
    title: 'Refund & Cancellation Policy',
    updated: 'July 2026',
    content: (
      <>
        <p>Thank you for choosing SS Academy for your competitive exam preparation.</p>

        <h3>1. Subscription &amp; Test Series Purchases</h3>
        <p>Due to the immediate digital delivery of test series, PYQ e-books, and study materials, all purchases made on SS Academy are generally non-refundable once payment is completed.</p>

        <h3>2. Duplicate Payment Issues</h3>
        <p>In case of duplicate deductions caused by payment gateway timeouts or technical glitches during Razorpay checkout, the extra amount will be refunded automatically to your original payment method within 5–7 business days.</p>

        <h3>3. Support Assistance</h3>
        <p>If you encounter access issues after payment, please contact our support team at <strong>payments@ssacademy.in</strong> with your Payment ID or Order ID.</p>
      </>
    ),
  },

  'disclaimer': {
    title: 'Disclaimer',
    updated: 'July 2026',
    content: (
      <>
        <p>SS Academy is an independent educational technology platform designed to assist candidates in preparing for competitive examinations (OSSSC, OPSC, SSC, Railway, Police, and State Exams).</p>

        <h3>1. Non-Affiliation Notice</h3>
        <p>SS Academy is <strong>NOT</strong> affiliated with, endorsed by, or associated with any government recruitment board, commission, or official government entity. All exam names, official logos, and trademarks belong to their respective official bodies.</p>

        <h3>2. Accuracy of Content</h3>
        <p>While every effort is made to keep mock questions, syllabus patterns, and model answers accurate and up-to-date, candidates are advised to cross-verify official recruitment notifications on government websites.</p>
      </>
    ),
  },

  'about-us': {
    title: 'About SS Academy',
    updated: 'July 2026',
    content: (
      <>
        <p>SS Academy is Odisha's premier online learning platform, empowering lakhs of competitive exam aspirants to crack government job examinations with confidence.</p>

        <h3>Our Mission</h3>
        <p>To deliver affordable, high-quality, exam-oriented study materials, previous year question banks, and realistic mock tests tailored to the exact pattern of OSSSC, OPSC, SSC, Railway, and State Government exams.</p>

        <h3>What We Offer</h3>
        <ul>
          <li><strong>Full-Length &amp; Subject Mock Tests:</strong> Designed according to latest exam syllabus &amp; marking schemes.</li>
          <li><strong>Detailed Solutions &amp; Rank Analytics:</strong> Compare your score with candidate scoreboards across Odisha.</li>
          <li><strong>Curated PYQ E-Books:</strong> Chapterwise previous year questions with step-by-step explanations.</li>
        </ul>
      </>
    ),
  },
};

export default function PolicyPage({ type: propType }) {
  const { type: paramType } = useParams();
  const slug = propType || paramType || 'privacy-policy';
  const page = POLICY_CONTENT[slug] || POLICY_CONTENT['privacy-policy'];

  return (
    <div style={{ minHeight: '75vh', background: 'var(--bg)', padding: '40px 16px 64px' }}>
      <div style={{ maxWidth: 800, margin: '0 auto', background: 'var(--card)', borderRadius: 20, border: '1px solid var(--line)', padding: '36px 32px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
        
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--brand)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
          SS Academy • Legal &amp; Information
        </div>
        <h1 style={{ fontSize: 'clamp(24px, 3vw, 34px)', fontWeight: 900, color: 'var(--disp-color, #0f172a)', margin: '0 0 10px' }}>
          {page.title}
        </h1>
        <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid var(--line)' }}>
          Last Updated: {page.updated}
        </div>

        <div style={{ color: 'var(--text)', fontSize: 14.5, lineHeight: 1.8 }} className="policy-prose">
          {page.content}
        </div>

        <div style={{ marginTop: 40, paddingTop: 20, borderTop: '1px solid var(--line)', display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 13 }}>
          <Link to="/" style={{ color: 'var(--brand)', fontWeight: 700 }}>← Back to Home</Link>
          <span style={{ color: 'var(--muted)' }}>•</span>
          <Link to="/contact" style={{ color: 'var(--brand)', fontWeight: 700 }}>Contact Support</Link>
        </div>
      </div>
    </div>
  );
}
