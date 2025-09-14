import React, { useState, useEffect } from 'react';
import styles from '../styles/PastPaperPage.module.css';

const PastPapersPage: React.FC = () => {
  const [grade, setGrade] = useState('');
  const [subject, setSubject] = useState('');
  const [year, setYear] = useState('');
  const [filePath, setFilePath] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [paper, setPaper] = useState('');

  const [grades, setGrades] = useState<string[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [years, setYears] = useState<string[]>([]);
  const papers = ['P1', 'P2'];


  const fetchPaper = async () => {
    if (!grade || !subject || !year) {
      setFilePath(null);
      setError('Please select grade, subject, and year');
      return;
    }

    setLoading(true);
    setError(null);
    setFilePath(null);

      try {
    const params = new URLSearchParams({ grade, subject, year });
    if (paper) params.append('paper', paper);
    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/past-papers?${params.toString()}`);

    const contentType = res.headers.get('content-type') || '';

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Server error (${res.status}): ${errorText}`);
    }

    if (contentType.includes('application/json')) {
      const data = await res.json();
      setFilePath(data.fileUrl);
    } else {
      throw new Error('Unexpected response format from server.');
    }
  } catch (err: any) {
    setError(err.message || 'Failed to fetch past paper');
  } finally {
    setLoading(false);
  }
};

 useEffect(() => {
    fetch(`${import.meta.env.VITE_API_BASE_URL}/api/past-papers/filters`)
      .then(res => res.json())
      .then(data => {
        setGrades(data.grades || []);
        setSubjects(data.subjects || []);
        setYears(data.years || []);
      })
      .catch(() => setError('Failed to load filter options'));
  }, []);

  useEffect(() => {
    if (grade && subject && year) {
      fetchPaper();
    }
  }, [grade, subject, year, paper]);

  // Build download and preview URLs using backend route
const downloadUrl = filePath
  ? `${import.meta.env.VITE_API_BASE_URL}/api/past-papers/file?filePath=${encodeURIComponent(filePath)}`
  : null;

const previewUrl = filePath
  ? `${import.meta.env.VITE_API_BASE_URL}/api/past-papers/file?filePath=${encodeURIComponent(filePath)}&preview=true`
  : null;

  return (
    <div className = {styles.container}>
      <h1>Past Papers</h1>

      <div>
        <label style={{color : "white"}}>
          Grade:{' '}
          <select value={grade} onChange={e => setGrade(e.target.value)}>
            <option value="">Select Grade</option>
            {grades.map(g => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div style={{ marginBottom: 10 }}>
        <label style={{color : "white"}}>
          Subject:{' '}
          <select value={subject} onChange={e => setSubject(e.target.value)}>
            <option value="">Select Subject</option>
            {subjects.map(s => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div style={{ marginBottom: 10 }}>
        <label style={{color: "white"}}>
          Year:{' '}
          <select value={year} onChange={e => setYear(e.target.value)}>
            <option value="">Select Year</option>
            {years.map(y => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div style={{ marginBottom: 10 }}>
  <label style={{color : "white"}}>
    Paper:{' '}
    <select value={paper} onChange={e => setPaper(e.target.value)}>
      <option value="">Select Paper</option>
      {papers.map(p => (
        <option key={p} value={p}>
          {p}
        </option>
      ))}
    </select>
  </label>
</div>


      {loading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {downloadUrl && previewUrl && (
  <div style={{ marginTop: 20 }}>
    <a href={downloadUrl} download target="_blank" rel="noopener noreferrer">
      Download PDF
    </a>
    <div
      style={{
        border: '1px solid #ccc',
        borderRadius: 5,
        height: 700,
        overflowY: 'auto',
        marginTop: 10,
      }}
    >
      <iframe
        src={previewUrl}
        title="PDF Preview"
        style={{ width: '100%', height: '100%', border: 'none' }}
      />
    </div>
  </div>
)}
    </div>
  );
};

export default PastPapersPage;