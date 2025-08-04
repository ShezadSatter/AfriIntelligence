import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  fetchIndex,
  fetchTopic,
  fetchSubjectList,
} from "../utils/glossaryApi";
import type { TopicMeta, Term, SubjectIndex } from "../utils/glossaryApi";
import GlossaryTermList from "../components/GlossaryTermList";
import "../pages/glossary.css"; 

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
 <div className="glossary-container">
      {/* Sidebar with Subject, Grade, Topic buttons */}
      <aside className="glossary-sidebar">
        <section className="glossary-section">
          <h2>Subjects</h2>
          <div className="button-group">
            {subjects.map((subject) => (
              <button
                key={subject}
                className={subject === selectedSubject ? "active" : ""}
                onClick={() => setSelectedSubject(subject)}
              >
                {subject.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
              </button>
            ))}
          </div>
        </section>

        <section className="glossary-section">
          <h2>Grades</h2>
          <div className="button-group">
            {grades.map((grade) => (
              <button
                key={grade}
                className={grade === selectedGrade ? "active" : ""}
                onClick={() => setSelectedGrade(grade)}
              >
                {grade.replace("grade", "Grade ")}
              </button>
            ))}
          </div>
        </section>

        <section className="glossary-section">
          <h2>Topics</h2>
          <div className="topic-grid">
            {topics.map((topic) => (
              <button
                key={topic.id}
                className={topic.id === selectedTopic ? "active" : ""}
                onClick={() => setSelectedTopic(topic.id)}
              >
                {topic.id}
              </button>
            ))}
          </div>
        </section>
      </aside>

      {/* Main content area for terms */}
      <main className="glossary-main">
        {selectedTopic && terms.length > 0 ? (
          <GlossaryTermList terms={terms} selectedTopic={selectedTopic} />
        ) : (
          <p className="placeholder-text">
            Select a topic to view glossary terms.
          </p>
        )}
      </main>
    </div>
);

};

export default GlossaryExplorer;
