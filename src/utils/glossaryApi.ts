export type Translation = {
  af: string;
  zu: string;
  nso: string;
  ve: string;
};

export const fetchSubjectList = async (): Promise<string[]> => {
  const res = await fetch("/server/glossary/index.json");
  const data = await res.json();
  return data.subjects || [];
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
  const res = await fetch(`/server//glossary/${subject}/index.json`);
  if (!res.ok) throw new Error("Failed to load index");
  return await res.json();
}

export async function fetchTopic(subject: string, grade: string, fileName: string): Promise<TopicFile> {
  const res = await fetch(`/server/glossary/${subject}/${grade}/${fileName}`);
  if (!res.ok) throw new Error("Failed to load topic file");
  return await res.json();
}

