import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import GlossaryTermList from "../components/GlossaryTermList";
import "../pages/glossary.css";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

interface Topic {
  id: string; // JSON file identifier
  title: string; // Human-readable title
  description?: string;
}

interface TermContent {
  id: string;
  term: string;
  definition: string;
  example?: string;
  context?: string;
  category?: string;
}

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
  const [subjects, setSubjects] = useState<
    { id: string; name: string; slug: string }[]
  >([]);
  const [grades, setGrades] = useState<
    { id: string; level: number; description?: string }[]
  >([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  // Change from a single TermContent to an array
  const [terms, setTerms] = useState<TermContent[]>([]);

  const [selectedSubject, setSelectedSubject] = useState(initialSubject);
  const [selectedGrade, setSelectedGrade] = useState(initialGrade);
  const [selectedTopic, setSelectedTopic] = useState(initialTopic);

  const navigate = useNavigate();

  // Update URL when selections change
  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedSubject) params.set("subject", selectedSubject);
    if (selectedGrade) params.set("grade", selectedGrade);
    if (selectedTopic) params.set("topic", selectedTopic);
    navigate(`/glossary?${params.toString()}`, { replace: true });
  }, [selectedSubject, selectedGrade, selectedTopic, navigate]);

  // Load subjects
  useEffect(() => {
    fetch(`${API_BASE}/api/subjects`)
      .then((res) => res.json())
      .then(setSubjects)
      .catch(console.error);
  }, []);

  // Load grades when subject changes
  useEffect(() => {
    if (!selectedSubject) {
      setGrades([]);
      setSelectedGrade("");
      return;
    }
    fetch(`${API_BASE}/api/grades/${selectedSubject}`)
      .then((res) => res.json())
      .then(setGrades)
      .catch(console.error);
  }, [selectedSubject]);

  // Load topics when subject + grade changes
  useEffect(() => {
    if (!selectedSubject || !selectedGrade) {
      setTopics([]);
      setSelectedTopic("");
      return;
    }
    fetch(`${API_BASE}/api/topics/${selectedSubject}/${selectedGrade}`)
      .then((res) => res.json())
      .then((data) => setTopics(Array.isArray(data) ? data : []))
      .catch(console.error);
  }, [selectedSubject, selectedGrade]);

  // Load term content when topic changes
  useEffect(() => {
    if (!selectedSubject || !selectedGrade || !selectedTopic) {
      setTerms([]);
      return;
    }

    fetch(
      `${API_BASE}/api/terms/${selectedSubject}/${selectedGrade}/${selectedTopic}`
    )
      .then((res) => res.json())
      .then((data: TermContent[]) => {
        // Ensure data is an array
        setTerms(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.error("Failed to fetch terms:", err);
        setTerms([]);
      });
  }, [selectedSubject, selectedGrade, selectedTopic]);

  return (
    <div className="glossary-container">
      <aside className="glossary-sidebar">
        <section className="glossary-section">
          <h2>Subjects</h2>
          <div className="button-group">
            {subjects.map((s) => (
              <button
                key={s.id}
                className={s.slug === selectedSubject ? "active" : ""}
                onClick={() => {
                  setSelectedSubject(s.slug);
                  setSelectedGrade("");
                  setSelectedTopic("");
                  setTopics([]);
                  setTerms([]);
                }}
              >
                {s.name}
              </button>
            ))}
          </div>
        </section>

        <section className="glossary-section">
          <h2>Grades</h2>
          <div className="button-group">
            {grades.map((g) => (
              <button
                key={g.id}
                className={g.level.toString() === selectedGrade ? "active" : ""}
                onClick={() => {
                  setSelectedGrade(g.level.toString());
                  setSelectedTopic("");
                  setTerms([]);
                }}
              >
                {g.description || `Grade ${g.level}`}
              </button>
            ))}
          </div>
        </section>

        <section className="glossary-section">
          <h2>Topics</h2>
          <div className="topic-grid">
            {topics.map((topic) => (
              <button key={topic.id} onClick={() => setSelectedTopic(topic.id)}>
                {topic.title} {/* <- will show the topic name */}
              </button>
            ))}
          </div>
        </section>
      </aside>

      <main className="glossary-main">
        {terms.length > 0 ? (
          <GlossaryTermList
            terms={terms.map((t) => ({
              id: t.id,
              term: t.term,
              definition: t.definition,
              context: t.context || "",
              example: t.example || "",
              category: t.category || "",
            }))}
            selectedTopic={
              topics.find((t) => t.id === selectedTopic)?.title || ""
            }
          />
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
