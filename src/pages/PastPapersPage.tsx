import React, { useState, useEffect } from 'react';

type PaperResponse = {
  fileUrl: string;
};

const PastPapersPage: React.FC = () => {
  const [grade, setGrade] = useState('');
  const [subject, setSubject] = useState('');
  const [year, setYear] = useState('');
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Example options — customize as needed
  const grades = ['9', '10', '11', '12'];
  const subjects = ['Math', 'English', 'Science', 'History'];
  const years = ['2020', '2021', '2022', '2023'];

  const fetchPaper = async () => {
    if (!grade || !subject || !year) {
      setFileUrl(null);
      setError('Please select grade, subject, and year');
      return;
    }
    setLoading(true);
    setError(null);
    setFileUrl(null);

    try {
      const params = new URLSearchParams({ grade, subject, year });
      const res = await fetch(`/api/past-papers?${params.toString()}`);
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Error fetching paper');
      }
      const data: PaperResponse = await res.json();
      setFileUrl(data.fileUrl);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Optionally fetch on every change:
  useEffect(() => {
    if (grade && subject && year) {
      fetchPaper();
    }
  }, [grade, subject, year]);

  return (
    <div style={{ padding: 20 }}>
      <h1>Past Papers</h1>

      <div style={{ marginBottom: 10 }}>
        <label>
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
        <label>
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
        <label>
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

      {fileUrl && (
        <div>
          <a href={fileUrl} download target="_blank" rel="noopener noreferrer">
            Download PDF
          </a>
        </div>
      )}
    </div>
  );
};

export default PastPapersPage;
