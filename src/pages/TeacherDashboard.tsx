// src/pages/TeacherDashboard.tsx

import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import styles from "../styles/teacherDashboard.module.css";
import { UserContext } from "../../context/userContext";

interface Grade {
  _id?: string;
  name?: string;
  level?: number;
}

interface Subject {
  _id?: string;
  name?: string;
}

interface Language {
  _id?: string;
  name?: string;
  code?: string;
}

interface GlossaryTerm {
  term: string;
  definition: string;
}

const TeacherDashboard: React.FC = () => {
  const { user } = useContext(UserContext)!;

  const [grades, setGrades] = useState<Grade[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [years, setYears] = useState<number[]>([]);

  const [docForm, setDocForm] = useState({
    grade: "",
    subject: "",
    year: new Date().getFullYear(),
    paperType: "p1",
    language: "",
    file: null as File | null,
  });
  const [docLoading, setDocLoading] = useState(false);

  const [glossaryForm, setGlossaryForm] = useState({
    grade: "",
    subject: "",
    title: "",
    id: "",
  });
  const [glossaryTerms, setGlossaryTerms] = useState<GlossaryTerm[]>([
    { term: "", definition: "" }
  ]);
  const [glossaryLoading, setGlossaryLoading] = useState(false);

  useEffect(() => {
    axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/past-papers/filters`)
      .then((res) => {
        setGrades(res.data.grades || []);
        setSubjects(res.data.subjects || []);
        setYears(res.data.years || [2025, 2024, 2023]);
        
        console.log("Subjects received:", res.data.subjects);
        console.log("Grades received:", res.data.grades);
      })
      .catch(() => alert("Failed to load filter options"));

    axios
      .get(`${import.meta.env.VITE_API_BASE_URL}/api/languages`)
      .then((res) => setLanguages(res.data || []))
      .catch(() => alert("Failed to load languages"));
  }, []);

  if (!user) return <p className={styles.loading}>Loading...</p>;

  const handleDocChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setDocForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0] ? e.target.files[0] : null;
    setDocForm((prev) => ({ ...prev, file }));
  };

  const handleDocSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docForm.file) return alert("Please select a PDF file.");

    const formData = new FormData();
    formData.append("file", docForm.file);
    formData.append("grade", docForm.grade);
    formData.append("subject", docForm.subject);
    formData.append("year", docForm.year.toString());
    formData.append("paper", docForm.paperType);
    formData.append("language", docForm.language);

    try {
      setDocLoading(true);
      await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/past-papers/upload`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      alert("Document uploaded successfully!");
      setDocForm({
        grade: "",
        subject: "",
        year: new Date().getFullYear(),
        paperType: "p1",
        language: "",
        file: null,
      });
    } catch (err: unknown) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      alert(`Upload failed: ${errorMessage}`);
    } finally {
      setDocLoading(false);
    }
  };

  const handleGlossaryChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setGlossaryForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleTermChange = (index: number, field: keyof GlossaryTerm, value: string) => {
    setGlossaryTerms(prev => 
      prev.map((term, i) => 
        i === index ? { ...term, [field]: value } : term
      )
    );
  };

  const addTerm = () => {
    setGlossaryTerms(prev => [...prev, { term: "", definition: "" }]);
  };

  const removeTerm = (index: number) => {
    if (glossaryTerms.length > 1) {
      setGlossaryTerms(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleGlossarySubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate that all terms have both term and definition
    const validTerms = glossaryTerms.filter(t => t.term.trim() && t.definition.trim());
    
    if (validTerms.length === 0) {
      return alert("Please add at least one complete term with both name and definition.");
    }

    try {
      setGlossaryLoading(true);
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/glossary/upload`,
        {
          subject: glossaryForm.subject,
          grade: glossaryForm.grade,
          title: glossaryForm.title,
          id: glossaryForm.id,
          terms: validTerms, // This automatically converts to the JSON format your backend expects
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          withCredentials: true,
        }
      );
      alert("Glossary topic uploaded!");
      setGlossaryForm({ subject: "", grade: "", title: "", id: "" });
      setGlossaryTerms([{ term: "", definition: "" }]);
    } catch (err: unknown) {
      console.error("Upload error:", err);
    
      let errorMessage = 'An unknown error occurred';
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as any;
        console.error("Error response:", axiosError.response?.data);
        errorMessage = axiosError.response?.data?.error || axiosError.message || errorMessage;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
    
      alert(`Glossary upload failed: ${errorMessage}`);
    } finally {
      setGlossaryLoading(false);
    }
  };

  // Fixed helper function to handle all types properly
  const renderOptions = (items: any[]) =>
    items.map((item, index) => {
      // Handle numbers (like years)
      if (typeof item === "number") {
        return (
          <option key={index} value={item}>
            {item}
          </option>
        );
      }
      // Handle strings
      if (typeof item === "string") {
        return (
          <option key={index} value={item}>
            {item}
          </option>
        );
      }
      // Handle objects
      if (typeof item === "object" && item !== null) {
        return (
          <option
            key={item._id ?? index}
            value={item._id}
          >
            {item.name ?? item.level ?? item.code ?? `Item ${index + 1}`}
          </option>
        );
      }
      return null;
    });

  return (
    <div className={styles.dashboard}>
      <h1>Welcome Educator {user.name}</h1>

      

      <div className={styles.selectioncontainer}>
        {/* Upload Document */}
        <form
          id="docForm"
          className={styles.uploadForm}
          onSubmit={handleDocSubmit}
        >
          <h2>Upload Document (Past Paper)</h2>

          <select
            name="grade"
            value={docForm.grade}
            onChange={handleDocChange}
            required
          >
            <option value="">Select Grade</option>
            {renderOptions(grades)}
          </select>

          <select
            name="subject"
            value={docForm.subject}
            onChange={handleDocChange}
            required
          >
            <option value="">Select Subject</option>
            {renderOptions(subjects)}
          </select>

          <select
            name="year"
            value={docForm.year}
            onChange={handleDocChange}
            required
          >
            <option value="">Select Year</option>
            {renderOptions(years)}
          </select>

          <select
            name="paperType"
            value={docForm.paperType}
            onChange={handleDocChange}
            required
          >
            <option value="p1">P1</option>
            <option value="p2">P2</option>
          </select>

          <select
            name="language"
            value={docForm.language}
            onChange={handleDocChange}
            required
          >
            <option value="">Select Language</option>
            {renderOptions(languages)}
          </select>

          <input
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            required
          />
          <button type="submit" disabled={docLoading}>
            {docLoading ? "Uploading..." : "Submit"}
          </button>
        </form>

        {/* Upload Glossary */}
        <form
          id="glossaryForm"
          className={styles.uploadForm}
          onSubmit={handleGlossarySubmit}
        >
          <h2>Upload Glossary Item</h2>

          <select
            name="subject"
            value={glossaryForm.subject}
            onChange={handleGlossaryChange}
            required
          >
            <option value="">Select Subject</option>
            {renderOptions(subjects)}
          </select>

          <select
            name="grade"
            value={glossaryForm.grade}
            onChange={handleGlossaryChange}
            required
          >
            <option value="">Select Grade</option>
            {renderOptions(grades)}
          </select>

          <input
            type="text"
            name="title"
            placeholder="Topic Title"
            value={glossaryForm.title}
            onChange={handleGlossaryChange}
            required
          />

          <input
            type="text"
            name="id"
            placeholder="Topic ID (no spaces or special chars)"
            value={glossaryForm.id}
            onChange={handleGlossaryChange}
            required
          />

          {/* Dynamic Terms Section */}
          <div className={styles.termsSection}>
            <h3>Terms & Definitions</h3>
            {glossaryTerms.map((termObj, index) => (
              <div key={index} className={styles.termRow}>
                <input
                  type="text"
                  placeholder="Term"
                  value={termObj.term}
                  onChange={(e) => handleTermChange(index, 'term', e.target.value)}
                  required
                />
                <textarea
                  placeholder="Definition"
                  value={termObj.definition}
                  onChange={(e) => handleTermChange(index, 'definition', e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => removeTerm(index)}
                  disabled={glossaryTerms.length === 1}
                  className={styles.removeBtn}
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addTerm}
              className={styles.addBtn}
            >
              Add Another Term
            </button>
          </div>

          <button type="submit" disabled={glossaryLoading}>
            {glossaryLoading ? "Uploading..." : "Submit"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default TeacherDashboard;