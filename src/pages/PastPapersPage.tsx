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

  // Enhanced file URL generation with multiple fallback strategies
  const getFileUrl = (paper: PastPaper) => {
    console.log('Getting file URL for paper:', paper._id, paper);
    
    // Method 1: New system - use fileId if available
    if (paper.file?._id) {
      const url = `${import.meta.env.VITE_API_BASE_URL}/api/past-papers/file?fileId=${paper.file._id}`;
      console.log('Using fileId URL:', url);
      return url;
    } 
    
    // Method 2: New system - use filePath from file object
    if (paper.file?.filePath) {
      const url = `${import.meta.env.VITE_API_BASE_URL}/api/past-papers/file?filePath=${encodeURIComponent(paper.file.filePath)}`;
      console.log('Using file.filePath URL:', url);
      return url;
    } 
    
    // Method 3: Legacy system - direct fileUrl
    if (paper.fileUrl) {
      const url = `${import.meta.env.VITE_API_BASE_URL}/api/past-papers/file?filePath=${encodeURIComponent(paper.fileUrl)}`;
      console.log('Using legacy fileUrl:', url);
      return url;
    }
    
    // Method 4: Try to construct from paper metadata (fallback)
    if (paper.subject?.name && paper.grade?.level && paper.year && paper.paperType) {
      // Try common filename patterns
      const patterns = [
        `${paper.subject.name}_Grade${paper.grade.level}_${paper.paperType.toUpperCase()}_${paper.year}.pdf`,
        `${paper.subject.name} ${paper.grade.level} ${paper.paperType.toUpperCase()} ${paper.year}.pdf`,
        `${paper.subject.name}_${paper.year}_${paper.paperType.toUpperCase()}.pdf`
      ];
      
      for (const pattern of patterns) {
        const url = `${import.meta.env.VITE_API_BASE_URL}/api/past-papers/file?filePath=${encodeURIComponent(pattern)}`;
        console.log('Trying constructed pattern:', url);
        // Return the first pattern - the backend will search for variations
        return url;
      }
    }
    
    console.log('No file URL could be determined for paper:', paper._id);
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
                  {paper.title || `${paper.subject?.name || 'Unknown Subject'} ${paper.paperType?.toUpperCase() || 'Unknown Paper'} ${paper.year || 'Unknown Year'}`}
                </h4>
                <p style={{ color: '#ccc', margin: '5px 0' }}>
                  Grade {paper.grade?.level || 'Unknown'} | {paper.subject?.name || 'Unknown Subject'} | {paper.year || 'Unknown Year'} | Paper {paper.paperType?.toUpperCase() || 'Unknown'}
                </p>
                <p style={{ color: '#ccc', fontSize: '0.9em' }}>
                  Downloaded {paper.downloadCount || 0} times
                </p>
                
                {/* Debug info in development */}
                {import.meta.env.DEV && (
                  <div style={{ color: '#888', fontSize: '0.8em', marginTop: 5 }}>
                    Debug: {JSON.stringify({
                      hasFile: !!paper.file,
                      hasFileId: !!paper.file?._id,
                      hasFilePath: !!paper.file?.filePath,
                      hasLegacyUrl: !!paper.fileUrl,
                      fileUrl: fileUrl
                    })}
                  </div>
                )}
                
                {fileUrl ? (
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
                    
                    {/* Test file accessibility */}
                    <a 
                      href={`${import.meta.env.VITE_API_BASE_URL}/api/debug/file-paths?${paper.file?._id ? `fileId=${paper.file._id}` : `filePath=${encodeURIComponent(paper.file?.filePath || paper.fileUrl || '')}`}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ 
                        color: '#ffa726', 
                        textDecoration: 'none',
                        marginRight: 15,
                        padding: '5px 10px',
                        border: '1px solid #ffa726',
                        borderRadius: 3,
                        fontSize: '0.8em'
                      }}
                    >
                      Debug File
                    </a>
                    
                    {/* PDF Preview with enhanced error handling */}
                    <div
                      style={{
                        border: '1px solid #ccc',
                        borderRadius: 5,
                        height: 400,
                        overflowY: 'auto',
                        marginTop: 10,
                        position: 'relative'
                      }}
                    >
                      <iframe
                        src={`${fileUrl}#toolbar=0&navpanes=0&scrollbar=1`}
                        title={`PDF Preview - ${paper.title || paper._id}`}
                        style={{ width: '100%', height: '100%', border: 'none' }}
                        onLoad={(e) => {
                          console.log('PDF iframe loaded successfully for:', paper._id);
                        }}
                        onError={(e) => {
                          console.error('PDF preview error for paper:', paper._id, e);
                          const iframe = e.target as HTMLIFrameElement;
                          const container = iframe.parentNode as HTMLElement;
                          
                          // Create error message
                          const errorDiv = document.createElement('div');
                          errorDiv.innerHTML = `
                            <div style="padding: 20px; text-align: center; color: #ff6b6b; background: rgba(0,0,0,0.1);">
                              <p><strong>PDF Preview Not Available</strong></p>
                              <p style="font-size: 0.9em;">File: ${paper.file?.originalName || paper.fileUrl || 'Unknown'}</p>
                              <p style="font-size: 0.8em;">Try downloading the file instead, or check the debug link above</p>
                              <a href="${fileUrl}" target="_blank" style="color: #4CAF50;">Open in New Tab</a>
                            </div>
                          `;
                          
                          iframe.style.display = 'none';
                          container.appendChild(errorDiv);
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  <div style={{ marginTop: 10, color: '#ff6b6b' }}>
                    <p><strong>File not available</strong></p>
                    <p style={{ fontSize: '0.9em' }}>
                      No valid file path found for this paper. 
                      {paper.file ? ' File object exists but path is invalid.' : ' No file object found.'}
                      {paper.fileUrl ? ` Legacy URL: ${paper.fileUrl}` : ' No legacy URL.'}
                    </p>
                    <p style={{ fontSize: '0.8em', color: '#888' }}>
                      Please contact support if this file should be available
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      
      {/* Debug panel for development */}
      {import.meta.env.DEV && (
        <div style={{ 
          position: 'fixed', 
          bottom: 10, 
          right: 10, 
          background: 'rgba(0,0,0,0.8)', 
          color: 'white', 
          padding: 10, 
          borderRadius: 5,
          fontSize: '0.8em',
          maxWidth: 300
        }}>
          <h4>Debug Info</h4>
          <p>Papers loaded: {pastPapers.length}</p>
          <p>Grades: {grades.length}</p>
          <p>Subjects: {subjects.length}</p>
          <a 
            href={`${import.meta.env.VITE_API_BASE_URL}/api/debug/list-files`} 
            target="_blank" 
            style={{color: '#4CAF50'}}
          >
            View All Files
          </a>
        </div>
      )}
    </div>
  );
};

export default PastPapersPage;