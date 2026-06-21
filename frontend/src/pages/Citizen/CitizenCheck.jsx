import { useState } from 'react';
import axios from 'axios';
import './CitizenCheck.css';

const CitizenCheck = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) validateAndSetFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) validateAndSetFile(file);
  };

  const validateAndSetFile = (file) => {
    if (!file.type.startsWith('image/')) {
      setError('Ju lutemi zgjidhni një foto (JPEG, PNG, GIF)');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Fotoja duhet të jetë më e vogël se 10MB');
      return;
    }
    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
    setError(null);
    setResult(null);
  };

  const checkStatus = async () => {
    if (!selectedFile) {
      setError('Ju lutemi zgjidhni një foto');
      return;
    }

    setLoading(true);
    setError(null);
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await axios.post(
        'http://localhost:8000/api/citizen/compare-face-with-alerts',
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 60000
        }
      );
      setResult(response.data);
    } catch (error) {
      console.error('Error:', error);
      if (error.code === 'ECONNABORTED') {
        setError('Kërkesa zgjati shumë. Provoni me një foto më të qartë.');
      } else if (error.response) {
        setError(error.response.data.detail || 'Gabim gjatë përpunimit të fotos');
      } else {
        setError('Gabim në rrjet. Kontrolloni lidhjen.');
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
  };

  return (
    <div className="citizen-check-container">
      <div className="check-card">
        <div className="card-header">
          <div className="header-icon">🔍</div>
          <h2>Kontrollo nëse një person është i zhdukur ose në kërkim</h2>
          <p>Ngarko një foto për të kontrolluar nëse personi përputhet me ndonjë person të raportuar</p>
        </div>

        <div className="card-body">
          <div 
            className={`upload-area ${isDragging ? 'drag-over' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => document.getElementById('check-file-input').click()}
          >
            <input
              type="file"
              id="check-file-input"
              accept="image/jpeg,image/png,image/jpg,image/gif"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            {preview ? (
              <div className="preview-container">
                <img src={preview} alt="Preview" className="preview-image" />
                <p className="change-photo-text">Kliko për të ndryshuar foton</p>
              </div>
            ) : (
              <div className="upload-placeholder">
                <div className="upload-icon">📸</div>
                <p>Kliko ose hidhe foton këtu</p>
                <small>JPEG, PNG, GIF (max 10MB)</small>
              </div>
            )}
          </div>

          {error && (
            <div className="error-message">
              <span>⚠️</span>
              <p>{error}</p>
            </div>
          )}

          <div className="action-buttons">
            <button
              onClick={checkStatus}
              disabled={loading || !selectedFile}
              className="btn-check"
            >
              {loading ? (
                <>
                  <div className="spinner-small"></div>
                  Duke përpunuar...
                </>
              ) : (
                '🔍 Kontrollo Statusin'
              )}
            </button>
            {preview && (
              <button onClick={resetForm} className="btn-clear">
                🗑️ Pastro
              </button>
            )}
          </div>

          {result && (
            <div className={`result-card ${result.matches?.length > 0 ? 'missing' : 'safe'}`}>
              <div className="result-icon">
                {result.matches?.length > 0 ? '⚠️' : '✅'}
              </div>
              <div className="result-content">
                <h3>{result.matches?.length > 0 ? '⚠️ PERSON I RAPORTUAR!' : '✅ Personi nuk është i raportuar'}</h3>
                <p>{result.message}</p>
                {result.matches?.length > 0 && (
                  <div className="matches-list">
                    {result.matches.map((match, idx) => (
                      <div key={idx} className="match-card">
                        <div className="match-header">
                          <strong>{match.name}</strong>
                          <span className={`status-badge ${match.status}`}>
                            {match.status === 'missing' ? 'I ZHDUKUR' : 'NË KËRKIM'}
                          </span>
                        </div>
                        <div className="match-details">
                          <p><strong>📊 Ngjashmëria:</strong> {(match.similarity * 100).toFixed(1)}%</p>
                          {match.id_number && <p><strong>🪪 Letërnjoftimi:</strong> {match.id_number}</p>}
                          {match.residence_location && <p><strong>🏠 Vendbanimi:</strong> {match.residence_location}</p>}
                          {match.station_added && <p><strong>🏢 Raportuar nga:</strong> {match.station_added}</p>}
                          {match.birth_date && <p><strong>🎂 Datëlindja:</strong> {match.birth_date}</p>}
                          {match.additional_info && <p><strong>📝 Informacion shtesë:</strong> {match.additional_info}</p>}
                        </div>
                      </div>
                    ))}
                    <div className="emergency-contact">
                      <p>📞 Nëse keni informacion për këta persona, kontaktoni:</p>
                      <p className="emergency-numbers">☎️ Emergjenca: 112 | ☎️ Policia: 192</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="stats-section">
        <div className="stat-card">
          <div className="stat-icon">🕐</div>
          <div className="stat-info">
            <div className="stat-value">24/7</div>
            <div className="stat-label">Shërbim i vazhdueshëm</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🎯</div>
          <div className="stat-info">
            <div className="stat-value">98%</div>
            <div className="stat-label">Saktësi e njohjes</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⚡</div>
          <div className="stat-info">
            <div className="stat-value">&lt;5s</div>
            <div className="stat-label">Kohë përgjigjeje</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CitizenCheck;