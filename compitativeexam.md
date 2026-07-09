# ExamSphere: Competitive Exam Preparation Platform
## System Architecture, Workflows, & Reference Manual

An end-to-end full-stack web application designed for competitive exam coaching institutions. It integrates structured course delivery, responsive administrative controls, instant mock-test grading systems, and real-time student analytics.

---

## 📐 1. System Architecture & Infographic Diagram

Below is the high-level architecture diagram showing the user journey, panel interaction layers, REST API routing, and external gateway service integrations.

![Architecture & Workflow Overview](architecture_workflow.png)

### 🔍 Explanation of the Platform Workflow & Architecture

The ExamSphere ecosystem is structured into three primary panels: **User Panel**, **Student Panel**, and **Admin Panel**, communicating through a secure REST API backed by a MongoDB database.

#### A. The Visitor & Public Interface (User Panel)
* **Discovery:** A prospective student visits the platform and is welcomed by the **User Panel** (landing, courses catalogue, about history, gallery highlights, and contact support forms).
* **User Actions:** They can check available examinations, browse premium courses, and submit queries through the contact panel.
* **Onboarding:** By signing up or logging in, a visitor transitions into a registered student, initiating a secure session authentication token.

#### B. The Learning & Testing Lifecycle (Student Panel)
* **Test Discovery:** Inside the **Student Panel**, students view registered mock test series, filtered by exam groups (SSC, Railway, Banking, UPSC, State-level).
* **Payment Validation Flow (Razorpay):**
  * Premium mocks or courses show a lock badge. Clicking them triggers a purchase request.
  * The application initializes the **Razorpay Checkout SDK**.
  * Once the transaction is completed, the backend verifies the signature dynamically using HMAC-SHA256, instantly unlocking the course or exam.
* **Examination Engine:**
  * The student starts a mock test in a timed interface.
  * Question statuses are tracked dynamically on the side palette (green for answered, red for skipped, purple for marked reviews, grey for unvisited).
  * Upon submission or countdown timer expiry, the test results are saved.
* **Analytics Engine:** The test is graded instantly. Detailed metrics (accuracy percentage, section scores, answer keys) and leaderboard percentiles are rendered dynamically.

#### C. Administrative Control (Admin Panel)
* **Content Management:** Admins create, edit, or delete exams, questions, subjects, and course lectures.
* **Dynamic Page Styling:** Home photo grids, badges, support variables, FAQs, and links in the public footer are modified inside administrative form editors. These updates write to MongoDB immediately, updating public-facing pages without redeploying code.

---

## 🌐 2. User Panel (Public-facing Website)

The User Panel is designed with custom CSS themes, modern typography, glassmorphic layouts, and micro-interactions.

### 📑 Tab Details & Features
1. **Home Tab (`Home.jsx`):**
   * **Hero Spotlight:** Prominent call-to-actions, badge highlighting (*"India's #1 Exam Prep Platform"*), and a dynamic student search banner.
   * **Prepare for Every Exam:** Grid of interactive category cards (SSC, Banking, Railway, etc.). Clicking any category automatically filters and scrolls the user down to the corresponding free mock test preview deck.
   * **Dynamic Courses Scroller:** An infinite, auto-scrolling horizontal strip that showcase premium educational video lectures curated from the Courses page.
   * **Photo Grid Section:** An 8-slot visual grid showcasing campus life and study centers. Hovering over any image pulls up a blur-glass description overlay.
   * **Floating Back-to-Top:** A contextual, smooth-scroll helper button located at the bottom-right corner that lets users fly back to the top on any public page.
2. **About Us Tab (`About.jsx`):**
   * Displays our platform mission, core values (e.g. *Student First*, *Trust & Integrity*), and team members with visual bio cards.
3. **Courses Tab (`Courses.jsx`):**
   * Hosts available lectures, study materials, and mock test packages. Includes category filters, search input, and course details.
4. **Gallery Tab (`Gallery.jsx`):**
   * A categorized media page hosting highlights of offline workshop seminars and student achievements.
5. **Contact Us Tab (`Contact.jsx`):**
   * Interactive contact form, phone numbers, Google Map embed, and interactive FAQs with smooth accordion toggles.

---

## 👨‍🎓 3. Student Panel (Dashboard & Exam Engine)

Once logged in, students gain access to a personal workspace configured to manage testing schedules, view history, and practice mock exams.

### 📑 Core Modules & Workflow
1. **Dashboard Tab:** Displays enrollment status, ongoing preparation metrics, recent mock test results, and next scheduled events.
2. **My Courses Tab:** Access unlocked video lectures, PDFs, and progress counters.
3. **Mock Tests Tab:** Contains all categories of test series. Filterable by status (Free vs. Premium, Locked vs. Unlocked).
4. **Results Tab:** Detailed list of completed tests, performance breakdowns, incorrect answers log, and solution explanations.
5. **Certificates Tab:** Shows downloadable SVG/PDF certificates unlocked after clearing mock tests with a score >= 50%.
6. **Wrong Questions Tab:** Displays a customized error log listing questions answered incorrectly, acting as a revision workspace.
7. **Leaderboard Tab:** Displays regional and global rankings based on cumulative student points.
8. **Profile Settings:** Customize avatar images, support mobile numbers, update addresses, and alter security passwords.

---

## 🔑 4. Admin Panel (Control Center)

The administrative backend allows administrators to customize platform content, track student registrations, and manage test repositories.

### ⚙️ Tab Configurations
1. **Dashboard Overview:** Displays high-level analytics: total sales revenue, student count, active exams, and overall ratings.
2. **Platform Management:**
   * **Courses Manager:** Upload video links, set pricing, write outlines, and add category tags.
   * **Categories Manager:** Add/edit the exam categories that show up on the homepage cards.
   * **Dynamic Page Editors (Home, About, Contact, Gallery):** Manage text strings, upload grid photos (local files or links), and update maps without writing code.
   * **Footer Editor:** Configure contact links, privacy agreements, copyright descriptions, and the 4 social channels (Facebook, YouTube, Instagram, WhatsApp) with destination link mapping.
3. **Exam Operations:**
   * **Create & Manage Exams:** Configure test title, marks allocation, duration, negative markings, and free/premium lock flags.
   * **Question Bank Manager:** Add questions (Single Choice, Multiple Choice, Numeric) with rich description editors.
   * **Instructions Builder:** Edit student pre-exam instructions sheets dynamically.
4. **Finance & System Logs:**
   * **Payments Tracker:** Displays detailed Razorpay invoice orders, billing timestamps, and status logs.
   * **System Logs:** Displays backend server warnings, admin actions audit logs, and security entries.

---

## 💳 5. Razorpay Payment Gateway Workflow

For locked/premium exams and courses, ExamSphere integrates Razorpay securely via checkout scripts.

```
[Student App]                 [Backend API Server]            [Razorpay Servers]
      |                               |                                |
      |--- 1. Request Order --------->|                                |
      |    (Course/Exam ID)           |--- 2. Create Order ------------>|
      |                               |<-- 3. Return order_id ---------|
      |<-- 4. Send SDK Options -------|                                |
      |    (Key, order_id, amount)    |                                |
      |                               |                                |
      |=== 5. Launch Razorpay UI ======================================|
      |                                                                |
      |--- 6. Complete payment --------------------------------------->|
      |<-- 7. Return payment credentials (signature, payment_id) ------|
      |                               |                                |
      |--- 8. Validate Credentials -->|                                |
      |    (Verification request)     |--- 9. Verify Signature --------|
      |                               |    (crypto HmacSHA256)         |
      |                               |                                |
      |                               |<-- 10. Verification Valid -----|
      |                               |                                |
      |                               |--- 11. Database update --------|
      |                               |    (Unlock resource)           |
      |<-- 12. Transaction Approved --|                                |
```

### Signature Verification Integration Pattern
```javascript
const crypto = require('crypto');

const verifyRazorpaySignature = (orderId, paymentId, razorpaySignature) => {
  const body = orderId + "|" + paymentId;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body.toString())
    .digest('hex');
  
  return expectedSignature === razorpaySignature;
};
```

---

## 📧 6. Gmail OTP Authentication Workflow (Future Expansion)

To enhance verification security for user registration, login, or password resets, an SMTP-based Gmail OTP workflow is planned for upcoming releases.

```
[User Registration Screen]          [Backend Node API Server]          [Google SMTP Server]
            |                                  |                                |
            |-- 1. Submit email -------------->|                                |
            |                                  |-- 2. Generate 6-digit OTP -----|
            |                                  |   (e.g., 508319)               |
            |                                  |                                |
            |                                  |-- 3. Send email request ------>|
            |                                  |   (Nodemailer Transport)       |
            |                                  |                                |
            |                                  |<-- 4. Email Dispatched --------|
            |                                  |                                |
            |<-- 5. Show OTP Input UI ---------|                                |
            |                                  |                                |
            |====== USER CHECKS EMAIL AND COPIES OTP ===========================|
            |                                  |                                |
            |-- 6. Submit OTP ---------------->|                                |
            |   (Verify within 5 minutes)      |-- 7. Confirm match & expiry ---|
            |                                  |   (Clear OTP from cache)       |
            |                                  |-- 8. Create Student profile ---|
            |<-- 9. Registration Success ------|                                |
```

### Planned Nodemailer SMTP Transport Implementation Specs
```javascript
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_APP_PASSWORD, // 16-digit Google App Password
  },
});

const sendVerificationOTP = async (email, otp) => {
  const mailOptions = {
    from: `"ExamSphere Support" <${process.env.SMTP_EMAIL}>`,
    to: email,
    subject: "Secure Verification OTP Code - ExamSphere",
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        <h2 style="color: #ff6b00;">ExamSphere Authentication</h2>
        <p>Use the following secure one-time password to verify your account registration. This code expires in 5 minutes:</p>
        <div style="font-size: 24px; font-weight: bold; color: #333; letter-spacing: 4px; padding: 10px 0;">${otp}</div>
        <p style="font-size: 11px; color: #888;">If you did not request this code, please ignore this email.</p>
      </div>
    `
  };
  return await transporter.sendMail(mailOptions);
};
```
