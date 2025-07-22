export type Translation = {
  af: string;
  zu: string;
  nso: string;
  ve: string;
};

export async function fetchSubjectList(): Promise<string[]> {
  try {
    const res = await fetch("https://afri-intelligence.onrender.com/glossary/index.json");
    if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
    const data = await res.json();
    return data.subjects ?? [];
  } catch (err) {
    console.error("Failed to fetch subjects:", err);
    return []; // fallback to empty list
  }
}



export type Term = {
  term: string;
  definition: string;
  translations: Translation;
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

export async function fetchIndex(subject: string): Promise<IndexFile> {
  const res = await fetch(`http://localhost:3001/glossary/${subject}/index.json`);
  if (!res.ok) throw new Error("Failed to load index");
  return await res.json();
}

export async function fetchTopic(subject: string, fileName: string): Promise<TopicFile> {
  const res = await fetch(`http://localhost:3001/glossary/${subject}/${fileName}`);
  if (!res.ok) throw new Error("Failed to load topic file");
  return await res.json();
}
