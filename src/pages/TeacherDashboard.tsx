import React, { useState, useEffect, useContext } from "react";
import axios, { AxiosError } from "axios";
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
// --- Main Component ---
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
    axios
      .get(`${import.meta.env.VITE_API_BASE_URL}/api/past-papers/filters`)
      .then((res) => {
        setGrades(res.data.grades || []);
        setSubjects(res.data.subjects || []);
        setYears(res.data.years || [2025, 2024, 2023]);
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
    } catch (err) {
      console.error(err);
      alert("Upload failed.");
    } finally {
      setDocLoading(false);
    }
  };

  try {
  setGlossaryLoading(true);
  await axios.post(
    `${import.meta.env.VITE_API_BASE_URL}/api/glossary/upload`,
    {
      subject: glossaryForm.subject,
      grade: glossaryForm.grade,
      title: glossaryForm.title,
      id: glossaryForm.id,
      terms: parsedTerms,
    }
  );
  alert("Glossary topic uploaded!");
  setGlossaryForm({
    subject: "",
    grade: "",
    title: "",
    id: "",
    terms: "",
    definition: "",
  });
} catch (err: unknown) {
  if (axios.isAxiosError(err)) {
    console.error("Glossary upload error (Axios):", err);

    if (err.response) {
      console.error("Error Response Data:", err.response.data);
      console.error("Error Response Status:", err.response.status);
      console.error("Error Response Headers:", err.response.headers);
    } else if (err.request) {
      console.error("No response received. Request:", err.request);
    } else {
      console.error("Axios Error Message:", err.message);
    }
  } else {
    console.error("Unexpected Error:", err);
  }

  alert("Glossary upload failed. Check console for details.");
} finally {
  setGlossaryLoading(false);
}
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
            value={item._id ?? item.name ?? index}
          >
            {item.name ?? item.code ?? `Item ${index + 1}`}
          </option>
        );
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
