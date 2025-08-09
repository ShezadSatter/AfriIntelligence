import type { PastPaper } from "../types/PastPaper";

export async function fetchPapers(filters: { subject?: string; grade?: string; year?: string }): Promise<PastPaper[]> {
  const query = new URLSearchParams(filters as Record<string, string>).toString();
  const res = await fetch(`/api/papers?${query}`);

  if (!res.ok) {
    throw new Error(`Error fetching papers: ${res.statusText}`);
  }

  return res.json();
}
