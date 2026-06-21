import { useState, useRef, useEffect } from 'react';
import { analyzePhoto } from '../services/photoForensicsService';
import './PhotoForensics.css';

export default function PhotoForensics() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const objectUrlRef = useRef(null);

  // Funksioni për zgjedhjen e skedarit – setPreviewUrl bëhet këtu
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setSelectedFile(file);
    
    // Pastro URL-në e vjetër nëse ekziston
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
    }
    
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      objectUrlRef.current = url;
    } else {
      setPreviewUrl(null);
      objectUrlRef.current = null;
    }
  };

  // Efekti për pastrim kur komponenti unmount (pa setState)
  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, []);

  const handleAnalyze = async () => {
    if (!selectedFile) {
      setError('Ju lutem zgjidhni një foto');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const data = await analyzePhoto(selectedFile);
      console.log('✅ Analysis result:', data);
      setResult(data);
    } catch (err) {
      console.error('❌ Error:', err);
      setError(err.response?.data?.detail || 'Ndodhi një gabim gjatë analizës');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="photo-forensics-page">
      <div className="gold-accent-top"></div>
      
      <div className="page-header">
        <h1 className="page-title">
          <span className="gold-icon">🔍</span> 
          Photo Forensics Tool
          <span className="gold-line"></span>
        </h1>
        <p className="page-description">
          Advanced image authentication and manipulation detection system
        </p>
      </div>

      <div className="analyze-panel glass-effect">
        <div className="upload-area">
          <div className="upload-header">
            <div className="upload-icon">📷</div>
            <h3>Upload Image for Analysis</h3>
            <p>Supported formats: JPEG, PNG, JPG</p>
          </div>
          
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="file-input"
            id="file-input"
          />
          <label htmlFor="file-input" className="file-label">
            <span>Choose File</span>
          </label>
          
          {previewUrl && (
            <div className="file-preview">
              <img 
                src={previewUrl} 
                alt="Preview" 
                className="preview-image"
              />
              <div className="file-info">
                <span className="file-name">📄 {selectedFile?.name}</span>
                <span className="file-size">
                  {selectedFile ? (selectedFile.size / 1024).toFixed(2) : 0} KB
                </span>
              </div>
            </div>
          )}

          <button 
            onClick={handleAnalyze}
            disabled={loading || !selectedFile}
            className="analyze-btn"
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Analyzing...
              </>
            ) : (
              <>
                <span>🔬</span>
                Analyze Image
              </>
            )}
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        {result && (
          <div className="results-container">
            <div className="forensics-card">
              <div className="card-header">
                <h3>📊 Analysis Results</h3>
                <div className={`verdict-badge ${result.forensics?.is_manipulated ? 'manipulated' : 'authentic'}`}>
                  {result.forensics?.is_manipulated ? 'MANIPULATED' : 'AUTHENTIC'}
                </div>
              </div>
              
              <div className="manipulation-section">
                <div className={`manipulation-badge ${result.forensics?.is_manipulated ? 'suspicious' : 'clean'}`}>
                  {result.forensics?.is_manipulated ? (
                    <>⚠️ IMAGE SHOWS SIGNS OF MANIPULATION</>
                  ) : (
                    <>✅ NO MANIPULATION DETECTED</>
                  )}
                </div>
                
                {result.forensics?.confidence > 0 && (
                  <div className="confidence-section">
                    <div className="confidence-header">
                      <label>Confidence Level</label>
                      <span className="confidence-value">{(result.forensics.confidence * 100).toFixed(1)}%</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${result.forensics.confidence * 100}%` }}>
                        <div className="progress-glow"></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {result.forensics?.findings && result.forensics.findings.length > 0 && (
                <div className="findings-section">
                  <h4>
                    <span className="section-icon">🔍</span>
                    Detailed Findings
                  </h4>
                  <ul>
                    {result.forensics.findings.map((finding, idx) => (
                      <li key={idx} className={finding.includes('⚠️') ? 'warning' : 'success'}>
                        <span className="finding-icon">
                          {finding.includes('⚠️') ? '⚠️' : '✅'}
                        </span>
                        <span className="finding-text">{finding}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {result.faces_detected > 0 && (
                <div className="faces-section">
                  <h4>
                    <span className="section-icon">👤</span>
                    Face Detection Results
                  </h4>
                  <div className="faces-stats">
                    <div className="stat-card">
                      <div className="stat-value">{result.faces_detected}</div>
                      <div className="stat-label">Faces Detected</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-value">{result.matches_found || 0}</div>
                      <div className="stat-label">Database Matches</div>
                    </div>
                  </div>
                  
                  {result.matches && result.matches.length > 0 && (
                    <div className="matches-list">
                      <h5>Potential Matches in Database:</h5>
                      {result.matches.map((match, idx) => (
                        <div key={idx} className="match-item">
                          <div className="match-info">
                            <span className="match-name">{match.name}</span>
                            <span className="match-status">{match.status}</span>
                          </div>
                          <div className="match-similarity">
                            <div className="similarity-bar">
                              <div className="similarity-fill" style={{ width: match.similarity_percent }}></div>
                            </div>
                            <span className="similarity-value">{match.similarity_percent}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="metadata-section">
                <h4>
                  <span className="section-icon">📷</span>
                  Image Information
                </h4>
                <div className="metadata-grid">
                  <div className="metadata-item">
                    <span className="metadata-label">Filename:</span>
                    <span className="metadata-value">{result.filename}</span>
                  </div>
                  {result.dimensions && (
                    <div className="metadata-item">
                      <span className="metadata-label">Dimensions:</span>
                      <span className="metadata-value">{result.dimensions}</span>
                    </div>
                  )}
                  {result.file_size && (
                    <div className="metadata-item">
                      <span className="metadata-label">File Size:</span>
                      <span className="metadata-value">{result.file_size}</span>
                    </div>
                  )}
                  {result.file_type && (
                    <div className="metadata-item">
                      <span className="metadata-label">File Type:</span>
                      <span className="metadata-value">{result.file_type}</span>
                    </div>
                  )}
                  <div className="metadata-item">
                    <span className="metadata-label">Analysis Date:</span>
                    <span className="metadata-value">{new Date(result.analysis_date).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {result.recommendation && (
                <div className="recommendation">
                  <div className="recommendation-icon">💡</div>
                  <div className="recommendation-content">
                    <strong>Recommendation:</strong>
                    <p>{result.recommendation}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      <div className="gold-accent-bottom"></div>
    </div>
  );
}