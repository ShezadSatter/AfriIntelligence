// scripts/seed.js - Database seeding script for development and testing
import dotenv from 'dotenv';
import { initDB, models, services } from '../db.js';

dotenv.config();

async function seedUsers() {
  console.log('👥 Seeding users...');
  
  const users = [
    {
      userId: 'a001',
      role: 'admin',
      name: 'Admin User',
      email: 'admin@afriintelligence.com'
    },
    {
      userId: 't001',
      role: 'teacher',
      name: 'Mathematics Teacher',
      email: 'math.teacher@school.edu',
      subjects: [] // Will be populated after subjects are created
    },
    {
      userId: 't002',
      role: 'teacher',
      name: 'Science Teacher',
      email: 'science.teacher@school.edu',
      subjects: []
    },
    {
      userId: 'st001',
      role: 'student',
      name: 'Student One',
      email: 'student1@school.edu',
      grade: null // Will be populated after grades are created
    },
    {
      userId: 'st002',
      role: 'student',
      name: 'Student Two',
      email: 'student2@school.edu',
      grade: null
    }
  ];
  
  let created = 0;
  
  for (const userData of users) {
    try {
      const existing = await models.User.findOne({ userId: userData.userId });
      if (!existing) {
        // Get subject and grade references
        if (userData.role === 'teacher' && userData.name.includes('Mathematics')) {
          const mathSubject = await models.Subject.findOne({ name: 'Mathematics' });
          if (mathSubject) userData.subjects = [mathSubject._id];
        } else if (userData.role === 'teacher' && userData.name.includes('Science')) {
          const lifeScience = await models.Subject.findOne({ name: 'Life Sciences' });
          if (lifeScience) userData.subjects = [lifeScience._id];
        } else if (userData.role === 'student') {
          const grade10 = await models.Grade.findOne({ level: 10 });
          if (grade10) userData.grade = grade10._id;
        }
        
        await models.User.create(userData);
        created++;
      }
    } catch (error) {
      console.error(`Error creating user ${userData.userId}:`, error.message);
    }
  }
  
  console.log(`✅ Users seeded: ${created} created`);
}

async function seedSampleContent() {
  console.log('📚 Seeding sample content...');
  
  const mathSubject = await models.Subject.findOne({ name: 'Mathematics' });
  const economicsSubject = await models.Subject.findOne({ name: 'Economics' });
  const lifeScienceSubject = await models.Subject.findOne({ name: 'Life Sciences' });
  const grade10 = await models.Grade.findOne({ level: 10 });
  const grade11 = await models.Grade.findOne({ level: 11 });
  const grade12 = await models.Grade.findOne({ level: 12 });
  
  const sampleContent = [
    // Mathematics content
    {
      subjectId: mathSubject?._id,
      gradeId: grade10?._id,
      term: 'Quadratic Equation',
      definition: 'An equation of the form ax² + bx + c = 0, where a, b, and c are constants and a ≠ 0.',
      example: 'x² - 5x + 6 = 0',
      context: 'Used to solve problems involving parabolic motion, optimization, and area calculations.',
      category: 'algebra'
    },
    {
      subjectId: mathSubject?._id,
      gradeId: grade10?._id,
      term: 'Pythagorean Theorem',
      definition: 'In a right triangle, the square of the hypotenuse equals the sum of squares of the other two sides: a² + b² = c².',
      example: 'In a triangle with sides 3, 4, and 5: 3² + 4² = 5² → 9 + 16 = 25',
      context: 'Essential for calculating distances and solving geometric problems.',
      category: 'geometry'
    },
    
    // Economics content
    {
      subjectId: economicsSubject?._id,
      gradeId: grade11?._id,
      term: 'Supply and Demand',
      definition: 'The relationship between the quantity of a good that producers wish to sell at various prices and the quantity that consumers wish to buy.',
      example: 'When demand for smartphones increases but supply remains constant, prices tend to rise.',
      context: 'Fundamental principle that determines market prices in a free economy.',
      category: 'market-economics'
    },
    {
      subjectId: economicsSubject?._id,
      gradeId: grade11?._id,
      term: 'GDP',
      definition: 'Gross Domestic Product - the total monetary value of all finished goods and services produced within a country during a specific time period.',
      example: 'South Africa\'s GDP in 2023 was approximately $419 billion.',
      context: 'Key indicator of a country\'s economic health and standard of living.',
      category: 'macroeconomics'
    },
    
    // Life Sciences content
    {
      subjectId: lifeScienceSubject?._id,
      gradeId: grade12?._id,
      term: 'Photosynthesis',
      definition: 'The process by which plants use sunlight, water, and carbon dioxide to produce glucose and oxygen.',
      example: '6CO₂ + 6H₂O + light energy → C₆H₁₂O₆ + 6O₂',
      context: 'Essential process that converts light energy into chemical energy, forming the base of most food chains.',
      category: 'biochemistry'
    },
    {
      subjectId: lifeScienceSubject?._id,
      gradeId: grade12?._id,
      term: 'Mitosis',
      definition: 'A type of cell division that results in two daughter cells each having the same number and kind of chromosomes as the parent nucleus.',
      example: 'A human cell with 46 chromosomes divides to produce two cells, each with 46 chromosomes.',
      context: 'Important for growth, repair, and asexual reproduction in organisms.',
      category: 'cell-biology'
    }
  ];
  
  let created = 0;
  
  for (const content of sampleContent) {
    try {
      if (content.subjectId && content.gradeId) {
        const existing = await models.Content.findOne({
          subject: content.subjectId,
          grade: content.gradeId,
          term: content.term
        });
        
        if (!existing) {
          await services.createContent(content);
          created++;
        }
      }
    } catch (error) {
      console.error(`Error creating content "${content.term}":`, error.message);
    }
  }
  
  console.log(`✅ Sample content seeded: ${created} entries created`);
}

async function seedSamplePastPapers() {
  console.log('📄 Seeding sample past papers...');
  
  const mathSubject = await models.Subject.findOne({ name: 'Mathematics' });
  const grade10 = await models.Grade.findOne({ level: 10 });
  
  const samplePapers = [
    {
      subjectId: mathSubject?._id,
      gradeId: grade10?._id,
      year: 2023,
      paperType: 'p1',
      fileUrl: 'DBE Past Papers/Mathematics P1 Nov 2023 Eng.pdf',
      title: 'Mathematics P1 November 2023'
    },
    {
      subjectId: mathSubject?._id,
      gradeId: grade10?._id,
      year: 2023,
      paperType: 'p2',
      fileUrl: 'DBE Past Papers/Mathematics P2 Nov 2023 Eng.pdf',
      title: 'Mathematics P2 November 2023'
    }
  ];
  
  let created = 0;
  
  for (const paper of samplePapers) {
    try {
      if (paper.subjectId && paper.gradeId) {
        const existing = await models.PastPaper.findOne({
          subject: paper.subjectId,
          grade: paper.gradeId,
          year: paper.year,
          paperType: paper.paperType
        });
        
        if (!existing) {
          await services.createPastPaper(paper);
          created++;
        }
      }
    } catch (error) {
      console.error(`Error creating past paper:`, error.message);
    }
  }
  
  console.log(`✅ Sample past papers seeded: ${created} papers created`);
}

async function runSeeding() {
  console.log('🌱 Starting database seeding...');
  
  try {
    // Initialize database (includes basic seeding)
    await initDB();
    console.log('✅ Database initialized with basic data');
    
    // Seed additional data
    await seedUsers();
    await seedSampleContent();
    await seedSamplePastPapers();
    
    // Print summary
    const stats = {
      subjects: await models.Subject.countDocuments(),
      grades: await models.Grade.countDocuments(),
      users: await models.User.countDocuments(),
      content: await models.Content.countDocuments(),
      pastPapers: await models.PastPaper.countDocuments(),
      languages: await models.Language.countDocuments()
    };
    
    console.log('\n📊 Database Statistics:');
    console.log(`  Subjects: ${stats.subjects}`);
    console.log(`  Grades: ${stats.grades}`);
    console.log(`  Users: ${stats.users}`);
    console.log(`  Content Entries: ${stats.content}`);
    console.log(`  Past Papers: ${stats.pastPapers}`);
    console.log(`  Languages: ${stats.languages}`);
    
    console.log('\n✅ Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Database seeding failed:', error);
    process.exit(1);
  }
}

// Run seeding if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runSeeding();
}

export { seedUsers, seedSampleContent, seedSamplePastPapers };