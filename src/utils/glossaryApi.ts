export type Translation = {
  af: string;
  zu: string;
  nso: string;
  ve: string;
};

export const fetchSubjectList = async (): Promise<string[]> => {
  const response = await fetch("/glossary/index.json");
  if (!response.ok) throw new Error("Failed to load subjects");
  const data = await response.json();
  return Object.keys(data);
};



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
  const res = await fetch(`https://afri-intelligence.onrender.com/glossary/${subject}/index.json`);
  if (!res.ok) throw new Error("Failed to load index");
  return await res.json();
}

export async function fetchTopic(subject: string, fileName: string): Promise<TopicFile> {
  const res = await fetch(`https://afri-intelligence.onrender.com/glossary/${subject}/${fileName}`);
  if (!res.ok) throw new Error("Failed to load topic file");
  return await res.json();
}
