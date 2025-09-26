import React, { useState, useEffect, useContext } from "react";// reupload
import axios from "axios";
import styles from "../styles/teacherDashboard.module.css";
import { UserContext } from "../../context/userContext";

interface Grade {
  _id?: string;
  name?: string;
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

const TeacherDashboard: React.FC = () => {
  const { user } = useContext(UserContext)!;

  const [grades, setGrades] = useState<Grade[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [years, setYears] = useState<number[]>([2025, 2024, 2023, 2022]);

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
    terms: "",
     title: "",
  id: "",
    definition: "",
  });
  const [glossaryLoading, setGlossaryLoading] = useState(false);

  useEffect(() => {
  axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/past-papers/filters`)
    .then((res) => {
      setGrades(res.data.grades || []);
      setSubjects(res.data.subjects || []);
      setYears(res.data.years || [2025, 2024, 2023]);
      
      // Debug log to see what we're getting
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
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setGlossaryForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleGlossarySubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  let parsedTerms;
  try {
    parsedTerms = JSON.parse(glossaryForm.terms);
    if (!Array.isArray(parsedTerms)) throw new Error("Terms must be an array");
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Invalid JSON format';
    return alert(`Terms field error: ${errorMessage}`);
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
        terms: parsedTerms,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        withCredentials: true, // If you need authentication
      }
    );
    alert("Glossary topic uploaded!");
    setGlossaryForm({ subject: "", grade: "", title: "", id: "", terms: "", definition: "" });
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

  // --- Helper to render dropdown safely ---
  const renderOptions = (items: any[]) =>
  items.map((item, index) => {
    if (typeof item === "string")
      return (
        <option key={index} value={item}>
          {item}
        </option>
      );
    if (typeof item === "object" && item !== null)
      return (
        <option
          key={item._id ?? index}
          value={item._id}  // ALWAYS use _id for the value
        >
          {item.name ?? item.level ?? item.code ?? `Item ${index + 1}`}  // Display name but value is _id
        </option>
      );
    return null;
  });

  return (
    <div className={styles.dashboard}>
      <h1>Welcome Educator {user.name}</h1>

      <div className={styles.actions}>
        <button
          onClick={() =>
            document
              .getElementById("docForm")
              ?.scrollIntoView({ behavior: "smooth" })
          }
        >
          Upload New Material
        </button>
        <button
          onClick={() =>
            document
              .getElementById("glossaryForm")
              ?.scrollIntoView({ behavior: "smooth" })
          }
        >
          Upload Glossary
        </button>
        <button onClick={() => (window.location.href = "/glossary")}>
          Glossary Page
        </button>
        <button onClick={() => (window.location.href = "/pastpapers")}>
          My Library
        </button>
      </div>

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

          {/* Terms input: simple example for now */}
          <textarea
            name="terms"
            placeholder='Enter terms as JSON array: [{"term":"Demand","definition":"..."}]'
            value={glossaryForm.terms}
            onChange={handleGlossaryChange}
            required
          />

          <button type="submit" disabled={glossaryLoading}>
            {glossaryLoading ? "Uploading..." : "Submit"}
          </button>
        </form>
      </div>



    </div>
  );
};

export default TeacherDashboard;
