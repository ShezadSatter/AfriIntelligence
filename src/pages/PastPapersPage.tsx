import React, { useState, useEffect } from 'react';
import styles from '../styles/PastPaperPage.module.css';

interface Grade {
  _id: string;
  level: number;
  description?: string;
}

interface Subject {
  _id: string;
  name: string;
  slug: string;
}

interface PastPaper {
  _id: string;
  subject: Subject;
  grade: Grade;
  year: number;
  paperType: string;
  title: string;
  file?: {
    _id: string;
    filePath: string;
    originalName: string;
  };
  fileUrl?: string; // Legacy support
  downloadCount: number;
}

const PastPapersPage: React.FC = () => {
  const [grade, setGrade] = useState('');
  const [subject, setSubject] = useState('');
  const [year, setYear] = useState('');
  const [paper, setPaper] = useState('');
  
  const [pastPapers, setPastPapers] = useState<PastPaper[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [grades, setGrades] = useState<Grade[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [years, setYears] = useState<number[]>([]);
  const papers = ['p1', 'p2'];

  // Load filter options
  useEffect(() => {
    const loadFilters = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/past-papers/filters`);
        if (!res.ok) throw new Error('Failed to load filters');
        
        const data = await res.json();
        console.log('Filters data:', data);
        
        setGrades(data.grades || []);
        setSubjects(data.subjects || []);
        setYears(data.years || []);
      } catch (err: any) {
        console.error('Filter loading error:', err);
        setError('Failed to load filter options');
      }
    };
    
    loadFilters();
  }, []);

  // Fetch papers when filters change
  useEffect(() => {
    if (grade || subject || year || paper) {
      fetchPapers();
    }
  }, [grade, subject, year, paper]);

  const fetchPapers = async () => {
    setLoading(true);
    setError(null);
    setPastPapers([]);

    try {
      const params = new URLSearchParams();
      
      // Find subject slug if subject is selected
      let subjectSlug = '';
      if (subject) {
        const selectedSubject = subjects.find(s => s._id === subject);
        if (selectedSubject) {
          subjectSlug = selectedSubject.slug;
          params.append('subject', subjectSlug);
        }
      }
      
      // Find grade level if grade is selected
      if (grade) {
        const selectedGrade = grades.find(g => g._id === grade);
        if (selectedGrade) {
          params.append('grade', selectedGrade.level.toString());
        }
      }
      
      if (year) params.append('year', year);
      if (paper) params.append('paperType', paper);

      console.log('Fetching with params:', params.toString());

      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/past-papers?${params.toString()}`);
      
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Server error (${res.status}): ${errorText}`);
      }

      const data = await res.json();
      console.log('Papers response:', data);
      
      setPastPapers(data.papers || []);
      
      if (!data.papers || data.papers.length === 0) {
        setError('No past papers found for the selected criteria');
      }
    } catch (err: any) {
      console.error('Fetch error:', err);
      setError(err.message || 'Failed to fetch past papers');
    } finally {
      setLoading(false);
    }
  };

  const getFileUrl = (paper: PastPaper) => {
  if (paper.file?.filePath) {
    // Use the filePath exactly as stored in the database
    return `${import.meta.env.VITE_API_BASE_URL}/api/past-papers/file?filePath=${encodeURIComponent(paper.file.filePath)}`;
  } else if (paper.fileUrl) {
    // Legacy support
    return `${import.meta.env.VITE_API_BASE_URL}/api/past-papers/file?filePath=${encodeURIComponent(paper.fileUrl)}`;
  }
  return null;
};

  const handleDownload = async (paper: PastPaper) => {
    try {
      // Record the download
      await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/past-papers/${paper._id}/download`, {
        method: 'POST',
      });
    } catch (err) {
      console.warn('Failed to record download:', err);
    }
  };

  return (
    <div className={styles.container}>
      <h1>Past Papers</h1>

      <div style={{ marginBottom: 10 }}>
        <label style={{ color: "white" }}>
          Grade:{' '}
          <select value={grade} onChange={e => setGrade(e.target.value)}>
            <option value="">Select Grade</option>
            {grades.map(g => (
              <option key={g._id} value={g._id}>
                Grade {g.level}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div style={{ marginBottom: 10 }}>
        <label style={{ color: "white" }}>
          Subject:{' '}
          <select value={subject} onChange={e => setSubject(e.target.value)}>
            <option value="">Select Subject</option>
            {subjects.map(s => (
              <option key={s._id} value={s._id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div style={{ marginBottom: 10 }}>
        <label style={{ color: "white" }}>
          Year:{' '}
          <select value={year} onChange={e => setYear(e.target.value)}>
            <option value="">Select Year</option>
            {years.map(y => (
              <option key={y} value={y.toString()}>
                {y}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div style={{ marginBottom: 10 }}>
        <label style={{ color: "white" }}>
          Paper:{' '}
          <select value={paper} onChange={e => setPaper(e.target.value)}>
            <option value="">Select Paper</option>
            {papers.map(p => (
              <option key={p} value={p}>
                {p.toUpperCase()}
              </option>
            ))}
          </select>
        </label>
      </div>

      {loading && <p style={{ color: 'white' }}>Loading...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {pastPapers.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <h3 style={{ color: 'white' }}>Available Papers:</h3>
          {pastPapers.map(paper => {
            const fileUrl = getFileUrl(paper);
            return (
              <div key={paper._id} style={{ 
                marginBottom: 15, 
                padding: 10, 
                border: '1px solid #ccc', 
                borderRadius: 5,
                backgroundColor: 'rgba(255,255,255,0.1)'
              }}>
                <h4 style={{ color: 'white', margin: 0 }}>
                  {paper.title || `${paper.subject.name} ${paper.paperType.toUpperCase()} ${paper.year}`}
                </h4>
                <p style={{ color: '#ccc', margin: '5px 0' }}>
                  Grade {paper.grade.level} | {paper.subject.name} | {paper.year} | Paper {paper.paperType.toUpperCase()}
                </p>
                <p style={{ color: '#ccc', fontSize: '0.9em' }}>
                  Downloaded {paper.downloadCount} times
                </p>
                
                {fileUrl && (
                  <div style={{ marginTop: 10 }}>
                    <a 
                      href={fileUrl} 
                      download 
                      target="_blank" 
                      rel="noopener noreferrer"
                      onClick={() => handleDownload(paper)}
                      style={{ 
                        color: '#4CAF50', 
                        textDecoration: 'none',
                        marginRight: 15,
                        padding: '5px 10px',
                        border: '1px solid #4CAF50',
                        borderRadius: 3
                      }}
                    >
                      Download PDF
                    </a>
                    
                    {/* PDF Preview */}
                    <div
                      style={{
                        border: '1px solid #ccc',
                        borderRadius: 5,
                        height: 400,
                        overflowY: 'auto',
                        marginTop: 10,
                      }}
                    >
                      <iframe
                        src={`${fileUrl}#toolbar=0`}
                        title={`PDF Preview - ${paper.title}`}
                        style={{ width: '100%', height: '100%', border: 'none' }}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PastPapersPage;