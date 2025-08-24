// scripts/migrate.js - Migration script to move data from JSON to MongoDB
import dotenv from 'dotenv';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDB, models, services } from '../db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

async function migratePastPapers() {
  console.log('📄 Migrating past papers...');
  
  try {
    const pastPapersPath = path.join(__dirname, '..', 'pastPapers.json');
    const pastPapersData = await fs.readJson(pastPapersPath);
    
    let migrated = 0;
    let errors = [];
    
    for (const paperData of pastPapersData) {
      try {
        // Find subject by name (case-insensitive)
        const subject = await models.Subject.findOne({ 
          name: { $regex: new RegExp(paperData.subject, 'i') } 
        });
        
        // Find grade by level
        const grade = await models.Grade.findOne({ 
          level: parseInt(paperData.grade) 
        });
        
        if (!subject || !grade) {
          errors.push(`Subject "${paperData.subject}" or Grade "${paperData.grade}" not found`);
          continue;
        }
        
        // Determine paper type from fileUrl
        let paperType = 'p1';
        if (paperData.fileUrl.toLowerCase().includes('p2')) {
          paperType = 'p2';
        } else if (paperData.fileUrl.toLowerCase().includes('p3')) {
          paperType = 'p3';
        }
        
        // Check if paper already exists
        const existingPaper = await models.PastPaper.findOne({
          subject: subject._id,
          grade: grade._id,
          year: parseInt(paperData.year),
          paperType
        });
        
        if (existingPaper) {
          // Update existing paper
          await models.PastPaper.updateOne(
            { _id: existingPaper._id },
            { fileUrl: paperData.fileUrl }
          );
        } else {
          // Create new paper
          await services.createPastPaper({
            subjectId: subject._id,
            gradeId: grade._id,
            year: parseInt(paperData.year),
            paperType,
            fileUrl: paperData.fileUrl
          });
        }
        
        migrated++;
      } catch (error) {
        errors.push(`Error migrating paper ${paperData.fileUrl}: ${error.message}`);
      }
    }
    
    console.log(`✅ Past papers migration complete: ${migrated} papers migrated`);
    if (errors.length > 0) {
      console.log(`⚠️ Errors encountered:`);
      errors.forEach(error => console.log(`  - ${error}`));
    }
    
    return { migrated, errors };
  } catch (error) {
    console.error('❌ Past papers migration failed:', error);
    throw error;
  }
}

async function migrateGlossaryContent() {
  console.log('📚 Migrating glossary content...');
  
  try {
    const glossaryDir = path.join(__dirname, '..', 'glossary');
    
    if (!(await fs.pathExists(glossaryDir))) {
      console.log('⚠️ Glossary directory not found, skipping glossary migration');
      return { migrated: 0, errors: [] };
    }
    
    // Read master index to get subjects
    const masterIndexPath = path.join(glossaryDir, 'index.json');
    let subjects = [];
    
    if (await fs.pathExists(masterIndexPath)) {
      const masterIndex = await fs.readJson(masterIndexPath);
      subjects = masterIndex.subjects || [];
    } else {
      // Fallback: read directory contents
      const dirs = await fs.readdir(glossaryDir, { withFileTypes: true });
      subjects = dirs.filter(d => d.isDirectory()).map(d => d.name);
    }
    
    let totalMigrated = 0;
    let allErrors = [];
    
    for (const subjectSlug of subjects) {
      console.log(`  Migrating ${subjectSlug}...`);
      
      const subjectDir = path.join(glossaryDir, subjectSlug);
      if (!(await fs.pathExists(subjectDir))) continue;
      
      // Find matching subject in database
      const subject = await models.Subject.findOne({ slug: subjectSlug });
      if (!subject) {
        allErrors.push(`Subject not found for slug: ${subjectSlug}`);
        continue;
      }
      
      // Read subject index or scan directory
      const subjectIndexPath = path.join(subjectDir, 'index.json');
      let gradeData = {};
      
      if (await fs.pathExists(subjectIndexPath)) {
        gradeData = await fs.readJson(subjectIndexPath);
      } else {
        // Scan grade directories
        const gradeDirs = await fs.readdir(subjectDir, { withFileTypes: true });
        for (const gradeDir of gradeDirs.filter(d => d.isDirectory())) {
          const gradeLevel = parseInt(gradeDir.name);
          if (!isNaN(gradeLevel)) {
            const gradeFiles = await fs.readdir(path.join(subjectDir, gradeDir.name));
            gradeData[gradeLevel] = gradeFiles.filter(f => f.endsWith('.json'));
          }
        }
      }
      
      // Process each grade
      for (const [gradeLevel, content] of Object.entries(gradeData)) {
        const grade = await models.Grade.findOne({ level: parseInt(gradeLevel) });
        if (!grade) {
          allErrors.push(`Grade ${gradeLevel} not found`);
          continue;
        }
        
        let entries = [];
        
        if (Array.isArray(content)) {
          // Content is direct array of terms
          entries = content;
        } else if (typeof content === 'object') {
          // Content might be organized by topics/files
          for (const [topic, topicEntries] of Object.entries(content)) {
            if (Array.isArray(topicEntries)) {
              entries = entries.concat(topicEntries.map(entry => ({
                ...entry,
                category: topic
              })));
            }
          }
        } else if (typeof content === 'string' && content.endsWith('.json')) {
          // Read from file
          const contentPath = path.join(subjectDir, gradeLevel, content);
          if (await fs.pathExists(contentPath)) {
            const fileContent = await fs.readJson(contentPath);
            entries = Array.isArray(fileContent) ? fileContent : [];
          }
        }
        
        // Migrate entries
        for (const entry of entries) {
          try {
            if (!entry.term || !entry.definition) {
              allErrors.push(`Missing term or definition for entry in ${subjectSlug} grade ${gradeLevel}`);
              continue;
            }
            
            // Check if entry already exists
            const existing = await models.Content.findOne({
              subject: subject._id,
              grade: grade._id,
              term: entry.term
            });
            
            if (existing) {
              // Update existing entry
              await models.Content.updateOne(
                { _id: existing._id },
                {
                  definition: entry.definition,
                  example: entry.example || null,
                  context: entry.context || null,
                  category: entry.category || null
                }
              );
            } else {
              // Create new entry
              await services.createContent({
                subjectId: subject._id,
                gradeId: grade._id,
                term: entry.term,
                definition: entry.definition,
                example: entry.example,
                context: entry.context,
                category: entry.category
              });
            }
            
            totalMigrated++;
          } catch (error) {
            allErrors.push(`Error migrating term "${entry.term}" in ${subjectSlug} grade ${gradeLevel}: ${error.message}`);
          }
        }
      }
    }
    
    console.log(`✅ Glossary migration complete: ${totalMigrated} entries migrated`);
    if (allErrors.length > 0) {
      console.log(`⚠️ Errors encountered:`);
      allErrors.slice(0, 10).forEach(error => console.log(`  - ${error}`));
      if (allErrors.length > 10) {
        console.log(`  ... and ${allErrors.length - 10} more errors`);
      }
    }
    
    return { migrated: totalMigrated, errors: allErrors };
  } catch (error) {
    console.error('❌ Glossary migration failed:', error);
    throw error;
  }
}

async function updatePaperCounts() {
  console.log('📊 Updating paper counts...');
  
  try {
    const subjects = await models.Subject.find();
    
    for (const subject of subjects) {
      const paperCount = await models.PastPaper.countDocuments({ 
        subject: subject._id,
        isActive: true 
      });
      
      await models.Subject.updateOne(
        { _id: subject._id },
        { paperCount }
      );
    }
    
    console.log('✅ Paper counts updated');
  } catch (error) {
    console.error('❌ Failed to update paper counts:', error);
    throw error;
  }
}

async function runMigration() {
  console.log('🚀 Starting AfriIntelligence data migration...');
  
  try {
    // Initialize database
    await initDB();
    console.log('✅ Database initialized');
    
    // Run migrations
    const pastPapersResult = await migratePastPapers();
    const glossaryResult = await migrateGlossaryContent();
    await updatePaperCounts();
    
    // Print summary
    console.log('\n📋 Migration Summary:');
    console.log(`  Past Papers: ${pastPapersResult.migrated} migrated`);
    console.log(`  Glossary Entries: ${glossaryResult.migrated} migrated`);
    
    const totalErrors = pastPapersResult.errors.length + glossaryResult.errors.length;
    if (totalErrors > 0) {
      console.log(`  Total Errors: ${totalErrors}`);
    }
    
    console.log('\n✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigration();
}

export { migratePastPapers, migrateGlossaryContent, updatePaperCounts };