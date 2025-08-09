import { PastPaper } from "../types/PastPaper";

/**
 * Fetch papers from backend
 */
export async function fetchPapers(filters: { subject?: string; grade?: string; year?: string }): Promise<Paper[]> {
  const query = new URLSearchParams(filters as Record<string, string>).toString();
  const res = await fetch(`/api/papers?${query}`);

  if (!res.ok) {
    throw new Error(`Error fetching papers: ${res.statusText}`);
  }

  return res.json();
}

/**
 * Get unique subjects from papers list
 */
export function getUniqueSubjects(papers: Paper[]): string[] {
  return Array.from(new Set(papers.map(p => p.subject)));
}

/**
 * Get unique grades from papers list
 */
export function getUniqueGrades(papers: Paper[]): number[] {
  return Array.from(new Set(papers.map(p => p.grade))).sort((a, b) => a - b);
}

/**
 * Get unique years from papers list
 */
export function getUniqueYears(papers: Paper[]): number[] {
  return Array.from(new Set(papers.map(p => p.year))).sort((a, b) => b - a);
}
