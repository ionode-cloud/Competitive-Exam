const { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType } = require('docx');
const fs = require('fs');

const doc = new Document({
    sections: [{
        properties: {},
        children: [
            new Paragraph({ text: "Online Examination System: Architecture & Workflow", heading: HeadingLevel.TITLE }),
            new Paragraph({ text: "" }),
            new Paragraph({ text: "1. System Architecture", heading: HeadingLevel.HEADING_1 }),
            new Paragraph({
                children: [
                    new TextRun({ text: "Presentation Layer (Frontend): ", bold: true }),
                    new TextRun("React.js (Vite), Vanilla CSS, Lucide-React, Chart.js.")
                ]
            }),
            new Paragraph({
                children: [
                    new TextRun({ text: "Application Layer (Backend): ", bold: true }),
                    new TextRun("Node.js, Express.js, JWT Authentication.")
                ]
            }),
            new Paragraph({
                children: [
                    new TextRun({ text: "Data Layer (Database): ", bold: true }),
                    new TextRun("MongoDB, Mongoose Schemas (Admin, Student, Question, Exam, Result).")
                ]
            }),
            new Paragraph({ text: "" }),
            new Paragraph({ text: "2. Database Schemas", heading: HeadingLevel.HEADING_1 }),
            new Paragraph({ text: "The system uses the following Mongoose models to manage data:" }),
            new Paragraph({ text: "- Student: Name, Roll Number, Branch, Section", bullet: { level: 0 } }),
            new Paragraph({ text: "- Question: Text, Options, Correct Answer, Section, Marks", bullet: { level: 0 } }),
            new Paragraph({ text: "- Exam: Title, Duration, Questions IDs", bullet: { level: 0 } }),
            new Paragraph({ text: "- Result: Student ID, Exam ID, Score, Time Taken", bullet: { level: 0 } }),
            new Paragraph({ text: "" }),
            new Paragraph({ text: "3. Operational Workflow", heading: HeadingLevel.HEADING_1 }),
            new Paragraph({ text: "A. Admin Workflow:", bold: true }),
            new Paragraph({ text: "1. Login using secure credentials.", bullet: { level: 0 } }),
            new Paragraph({ text: "2. Add questions to the Question Bank.", bullet: { level: 0 } }),
            new Paragraph({ text: "3. Create an Exam by selecting questions and setting duration.", bullet: { level: 0 } }),
            new Paragraph({ text: "4. Monitor performance results and students.", bullet: { level: 0 } }),
            new Paragraph({ text: "" }),
            new Paragraph({ text: "B. Student Workflow:", bold: true }),
            new Paragraph({ text: "1. Enter identification details (Name, Roll, etc.).", bullet: { level: 0 } }),
            new Paragraph({ text: "2. Start exam and navigate through questions.", bullet: { level: 0 } }),
            new Paragraph({ text: "3. Save responses and mark for review.", bullet: { level: 0 } }),
            new Paragraph({ text: "4. Submit exam manually or auto-submit on timer end.", bullet: { level: 0 } }),
            new Paragraph({ text: "5. View detailed result analysis and charts.", bullet: { level: 0 } }),
            new Paragraph({ text: "" }),
            new Paragraph({ text: "4. API Endpoints", heading: HeadingLevel.HEADING_1 }),
            new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: [
                    new TableRow({
                        children: [
                            new TableCell({ children: [new Paragraph({ text: "Method", bold: true })] }),
                            new TableCell({ children: [new Paragraph({ text: "Endpoint", bold: true })] }),
                            new TableCell({ children: [new Paragraph({ text: "Description", bold: true })] }),
                        ],
                    }),
                    new TableRow({
                        children: [
                            new TableCell({ children: [new Paragraph({ text: "POST" })] }),
                            new TableCell({ children: [new Paragraph({ text: "/api/student/login" })] }),
                            new TableCell({ children: [new Paragraph({ text: "Student registration/login" })] }),
                        ],
                    }),
                    new TableRow({
                        children: [
                            new TableCell({ children: [new Paragraph({ text: "GET" })] }),
                            new TableCell({ children: [new Paragraph({ text: "/api/exams" })] }),
                            new TableCell({ children: [new Paragraph({ text: "Fetch available exams" })] }),
                        ],
                    }),
                    new TableRow({
                        children: [
                            new TableCell({ children: [new Paragraph({ text: "POST" })] }),
                            new TableCell({ children: [new Paragraph({ text: "/api/submit" })] }),
                            new TableCell({ children: [new Paragraph({ text: "Submit test results" })] }),
                        ],
                    }),
                ],
            }),
        ],
    }],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("System_Documentation.docx", buffer);
    console.log("Document created successfully at System_Documentation.docx");
});
