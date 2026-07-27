const Examination = require('../models/Examination');
const MockTest = require('../models/MockTest');

const defaultCategories = [
  {
    name: 'State PSC / SSSC (Odisha)',
    description: 'Comprehensive practice series for OPSC, OSSSC, OSSC, and Odisha state level exams',
    icon: 'landmark',
    color: '#7C3AED',
    bg: '#F3ECFE',
    status: 'active',
    topics: ['OPSC OAS', 'OSSSC RI', 'OSSC CGL', 'OSSSC ARI & Amin', 'OSSSC JE', 'OPSC ASO'],
    mockTests: [
      {
        name: 'OPSC OAS Prelims Paper-I (GS)',
        topicName: 'OPSC OAS',
        testType: 'full_length',
        totalMarks: 100,
        totalQuestions: 100,
        duration: 120,
        difficulty: 'Medium',
        pricingType: 'free',
        accessType: 'Free',
        price: 0,
        status: 'published'
      },
      {
        name: 'OSSSC RI Full Length Mock Test 1',
        topicName: 'OSSSC RI',
        testType: 'full_length',
        totalMarks: 100,
        totalQuestions: 100,
        duration: 120,
        difficulty: 'Medium',
        pricingType: 'free',
        accessType: 'Free',
        price: 0,
        status: 'published'
      },
      {
        name: 'OSSSC RI Mathematics Sectional Test',
        topicName: 'OSSSC RI',
        testType: 'sectional',
        totalMarks: 50,
        totalQuestions: 50,
        duration: 45,
        difficulty: 'Medium',
        pricingType: 'free',
        accessType: 'Free',
        price: 0,
        status: 'published'
      },
      {
        name: 'OSSC CGL Prelims Full Test 1',
        topicName: 'OSSC CGL',
        testType: 'full_length',
        totalMarks: 100,
        totalQuestions: 100,
        duration: 120,
        difficulty: 'Medium',
        pricingType: 'free',
        accessType: 'Free',
        price: 0,
        status: 'published'
      }
    ]
  },
  {
    name: 'SSC & Railway',
    description: 'Mock tests for SSC CGL, CHSL, MTS, GD Constable and RRB NTPC, Group D exams',
    icon: 'train',
    color: '#0F9D58',
    bg: '#E8F8EE',
    status: 'active',
    topics: ['SSC CGL', 'SSC CHSL', 'RRB NTPC', 'SSC MTS', 'SSC GD Constable', 'RRB Group D'],
    mockTests: [
      {
        name: 'SSC CGL Tier-1 Complete Mock Test',
        topicName: 'SSC CGL',
        testType: 'full_length',
        totalMarks: 100,
        totalQuestions: 100,
        duration: 60,
        difficulty: 'Medium',
        pricingType: 'free',
        accessType: 'Free',
        price: 0,
        status: 'published'
      },
      {
        name: 'RRB NTPC CBT-1 Full Paper',
        topicName: 'RRB NTPC',
        testType: 'full_length',
        totalMarks: 100,
        totalQuestions: 100,
        duration: 90,
        difficulty: 'Medium',
        pricingType: 'free',
        accessType: 'Free',
        price: 0,
        status: 'published'
      }
    ]
  },
  {
    name: 'Bank & Insurance',
    description: 'Mock papers for IBPS PO/Clerk, SBI PO/Clerk, RBI Grade B, and LIC AAO exams',
    icon: 'university',
    color: '#1957D6',
    bg: '#EAF1FD',
    status: 'active',
    topics: ['IBPS PO', 'SBI Clerk', 'RBI Grade B', 'LIC AAO', 'IBPS Clerk', 'SBI PO'],
    mockTests: [
      {
        name: 'IBPS PO Prelims Complete Mock',
        topicName: 'IBPS PO',
        testType: 'full_length',
        totalMarks: 100,
        totalQuestions: 100,
        duration: 60,
        difficulty: 'Hard',
        pricingType: 'free',
        accessType: 'Free',
        price: 0,
        status: 'published'
      },
      {
        name: 'LIC AAO Generalist Full Mock Test',
        topicName: 'LIC AAO',
        testType: 'full_length',
        totalMarks: 100,
        totalQuestions: 100,
        duration: 60,
        difficulty: 'Medium',
        pricingType: 'free',
        accessType: 'Free',
        price: 0,
        status: 'published'
      }
    ]
  },
  {
    name: 'Police & Defence',
    description: 'Practice series for Odisha Police SI/Constable, NDA, CDS, and CAPF exams',
    icon: 'shield',
    color: '#B4232F',
    bg: '#FCEBEA',
    status: 'active',
    topics: ['Odisha Police SI', 'Odisha Police Constable', 'NDA', 'CDS', 'CAPF'],
    mockTests: [
      {
        name: 'Odisha Police SI GS + Language Full Paper',
        topicName: 'Odisha Police SI',
        testType: 'full_length',
        totalMarks: 100,
        totalQuestions: 100,
        duration: 120,
        difficulty: 'Medium',
        pricingType: 'free',
        accessType: 'Free',
        price: 0,
        status: 'published'
      },
      {
        name: 'CDS GK & English Full Mock',
        topicName: 'CDS',
        testType: 'full_length',
        totalMarks: 100,
        totalQuestions: 100,
        duration: 120,
        difficulty: 'Medium',
        pricingType: 'free',
        accessType: 'Free',
        price: 0,
        status: 'published'
      }
    ]
  }
];

async function seedMockTestsIfEmpty() {
  try {
    const examCount = await Examination.countDocuments();
    if (examCount === 0) {
      console.log('[Seed] Seeding initial Exam categories and Mock Tests into MongoDB...');
      for (const cat of defaultCategories) {
        const examDoc = await Examination.create({
          name: cat.name,
          description: cat.description,
          icon: cat.icon,
          color: cat.color,
          bg: cat.bg,
          status: cat.status,
          topics: cat.topics
        });

        for (const mt of cat.mockTests) {
          await MockTest.create({
            ...mt,
            examination: examDoc._id
          });
        }
      }
      console.log('[Seed] Mock Tests successfully seeded!');
    } else {
      // Update existing exams with topics if missing
      for (const cat of defaultCategories) {
        await Examination.updateOne(
          { name: cat.name, $or: [{ topics: { $exists: false } }, { topics: { $size: 0 } }] },
          { $set: { topics: cat.topics } }
        );
      }
    }
  } catch (err) {
    console.error('[Seed Error] Failed to seed mock tests:', err.message);
  }
}

module.exports = seedMockTestsIfEmpty;
