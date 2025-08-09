import React from "react";
import type { PastPaper } from "../types/PastPaper";

interface PastPaperListProps {
  papers: PastPaper[];
}

const PastPaperList: React.FC<PastPaperListProps> = ({ papers }) => {
  if (papers.length === 0) return <p>No past papers found.</p>;

  return (
    <ul>
      {papers.map((paper, idx) => (
        <li key={idx}>
          {paper.subject} - Grade {paper.grade} - Year {paper.year} - <a href={paper.file}>Download</a>
        </li>
      ))}
    </ul>
  );
};

export default PastPaperList;
