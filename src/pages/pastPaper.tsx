import { fetchPapers } from "../utils/pastPapers";

const loadPapers = async (filters: { subject?: string; grade?: string; year?: string }) => {
  try {
    const data = await fetchPapers(filters);
    setPapers(data);
  } catch (err) {
    console.error(err);
  }
};
