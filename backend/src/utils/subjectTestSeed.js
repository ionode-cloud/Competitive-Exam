const SubjectTestSubject = require('../models/SubjectTestSubject');
const SubjectTestTopic   = require('../models/SubjectTestTopic');
const SubjectTestQuestion= require('../models/SubjectTestQuestion');
const SubjectTest        = require('../models/SubjectTest');
const SubjectTestQuestionMap = require('../models/SubjectTestQuestionMap');
const SubjectTestInstruction = require('../models/SubjectTestInstruction');

const seedData = [
  {
    name: 'Mathematics', code: 'MATH', color: '#B4232F', bg: '#FCEBEA', icon: 'calculator',
    desc: 'Arithmetic, Algebra, Geometry & Data Interpretation',
    topics: [
      { name: 'Simplification', code: 'SIMP', desc: 'BODMAS, Fractions, Decimals' },
      { name: 'Percentage', code: 'PERC', desc: 'Basic to Advanced Percentage' },
      { name: 'Data Interpretation', code: 'DI', desc: 'Bar Graph, Pie Chart, Tables' }
    ]
  },
  {
    name: 'Reasoning', code: 'REAS', color: '#7C3AED', bg: '#F3ECFE', icon: 'puzzle',
    desc: 'Verbal, Non-Verbal, Logical & Analytical Reasoning',
    topics: [
      { name: 'Syllogism', code: 'SYLL', desc: 'Venn Diagrams & Statements' },
      { name: 'Coding-Decoding', code: 'CODE', desc: 'Letter & Number Coding' }
    ]
  },
  {
    name: 'English', code: 'ENG', color: '#1957D6', bg: '#EAF1FD', icon: 'book',
    desc: 'Grammar, Comprehension, Vocabulary & Writing',
    topics: [
      { name: 'Spotting Errors', code: 'ERR', desc: 'Grammar Rules & Articles' },
      { name: 'Reading Comprehension', code: 'RC', desc: 'Passages & Inference' }
    ]
  },
  {
    name: 'General Knowledge', code: 'GK', color: '#0F9D58', bg: '#E8F8EE', icon: 'globe',
    desc: 'Odisha GK, India GK, Static & Current Affairs',
    topics: [
      { name: 'Odisha History & Culture', code: 'ODGK', desc: 'Kalinga History, Festivals' },
      { name: 'Current Affairs', code: 'CA', desc: 'National & State Events' }
    ]
  },
  {
    name: 'Computer', code: 'CS', color: '#0891B2', bg: '#E0F7FA', icon: 'laptop',
    desc: 'MS Office, Internet, Hardware, Software & OS',
    topics: [
      { name: 'MS Office', code: 'MSO', desc: 'Word, Excel, PowerPoint' },
      { name: 'Internet & Networking', code: 'NET', desc: 'Protocols & Cybersecurity' }
    ]
  },
  {
    name: 'Odia Language', code: 'ODIA', color: '#EA7A1E', bg: '#FEF1E4', icon: 'font',
    desc: 'Vyakaran, Sahitya, Translation & Idioms',
    topics: [
      { name: 'Odia Vyakaran', code: 'VYAK', desc: 'Sandhi, Samasa, Karaka' },
      { name: 'Idioms & Proverbs', code: 'PROV', desc: 'Rubhi & Lokobani' }
    ]
  }
];

const sampleQuestions = [
  {
    qText: 'We have a very good train service from here to city centre and many people go to _____ work by train.',
    opts: [
      { id: 'A', text: 'A' },
      { id: 'B', text: 'An' },
      { id: 'C', text: 'No article' },
      { id: 'D', text: 'The' }
    ],
    correct: 'C',
    expl: "'Work' when referring to employment/workplace does not take an article in this context.",
    diff: 'Easy'
  },
  {
    qText: 'What is 20% of 150?',
    opts: [
      { id: 'A', text: '20' },
      { id: 'B', text: '25' },
      { id: 'C', text: '30' },
      { id: 'D', text: '35' }
    ],
    correct: 'C',
    expl: '20% of 150 = (20/100) * 150 = 30.',
    diff: 'Easy'
  },
  {
    qText: 'Statements: All cats are dogs. All dogs are mammals. Conclusion: All cats are mammals.',
    opts: [
      { id: 'A', text: 'Follows' },
      { id: 'B', text: 'Does not follow' },
      { id: 'C', text: 'Either I or II' },
      { id: 'D', text: 'Neither follows' }
    ],
    correct: 'A',
    expl: 'Since all cats are dogs and all dogs are mammals, by transitive property all cats are mammals.',
    diff: 'Easy'
  }
];

async function seedSubjectTests() {
  try {
    const existingCount = await SubjectTestSubject.countDocuments();
    if (existingCount > 0) return; // Idempotent check

    console.log('🌱 Seeding default Subject Test subjects, topics, tests & question bank...');

    for (let i = 0; i < seedData.length; i++) {
      const sItem = seedData[i];
      const subj = await SubjectTestSubject.create({
        name: sItem.name, code: sItem.code, color: sItem.color, bg: sItem.bg, icon: sItem.icon,
        description: sItem.desc, displayOrder: i + 1, isActive: true
      });

      for (let j = 0; j < sItem.topics.length; j++) {
        const tItem = sItem.topics[j];
        const topic = await SubjectTestTopic.create({
          subjectId: subj._id, name: tItem.name, code: tItem.code, description: tItem.desc,
          displayOrder: j + 1, isActive: true
        });

        // Seed 1 practice test per topic
        const test = await SubjectTest.create({
          subjectId: subj._id,
          topicId: topic._id,
          title: `${tItem.name} Practice Set 01`,
          code: `${tItem.code}-01`,
          description: `Focused practice test for ${tItem.name}`,
          testType: 'practice',
          difficulty: 'Easy',
          accessType: j === 0 ? 'Free' : 'Premium',
          totalQuestions: 3,
          totalMarks: 3,
          duration: 15,
          positiveMarks: 1,
          negativeMarks: 0.25,
          status: 'published'
        });

        // Seed instructions
        await SubjectTestInstruction.create({
          testId: test._id,
          title: test.title,
          summary: `Practice Test - ${tItem.name}`,
          sections: [{ name: subj.name, questions: 3, marks: 3, duration: 15, negativeMarking: 0.25 }],
          instructions: [
            'You have 15 minutes to complete the test.',
            'The test contains 3 questions worth 1 mark each.',
            'Negative marking of 0.25 marks applies for incorrect responses.',
            'You can mark questions for review and change answers anytime before submitting.',
            'Timer automatically submits your test when time reaches 00:00.'
          ]
        });

        // Create sample questions in Question Bank for this topic
        for (let q = 0; q < sampleQuestions.length; q++) {
          const sq = sampleQuestions[q];
          const question = await SubjectTestQuestion.create({
            subjectId: subj._id,
            topicId: topic._id,
            questionType: 'single_correct',
            questionText: sq.qText,
            options: sq.opts,
            correctAnswer: sq.correct,
            explanation: sq.expl,
            difficulty: sq.diff,
            defaultMarks: 1,
            defaultNegativeMarks: 0.25,
            status: 'active'
          });

          // Map question to test
          await SubjectTestQuestionMap.create({
            testId: test._id,
            questionId: question._id,
            order: q + 1
          });
        }
      }
    }

    console.log('✅ Subject Test initial seed completed!');
  } catch (err) {
    console.error('Error seeding Subject Tests:', err.message);
  }
}

module.exports = seedSubjectTests;
