const SubjectTestSubject = require('../models/SubjectTestSubject');
const SubjectTestTopic = require('../models/SubjectTestTopic');
const SubjectTestQuestion = require('../models/SubjectTestQuestion');
const SubjectTest = require('../models/SubjectTest');
const SubjectTestQuestionMap = require('../models/SubjectTestQuestionMap');
const SubjectTestInstruction = require('../models/SubjectTestInstruction');



async function seedSubjectTests() {
  try {
    // 1. Automatic cleanup: Delete legacy dummy seed questions from database
    const dummyTexts = [
      'We have a very good train service from here to city centre and many people go to _____ work by train.',
      'What is 20% of 150?',
      'Statements: All cats are dogs. All dogs are mammals. Conclusion: All cats are mammals.'
    ];

    const dummyQs = await SubjectTestQuestion.find({ questionText: { $in: dummyTexts } });
    if (dummyQs.length > 0) {
      const dummyIds = dummyQs.map(q => q._id);
      await SubjectTestQuestionMap.deleteMany({ questionId: { $in: dummyIds } });
      await SubjectTestQuestion.deleteMany({ _id: { $in: dummyIds } });
      console.log(`🧹 Cleaned up ${dummyQs.length} legacy dummy seed questions from database.`);
    }

    const existingCount = await SubjectTestSubject.countDocuments();
    if (existingCount > 0) return; // Idempotent check

    console.log('🌱 Seeding default Subject Test subjects, topics & tests...');

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
          totalQuestions: 0,
          totalMarks: 0,
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
          sections: [{ name: subj.name, questions: 0, marks: 0, duration: 15, negativeMarking: 0.25 }],
          instructions: [
            'You have 15 minutes to complete the test.',
            'Negative marking of 0.25 marks applies for incorrect responses.',
            'You can mark questions for review and change answers anytime before submitting.',
            'Timer automatically submits your test when time reaches 00:00.'
          ]
        });
      }
    }

    console.log('✅ Subject Test initial setup completed!');
  } catch (err) {
    console.error('Error in Subject Test setup:', err.message);
  }
}

module.exports = seedSubjectTests;
