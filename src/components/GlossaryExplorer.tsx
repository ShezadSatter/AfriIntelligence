import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  fetchIndex,
  fetchTopic,
  fetchSubjectList,
} from "../utils/glossaryApi";
import type { TopicMeta, Term, SubjectIndex } from "../utils/glossaryApi";
import GlossaryTermList from "../components/GlossaryTermList";


interface GlossaryExplorerProps {
  initialSubject?: string;
  initialGrade?: string;
  initialTopic?: string;
}


const GlossaryExplorer: React.FC<GlossaryExplorerProps> = ({
  initialSubject = "",
  initialGrade = "",
  initialTopic = "",
}) => {
  const [selectedSubject, setSelectedSubject] = useState(initialSubject);
  const [selectedGrade, setSelectedGrade] = useState(initialGrade);
  const [selectedTopic, setSelectedTopic] = useState(initialTopic);

  const [subjects, setSubjects] = useState<string[]>([]);
  const [grades, setGrades] = useState<string[]>([]);
  const [topics, setTopics] = useState<TopicMeta[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [indexData, setIndexData] = useState<Record<string, SubjectIndex> | null>(null);

  const navigate = useNavigate();

  // Update URL when selections change
  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedSubject) params.set("subject", selectedSubject);
    if (selectedGrade) params.set("grade", selectedGrade);
    if (selectedTopic) params.set("topic", selectedTopic);
    navigate(`/glossary?${params.toString()}`, { replace: true });
  }, [selectedSubject, selectedGrade, selectedTopic, navigate]);

  // Load available subjects
  useEffect(() => {
    fetchSubjectList()
      .then(setSubjects)
      .catch(console.error);
  }, []);

  // Load index.json when subject changes
  useEffect(() => {
    if (!selectedSubject) return;

    fetchIndex(selectedSubject)
      .then((data) => {
        setIndexData({ [selectedSubject]: data });
        const subjectIndex = data;
        if (subjectIndex) {
          setGrades(Object.keys(subjectIndex));
        } else {
          setGrades([]);
        }

        // Reset or use initial props
        setSelectedGrade(initialGrade || "");
        setSelectedTopic(initialTopic || "");
        setTopics([]);
        setTerms([]);
      })
      .catch(console.error);
  }, [selectedSubject]);

  // Load topic list when grade changes
  useEffect(() => {
    if (!indexData || !selectedSubject || !selectedGrade) return;
    const gradeTopics = indexData[selectedSubject][selectedGrade] || [];
    setTopics(gradeTopics);
    if (!initialTopic) setSelectedTopic("");
    setTerms([]);
  }, [selectedGrade, indexData, selectedSubject]);

  // Load glossary terms when topic changes
  useEffect(() => {
    const topicMeta = topics.find((t) => t.id === selectedTopic);
    if (!topicMeta) return;

    fetchTopic(selectedSubject, selectedGrade, topicMeta.file)
      .then((data) => setTerms(data.terms))
      .catch(console.error);
}, [selectedTopic, topics, selectedSubject, selectedGrade]);

  return (
    <div style={{ padding: "1rem" }}>
      <h1>Glossary Explorer</h1>

      {/* Subject Dropdown */}
      <label>
        Subject:
        <select
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
        >
          <option value="">Select Subject</option>
          {subjects.map((subject) => (
            <option key={subject} value={subject}>
              {subject.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
            </option>
          ))}
        </select>
      </label>

      {/* Grade Dropdown */}
      {grades.length > 0 && (
        <label>
          Grade:
          <select
            value={selectedGrade}
            onChange={(e) => setSelectedGrade(e.target.value)}
          >
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
          <select
            value={selectedTopic}
            onChange={(e) => setSelectedTopic(e.target.value)}
          >
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
      {selectedTopic && terms.length === 0 && (
        <p>No terms found for this topic.</p>
      )}

     {terms.length > 0 && (
  <GlossaryTermList terms={terms} selectedTopic={selectedTopic} />
)}


    </div>
  );
};

export default GlossaryExplorer;
