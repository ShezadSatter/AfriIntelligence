import React from "react";
import type { PastPaper } from "../types/PastPaper";

interface PastPaperListProps {
  papers: PastPaper[];
}

const PastPaperList: React.FC<PastPaperListProps> = ({ papers }) => {
  return (
    <div>
      {papers.map((paper: PastPaper, idx: number) => (
        <div key={idx}>
          <h3>{paper.subject} - Grade {paper.grade} - {paper.year}</h3>
          <a href={paper.file} target="_blank" rel="noopener noreferrer">View PDF</a>
        </div>
      ))}
    </div>
  );
};

export default PastPaperList;
