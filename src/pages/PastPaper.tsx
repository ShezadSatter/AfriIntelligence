import { fetchPapers } from "../utils/pastPaper";

const loadPapers = async (filters: { subject?: string; grade?: string; year?: string }) => {
  try {
    const data = await fetchPapers(filters);
    setPapers(data);
  } catch (err) {
    console.error(err);
  }
};

 return (
    <div>
      <h1>NSC Past Papers</h1>
      <PaperFilter onFilter={loadPapers} />
      <PaperList papers={papers} />
    </div>
  );

  export default PastPaper;