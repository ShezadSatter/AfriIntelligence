const baseUrl = import.meta.env.VITE_API_BASE_URL;

export type Translation = {
  af: string;
  zu: string;
  nso: string;
  ve: string;
};

export const fetchSubjectList = async (): Promise<string[]> => {
  try {
    const res = await fetch(`${baseUrl}/api/glossary/index.json`);
    if (!res.ok) {
      throw new Error("Failed to fetch subject list");
    }
    const data = await res.json();
    return data.subjects || [];
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

export async function fetchIndex(subject: string): Promise<SubjectIndex> {
  try {
    const res = await fetch(`${baseUrl}/api/glossary/${subject}/index.json`);
    if (!res.ok) {
      throw new Error(`Failed to fetch index.json for subject: ${subject}`);
    }
  const data = await res.json();
  return data[subject];  } catch (err) {
    console.error("Error fetching index.json:", err);
    throw err;
  }
}

export async function fetchTopic(subject: string, grade: string, fileName: string): Promise<TopicFile> {
  try {
    const res = await fetch(`${baseUrl}/api/glossary/${subject}/${grade}/${fileName}`);
    if (!res.ok) throw new Error("Failed to load topic file");
    return await res.json();
  } catch (err) {
    console.error("Error fetching topic file:", err);
    throw err;
  }
}
