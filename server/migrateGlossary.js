import fs from "fs/promises";//reupload
import path from "path";
import { connectDB } from "./db.js";
import Content from "./models/content.js";
import Subject from "./models/subject.js";
import Grade from "./models/grade.js";

async function migrateGlossary() {
  try {
    await connectDB(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    const glossaryDir = path.join(process.cwd(), "glossary");
    const subjects = await fs.readdir(glossaryDir, { withFileTypes: true });

    let migrated = 0;
    const errors = [];

    for (const subjectDir of subjects.filter(d => d.isDirectory())) {
      const subjectSlug = subjectDir.name.toLowerCase();
      const subjectPath = path.join(glossaryDir, subjectDir.name);
      const subject = await Subject.findOne({ slug: subjectSlug });
      if (!subject) {
        errors.push(`Subject not found: ${subjectSlug}`);
        continue;
      }

      const grades = await fs.readdir(subjectPath, { withFileTypes: true });
      for (const gradeDir of grades.filter(d => d.isDirectory())) {
        const gradeLevel = parseInt(gradeDir.name.replace("grade", ""), 10);
        const gradePath = path.join(subjectPath, gradeDir.name);
        const grade = await Grade.findOne({ level: gradeLevel });
        if (!grade) {
          errors.push(`Grade not found: ${gradeLevel}`);
          continue;
        }

        const topicFiles = await fs.readdir(gradePath, { withFileTypes: true });
        for (const topicFile of topicFiles.filter(f => f.isFile() && f.name.endsWith(".json"))) {
          const topicPath = path.join(gradePath, topicFile.name);
          try {
            console.log(`📄 Reading file: ${topicPath}`);
            const raw = await fs.readFile(topicPath, "utf-8");
            const topicData = JSON.parse(raw);

            if (!Array.isArray(topicData.terms) || topicData.terms.length === 0) {
              errors.push(`No terms in file: ${topicPath}`);
              continue;
            }

            const filteredTerms = topicData.terms.filter(t => t.term && t.definition);
            if (filteredTerms.length === 0) {
              errors.push(`No valid terms in file: ${topicPath}`);
              continue;
            }

            const topicDoc = {
              title: topicData.title || topicFile.name.replace(".json", ""),
              id: topicData.id || topicFile.name.replace(".json", ""),
              subject: subject._id,
              grade: grade._id,
              terms: filteredTerms.map(t => ({
                term: t.term,
                definition: t.definition,
                context: t.context || "",
                example: t.example || "",
                category: t.category || "",
              })),
              isActive: true,
              languageCode: topicData.languageCode || "en",
            };

            console.log("Final topicDoc to insert:", topicDoc);
            await Content.create(topicDoc);
            migrated++;
            console.log(`✅ Migrated topic: ${topicDoc.id}`);
          } catch (err) {
            errors.push(`Failed to read/insert ${topicPath}: ${err.message}`);
            console.error(err);
          }
        }
      }
    }

    console.log("Migration completed:", { migrated, errors });
    process.exit(0);

  } catch (err) {
    console.error("❌ Migration failed:", err);
    process.exit(1);
  }
}

migrateGlossary();
