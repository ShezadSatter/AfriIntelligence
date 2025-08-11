import React, { useState, useEffect } from 'react';

const PastPapersPage: React.FC = () => {
  const [grade, setGrade] = useState('');
  const [subject, setSubject] = useState('');
  const [year, setYear] = useState('');
  const [filePath, setFilePath] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const grades = ['9', '10', '11', '12'];
  const subjects = ['Math', 'Economics', 'Life-Science'];
  const years = ['2014','2015','2016','2017','2020', '2021', '2022', '2023'];

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
        const text = await res.text();
        console.error('Expected JSON but got:', text);
        throw new Error('Unexpected response format from server.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch past paper');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (grade && subject && year) {
      fetchPaper();
    }
  }, [grade, subject, year]);

  // Build download and preview URLs using backend route
const downloadUrl = filePath
  ? `${import.meta.env.VITE_API_BASE_URL}/api/past-papers/file?filePath=${encodeURIComponent(filePath)}`
  : null;

const previewUrl = filePath
  ? `${import.meta.env.VITE_API_BASE_URL}/api/past-papers/file?filePath=${encodeURIComponent(filePath)}&preview=true`
  : null;

  return (
    <div style={{ padding: 20 }}>
      <h1 style={{color: "white"}}>Past Papers</h1>

      <div style={{ marginBottom: 10 }}>
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