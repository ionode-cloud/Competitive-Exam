# Walkthrough of Changes

We have fully implemented the ability for the exam administrator to manually customize/override the sections table (section name, number of questions, maximum marks, and duration) directly on the admin instructions page, persist these overrides in the database, and display this custom layout on the student instructions page and timer.

Additionally, we updated the bottom section of the student instructions page to align exactly with the provided layout design requirements.

## 🛠️ Changes Implemented

### 1. Backend MVC Structure Refactoring

We have successfully refactored the entire backend from a single monolithic `server.js` file into a clean, modular MVC (Model-View-Controller) architecture. The structure is organized as follows:

- **Database Connection Config**: Created [db.js](file:///c:/Users/jyoti/Desktop/Currently%20Working/Robo%20Project/Competitive%20Exam/backend/config/db.js) to isolate the database connection logic using Mongoose.
- **Authentication Middleware**: Created [auth.js](file:///c:/Users/jyoti/Desktop/Currently%20Working/Robo%20Project/Competitive%20Exam/backend/middleware/auth.js) for JWT validation and middleware protection of secured routes.
- **Mongoose Models**: Split schemas and models into individual files under `backend/models/`:
  - [Admin.js](file:///c:/Users/jyoti/Desktop/Currently%20Working/Robo%20Project/Competitive%20Exam/backend/models/Admin.js)
  - [Student.js](file:///c:/Users/jyoti/Desktop/Currently%20Working/Robo%20Project/Competitive%20Exam/backend/models/Student.js)
  - [Question.js](file:///c:/Users/jyoti/Desktop/Currently%20Working/Robo%20Project/Competitive%20Exam/backend/models/Question.js)
  - [Exam.js](file:///c:/Users/jyoti/Desktop/Currently%20Working/Robo%20Project/Competitive%20Exam/backend/models/Exam.js)
  - [Result.js](file:///c:/Users/jyoti/Desktop/Currently%20Working/Robo%20Project/Competitive%20Exam/backend/models/Result.js)
  - [Otp.js](file:///c:/Users/jyoti/Desktop/Currently%20Working/Robo%20Project/Competitive%20Exam/backend/models/Otp.js)
- **Domain Controllers**: Grouped request logic and handlers in `backend/controllers/`:
  - [adminController.js](file:///c:/Users/jyoti/Desktop/Currently%20Working/Robo%20Project/Competitive%20Exam/backend/controllers/adminController.js) (Admin login, credentials, and password recovery)
  - [studentController.js](file:///c:/Users/jyoti/Desktop/Currently%20Working/Robo%20Project/Competitive%20Exam/backend/controllers/studentController.js) (Student session creation and data operations)
  - [questionController.js](file:///c:/Users/jyoti/Desktop/Currently%20Working/Robo%20Project/Competitive%20Exam/backend/controllers/questionController.js) (Question database actions)
  - [examController.js](file:///c:/Users/jyoti/Desktop/Currently%20Working/Robo%20Project/Competitive%20Exam/backend/controllers/examController.js) (Exam setups and instruction configurations)
  - [resultController.js](file:///c:/Users/jyoti/Desktop/Currently%20Working/Robo%20Project/Competitive%20Exam/backend/controllers/resultController.js) (Score computation and reporting)
- **Express Routers**: Isolated routing specifications under `backend/routes/`:
  - [adminRoutes.js](file:///c:/Users/jyoti/Desktop/Currently%20Working/Robo%20Project/Competitive%20Exam/backend/routes/adminRoutes.js)
  - [studentRoutes.js](file:///c:/Users/jyoti/Desktop/Currently%20Working/Robo%20Project/Competitive%20Exam/backend/routes/studentRoutes.js)
  - [questionRoutes.js](file:///c:/Users/jyoti/Desktop/Currently%20Working/Robo%20Project/Competitive%20Exam/backend/routes/questionRoutes.js)
  - [examRoutes.js](file:///c:/Users/jyoti/Desktop/Currently%20Working/Robo%20Project/Competitive%20Exam/backend/routes/examRoutes.js)
  - [resultRoutes.js](file:///c:/Users/jyoti/Desktop/Currently%20Working/Robo%20Project/Competitive%20Exam/backend/routes/resultRoutes.js)
- **App Entry Clean-up**: Modified [server.js](file:///c:/Users/jyoti/Desktop/Currently%20Working/Robo%20Project/Competitive%20Exam/backend/server.js) to bootstrap configuration files, mount routers under the `/api` prefix, run admin seeder, and bind the server listener to the appropriate port.

### 2. Manual Custom Sections Table (Previous Update)

We have fully implemented the ability for the exam administrator to manually customize/override the sections table (section name, number of questions, maximum marks, and duration) directly on the admin instructions page, persist these overrides in the database, and display this custom layout on the student instructions page and timer.

Additionally, we updated the bottom section of the student instructions page to align exactly with the provided layout design requirements.

---

### 3. Frontend Updates

#### [MODIFY] [Instructions.jsx](file:///c:/Users/jyoti/Desktop/Currently%20Working/Robo%20Project/Competitive%20Exam/frontend/src/pages/admin/Instructions.jsx)
- Introduced states `hasManualTable`, `isEditingTable`, and `editableSections` to track override status, editing mode, and custom sections respectively.
- Populated the state inside the `useEffect` loading the instructions. If the exam already has `customSections` saved, it automatically activates manual table override mode.
- Inside the "Exam Structure & Section Details" card:
  - Replaced the static table cells with editable `<input>` fields when in editing mode.
  - Added row deletion via the Lucide `Trash2` icon.
  - Calculated table sums and card stats dynamically from custom inputs in real-time.
  - Added controls: "Customize Table", "Edit Table" / "Done Editing", "Add Section", and "Reset to Auto-Calculated".
- Updated `handleSave` to persist `customSections` if customization is active, or clear it if the user reset to calculated values.
- Updated the "Student Preview" side panel to:
  - Use the same overridden sections table and sums.
  - Display the "Choose Your default Language:" selection dropdown (populated with exam languages, syncing the preview language on change).
  - Display the blue italic language note.
  - Include the required declaration checkbox block at the bottom.

#### [MODIFY] [ExamInstructions.jsx](file:///c:/Users/jyoti/Desktop/Currently%20Working/Robo%20Project/Competitive%20Exam/frontend/src/pages/student/ExamInstructions.jsx)
- Checked for `exam.customSections`. If configured, it skips dynamic generation and displays the custom section rows.
- Overrode the `totalQuestions`, `totalMarks`, and `duration` variables with the sum of the respective custom sections so that student headers and badges match the admin's edits.
- **[LAYOUT REVISED]** Replaced the dynamic language-selected note with the required default note: *"Please note all questions will appear in your default language. This language can be changed for a particular question later on."* styled in blue italics below the dropdown.
- **[TEXT UPDATED]** Revised the declaration checkbox description to use the exact required text: *"I have read and understood the instructions. All computer hardware allotted to me are in proper working condition. I declare that I am not in position of / not wearing any / not carrying any prohibited gadget like mobile phone, bluetooth devices, etc/any prohibited material with me into the examination hall, I agree that in case of not adhering to the instructions, I shall be liable to be barred from this test and/or to disciplinary action, which may include banned from the future tests / examinations."*

#### [MODIFY] [ExamContext.jsx](file:///c:/Users/jyoti/Desktop/Currently%20Working/Robo%20Project/Competitive%20Exam/frontend/src/context/ExamContext.jsx)
- Modified the time left countdown timer initialization to use the sum of custom section durations when `customSections` are active.

#### [MODIFY] [ExamInterface.jsx](file:///c:/Users/jyoti/Desktop/Currently%20Working/Robo%20Project/Competitive%20Exam/frontend/src/pages/student/ExamInterface.jsx)
- Corrected the `timeTaken` calculation in the submitted exam payload to subtract the remaining time from the total sum of custom section durations.

---

### 4. Admin Account Credentials Management (Edit & Delete)

We added full capabilities to update passwords/emails and delete administrative accounts from the Admin Logs panel.

#### [MODIFY] [adminController.js](file:///c:/Users/jyoti/Desktop/Currently%20Working/Robo%20Project/Competitive%20Exam/backend/controllers/adminController.js)
- Added `updateAdmin` controller function to securely hash new passwords and update admin details.
- Added `deleteAdmin` controller function with checks to prevent self-deletion and prevent deleting the last admin.

#### [MODIFY] [adminRoutes.js](file:///c:/Users/jyoti/Desktop/Currently%20Working/Robo%20Project/Competitive%20Exam/backend/routes/adminRoutes.js)
- Exposed `PUT /api/admins/:id` and `DELETE /api/admins/:id` routes.

#### [MODIFY] [AdminLogs.jsx](file:///c:/Users/jyoti/Desktop/Currently%20Working/Robo%20Project/Competitive%20Exam/frontend/src/pages/admin/AdminLogs.jsx)
- Integrated inline editing for administrative accounts.
- Added delete button with safety confirmation prompts.
- Styled actions using Lucide icons (`Edit2`, `Trash2`, `Check`, `X`).

---

## 🧪 Verification Plan

### Automated Verification
- Ran the backend server (`node server.js`) and verified it successfully connects to MongoDB (`MongoDB Connected`) and boots up on port 5117.
- Ran `npm run build` inside the `frontend/` folder to ensure compilation succeeds with no syntax or compiler warnings, confirming frontend integration with the refactored endpoints.

### Manual Verification
1. **Database Seeding and Connection**: Confirmed MongoDB connection is established on launch and the default admin user is successfully seeded.
2. **Admin Operations**: Verified admin authentication and CRUD operations, including custom sections configuration and persistence.
3. **Student Operations**: Verified student login, exam instructions view, and submission flows to verify standard routing paths work seamlessly with the new MVC routing layout.

---

### 5. Question Bank Card Delete Button Fix

#### [MODIFY] [questionRoutes.js](file:///c:/Users/jyoti/Desktop/Currently%20Working/Robo%20Project/Competitive%20Exam/backend/routes/questionRoutes.js)
- Moved the `DELETE /questions/bulk/topic` route mapping to be defined **before** the `DELETE /questions/:id` route mapping.
- This ensures Express matches the bulk/topic delete request pattern first instead of incorrectly capturing the literal string `'bulk'` as a question ID parameter.

#### [MODIFY] [questionController.js](file:///c:/Users/jyoti/Desktop/Currently%20Working/Robo%20Project/Competitive%20Exam/backend/controllers/questionController.js)
- Updated `deleteTopicQuestions` to properly scope its queries:
  - When deleting `'General Question Bank'`, it now only deletes questions where `exam` is null AND the `topicName` is blank/null/undefined. This prevents it from wiping out other bank-only questions belonging to custom topics.
  - When deleting a specific topic, it now correctly targets both: (1) questions attached to exams under that topic, AND (2) bank-only questions where `topicName` matches the topic being deleted.

