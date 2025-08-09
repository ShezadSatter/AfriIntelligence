import React, { useState } from "react";
import PastPaper from "../types/PastPaper";
import { fetchPapers } from "../utils/pastPaper";
import PastPaperList from "../components/PastPaperList";
import PastPaperFilter from "../components/PastPaperFilter";

const PastPaper: React.FC = () => {
  const [papers, setPapers] = useState<PastPaper[]>([]);

  const loadPapers = async (filters: { subject?: string; grade?: string; year?: string }) => {
    try {
      const data = await fetchPapers(filters);
      setPapers(data);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div>
      <h1>NSC Past Papers</h1>
      <PastPaperFilter onFilter={loadPapers} />
      <PastPaperList papers={papers} />
    </div>
  );
};

export default PastPaper;
