// src/utils/glossaryApi.ts
const baseUrl = import.meta.env.VITE_API_BASE_URL;

export type Translation = {
  af: string;
  zu: string;
  nso: string;
  ve: string;
};

// Updated to use database API instead of static JSON file
export const fetchSubjectList = async (): Promise<string[]> => {
  try {
    const res = await fetch(`${baseUrl}/api/subjects`);
    if (!res.ok) {
      throw new Error("Failed to fetch subject list");
    }
    const data = await res.json();
    // Extract just the slugs or names from the subject objects
    return data.map((subject: any) => subject.slug || subject.name);
  } catch (error) {
    console.error("Error fetching subject list:", error);
    throw error;
  }
};

export type Term = {
  term: string;
  definition: string;
  translations: Translation;
  context: string;
  example: string;
};

export type TopicFile = {
  topic: string;
  terms: Term[];
};

export type TopicMeta = {
  id: string;
  file: string;
  description: string;
};

export type SubjectIndex = {
  [grade: string]: TopicMeta[];
};

export type IndexFile = {
  [subject: string]: SubjectIndex;
};

// Updated to use database API for grades/topics instead of index.json
export async function fetchIndex(subject: string): Promise<SubjectIndex> {
  try {
    // First get grades for this subject
    const gradesRes = await fetch(`${baseUrl}/api/grades/${subject}`);
    if (!gradesRes.ok) {
      throw new Error(`Failed to fetch grades for subject: ${subject}`);
    }
    const grades = await gradesRes.json();
    
    // Build the subject index structure
    const subjectIndex: SubjectIndex = {};
    
    // For each grade, fetch topics
    for (const grade of grades) {
      try {
        const topicsRes = await fetch(`${baseUrl}/api/topics/${subject}/${grade.level}`);
        if (topicsRes.ok) {
          const topics = await topicsRes.json();
          subjectIndex[grade.level.toString()] = topics.map((topic: any) => ({
            id: topic.id,
            file: topic.id, // Use ID as filename equivalent
            description: topic.title || topic.term
          }));
        } else {
          // Grade has no topics, set empty array
          subjectIndex[grade.level.toString()] = [];
        }
      } catch (err) {
        console.warn(`No topics found for ${subject} grade ${grade.level}`);
        subjectIndex[grade.level.toString()] = [];
      }
    }
    
    return subjectIndex;
  } catch (err) {
    console.error("Error fetching subject index:", err);
    throw err;
  }
}

// Updated to use database API for topic terms instead of static files
export async function fetchTopic(subject: string, grade: string, topicId: string): Promise<TopicFile> {
  try {
    const res = await fetch(`${baseUrl}/api/terms/${subject}/${grade}/${topicId}`);
    if (!res.ok) throw new Error("Failed to load topic terms");
    
    const terms = await res.json();
    
    // Transform the database format to match the expected TopicFile format
    return {
      topic: topicId, // or you might want to fetch the topic title separately
      terms: terms.map((term: any) => ({
        term: term.term,
        definition: term.definition,
        translations: term.translations || { af: "", zu: "", nso: "", ve: "" },
        context: term.context || "",
        example: term.example || ""
      }))
    };
  } catch (err) {
    console.error("Error fetching topic terms:", err);
    throw err;
  }
}