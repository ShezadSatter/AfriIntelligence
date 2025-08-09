import React, { useState } from "react";
import "./PaperFilter.css";

interface PaperFilterProps {
  onFilter: (filters: { subject?: string; grade?: string; year?: string }) => void;
}

const PaperFilter: React.FC<PaperFilterProps> = ({ onFilter }) => {
  const [subject, setSubject] = useState("");
  const [grade, setGrade] = useState("");
  const [year, setYear] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFilter({ subject, grade, year });
  };

  return (
    <form className="filter-form" onSubmit={handleSubmit}>
      <label>
        Subject:
        <select value={subject} onChange={(e) => setSubject(e.target.value)}>
          <option value="">-- Select --</option>
          <option value="Mathematics">Mathematics</option>
          <option value="Physical Science">Physical Science</option>
        </select>
      </label>

      <label>
        Grade:
        <select value={grade} onChange={(e) => setGrade(e.target.value)}>
          <option value="">-- Select --</option>
          <option value="10">Grade 10</option>
          <option value="11">Grade 11</option>
          <option value="12">Grade 12</option>
        </select>
      </label>

      <label>
        Year:
        <select value={year} onChange={(e) => setYear(e.target.value)}>
          <option value="">-- Select --</option>
          <option value="2023">2023</option>
          <option value="2022">2022</option>
          <option value="2021">2021</option>
        </select>
      </label>

      <button type="submit">Search</button>
    </form>
  );
};

export default PaperFilter;
