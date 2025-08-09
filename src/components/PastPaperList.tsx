import React from "react";
import { Paper } from "../types/PastPaper";
import "./PaperList.css";

interface PaperListProps {
  papers: Paper[];
}

const PaperList: React.FC<PaperListProps> = ({ papers }) => {
  if (papers.length === 0) {
    return <p>No papers found.</p>;
  }

  return (
    <ul className="paper-list">
      {papers.map((paper, idx) => (
        <li key={idx}>
          {paper.subject} - Grade {paper.grade} ({paper.year}){" "}
          <a href={paper.file} target="_blank" rel="noopener noreferrer">
            View PDF
          </a>
        </li>
      ))}
    </ul>
  );
};

export default PaperList;
