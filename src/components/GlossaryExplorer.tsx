import React, { useEffect, useState } from "react";
import {
  fetchIndex,
  fetchTopic
} from "../utils/glossaryApi";
import type { IndexFile } from "../utils/glossaryApi";
import type { TopicMeta } from "../utils/glossaryApi";
import type { Term } from "../utils/glossaryApi";

const subjects = ["life-science"]; // Add more later if needed

const GlossaryExplorer: React.FC = () => {
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedGrade, setSelectedGrade] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("");

  const [grades, setGrades] = useState<string[]>([]);
  const [topics, setTopics] = useState<TopicMeta[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [indexData, setIndexData] = useState<IndexFile | null>(null);

  // Load index.json when subject changes
  useEffect(() => {
    if (!selectedSubject) return;

    fetchIndex(selectedSubject)
      .then((data) => {
        setIndexData(data);
        const subjectIndex = data[selectedSubject];
        if (subjectIndex) {
          setGrades(Object.keys(subjectIndex));
        } else {
          setGrades([]);
        }
        setSelectedGrade("");
        setSelectedTopic("");
        setTopics([]);
        setTerms([]);
      })
      .catch(console.error);
  }, [selectedSubject]);

  // Update topic options when grade is selected
  useEffect(() => {
    if (!indexData || !selectedSubject || !selectedGrade) return;
    const gradeTopics = indexData[selectedSubject][selectedGrade] || [];
    setTopics(gradeTopics);
    setSelectedTopic("");
    setTerms([]);
  }, [selectedGrade, indexData, selectedSubject]);

  // Load topic terms when topic is selected
  useEffect(() => {
    const topicMeta = topics.find((t) => t.id === selectedTopic);
    if (!topicMeta) return;

    fetchTopic(selectedSubject, topicMeta.file)
      .then((data) => setTerms(data.terms))
      .catch(console.error);
  }, [selectedTopic, topics, selectedSubject]);

  return (
    <div style={{ padding: "1rem" }}>
      <h1>Glossary Explorer</h1>

      {/* Subject Dropdown */}
      <label>
        Subject:
        <select value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)}>
          <option value="">Select Subject</option>
          {subjects.map((subject) => (
            <option key={subject} value={subject}>
              {subject}
            </option>
          ))}
        </select>
      </label>

      {/* Grade Dropdown */}
      {grades.length > 0 && (
        <label>
          Grade:
          <select value={selectedGrade} onChange={(e) => setSelectedGrade(e.target.value)}>
            <option value="">Select Grade</option>
            {grades.map((grade) => (
              <option key={grade} value={grade}>
                {grade.replace("grade", "Grade ")}
              </option>
            ))}
          </select>
        </label>
      )}

      {/* Topic Dropdown */}
      {topics.length > 0 && (
        <label>
          Topic:
          <select value={selectedTopic} onChange={(e) => setSelectedTopic(e.target.value)}>
            <option value="">Select Topic</option>
            {topics.map((topic) => (
              <option key={topic.id} value={topic.id}>
                {topic.id}
              </option>
            ))}
          </select>
        </label>
      )}

      {/* Glossary Terms */}
      {terms.length > 0 && (
        <div style={{ marginTop: "2rem" }}>
          <h2>{selectedTopic}</h2>
          {terms.map((term, idx) => (
            <div key={idx} style={{ marginBottom: "1rem" }}>
              <strong>{term.term}:</strong> {term.definition}
              <ul>
                <li><strong>Afrikaans:</strong> {term.translations.af}</li>
                <li><strong>isiZulu:</strong> {term.translations.zu}</li>
                <li><strong>Sepedi:</strong> {term.translations.nso}</li>
                <li><strong>Tshivenda:</strong> {term.translations.ve}</li>
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GlossaryExplorer;
