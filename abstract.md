# Abstract

## Online Competitive Examination System

### Project Overview

This project presents the design and development of a full-stack **Online Competitive Examination System** — a web-based platform inspired by industry-standard portals like Adda247. The system is engineered to digitize and automate the entire lifecycle of competitive examinations, spanning question bank management, exam configuration, student registration, real-time test delivery, and automated result analytics.

---

### Problem Statement

Traditional paper-based and rudimentary digital examination systems lack the scalability, real-time feedback, and administrative control required to conduct competitive exams efficiently. There is a growing demand for a robust, self-contained platform that can handle dynamic exam configurations, enforce integrity constraints, and provide instant, meaningful performance insights to students.

---

### Objectives

- To build a secure, role-based examination platform supporting both **Admin** and **Student** workflows.
- To provide a pixel-perfect, distraction-minimized exam environment resembling professional competitive exam portals.
- To implement intelligent features such as **negative marking**, **section-wise scoring**, **auto-submit on timeout**, and **answer persistence** across page refreshes.
- To enable administrators to dynamically configure exams — including custom section structures, durations, and question banks — without code changes.
- To deliver instant, chart-driven **performance analytics** to students upon test submission.

---

### Methodology

The system is built on a modern **three-tier architecture**:

| Layer | Technology |
|---|---|
| **Frontend (Presentation)** | React.js (Vite), Vanilla CSS, Chart.js, Axios |
| **Backend (Application)** | Node.js, Express.js, JWT Authentication |
| **Database (Data)** | MongoDB (NoSQL), Mongoose ODM |

The backend follows a clean **MVC (Model-View-Controller)** pattern with isolated models, controllers, and routers for `Admin`, `Student`, `Question`, `Exam`, and `Result` domains. The frontend manages state through dedicated React Contexts (`AuthContext`, `ExamContext`) for session and exam logic respectively.

---

### Key Features

- **Admin Portal**: Secure JWT-authenticated admin login with full CRUD capabilities over questions, exams, and administrative accounts.
- **Dynamic Question Bank**: Questions categorized by subject/section (English, Reasoning, Quantitative Aptitude) with bulk management support.
- **Custom Exam Builder**: Admins can define exam titles, durations, select questions, and override section tables (name, question count, marks, duration) with live student preview.
- **Exam Environment**: Real-time countdown timer, question palette, Mark for Review, Clear Response, and full answer persistence on page reload.
- **Automated Scoring**: Server-side score computation with configurable negative marking and section-wise breakdown.
- **Student Analytics**: Post-submission performance dashboard with subject-wise charts and detailed result breakdown.
- **OTP-based Recovery**: Admin password recovery via OTP mechanism for enhanced security.

---

### Outcomes

The resulting system delivers a production-ready, scalable online examination platform capable of managing the full examination pipeline — from question authoring to performance reporting — within a secure, responsive, and visually polished web interface. It eliminates manual paper-based processes, reduces administrative overhead, and provides students with an authentic, professional competitive exam experience accessible from any modern web browser.

---

### Keywords

`Online Examination` · `Competitive Exam Portal` · `MERN Stack` · `React.js` · `Node.js` · `MongoDB` · `JWT Authentication` · `MVC Architecture` · `Negative Marking` · `Real-time Analytics`
