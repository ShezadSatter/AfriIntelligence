import React, { useState } from "react";

interface FilterProps {
  onFilter: (filters: { subject?: string; grade?: string; year?: string }) => void;
}

const PastPaperFilter: React.FC<FilterProps> = ({ onFilter }) => {
  const [subject, setSubject] = useState("");
  const [grade, setGrade] = useState("");
  const [year, setYear] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFilter({
      subject: subject || undefined,
      grade: grade || undefined,
      year: year || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input placeholder="Subject" value={subject} onChange={e => setSubject(e.target.value)} />
      <input placeholder="Grade" value={grade} onChange={e => setGrade(e.target.value)} />
      <input placeholder="Year" value={year} onChange={e => setYear(e.target.value)} />
      <button type="submit">Filter</button>
    </form>
  );
};

export default PastPaperFilter;
