import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchImage } from '../services/searchService';
import { getAlerts } from '../services/alertsService';
import { analyzeAgeForProgression } from '../services/ageToolService'; // ✅ import i servisit
import LiveSearch from './SearchLive';
import './Search.css';

const getGoogleMapsLink = (locationText) => {
  if (!locationText || locationText.trim() === '') return null;
  const query = encodeURIComponent(locationText.trim());
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
};

export default function Search() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('upload');
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [alertsMap, setAlertsMap] = useState({});
  
  // ✅ Shtesë: state për analizën e moshës/gjinisë
  const [ageAnalysis, setAgeAnalysis] = useState(null);
  const [analyzingAge, setAnalyzingAge] = useState(false);
  const [ageError, setAgeError] = useState('');

  useEffect(() => {
    const loadAlerts = async () => {
      try {
        const res = await getAlerts();
        const map = {};
        if (res.data && Array.isArray(res.data)) {
          res.data.forEach(alert => {
            map[alert.person_id] = { reviewed: alert.reviewed };
          });
        }
        setAlertsMap(map);
      } catch (err) {
        console.error('Error loading alerts:', err);
      }
    };
    loadAlerts();
    const interval = setInterval(loadAlerts, 10000);
    return () => clearInterval(interval);
  }, []);

  // ✅ Funksioni që analizon moshën dhe gjininë nga foto
  const analyzeCurrentPhoto = async (photoFile) => {
    if (!photoFile) return;
    setAnalyzingAge(true);
    setAgeError('');
    setAgeAnalysis(null);
    try {
      const response = await analyzeAgeForProgression(photoFile);
      // Supozojmë që backend kthen diçka si: { age: 25, gender: "male", ... }
      const data = response.data;
      setAgeAnalysis({
        age: data.age,
        gender: data.gender === 'male' ? 'Mashkull' : 'Femër',
        rawGender: data.gender,
        probability: data.probability,
        faceDetected: data.face_detected ?? true
      });
    } catch (err) {
      console.error('Age analysis error:', err);
      setAgeError('Nuk mund të analizohej mosha/gjinia nga kjo foto.');
    } finally {
      setAnalyzingAge(false);
    }
  };

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    console.log('File selected:', selectedFile);
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
      setError('');
      // ✅ Fillo analizën e moshës/gjinisë menjëherë
      analyzeCurrentPhoto(selectedFile);
    }
  };

  const handleSearch = async () => {
    if (!file) {
      setError('Ju lutem zgjidhni një foto');
      return;
    }
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await searchImage(file);
      console.log('Search result:', res.data);
      setResult(res.data);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Ndodhi një gabim gjatë kërkimit');
    } finally {
      setLoading(false);
    }
  };

  const getAlertBadge = (personId) => {
    const alertInfo = alertsMap[personId];
    if (!alertInfo) return null;
    return alertInfo.reviewed 
      ? <span className="badge-alert reviewed">✅ Alert i shqyrtuar</span>
      : <span className="badge-alert unreviewed">⚠️ Alert i pa shqyrtuar</span>;
  };

  const goToGalleryItem = (personId) => {
    navigate('/gallery', { state: { highlightPersonId: personId } });
  };

  const clearFileInput = () => {
    setFile(null);
    setResult(null);
    setAgeAnalysis(null);
    setAgeError('');
    const fileInput = document.getElementById('search-file-input');
    if (fileInput) fileInput.value = '';
  };

  const openGoogleMaps = (location) => {
    if (!location) return;
    const url = getGoogleMapsLink(location);
    window.open(url, '_blank');
  };

  return (
    <div className="search-page">
      <h1 className="search-title">🔍 Kërkim i ri</h1>
      
      <div className="search-tabs">
        <button className={`tab-btn ${activeTab === 'upload' ? 'active' : ''}`} onClick={() => setActiveTab('upload')}>
          📸 Ngarko foto
        </button>
      </div>

      {activeTab === 'upload' && (
        <div className="upload-panel">
          <div className="upload-box">
            <input
              id="search-file-input"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="file-input-visible"
            />
            
            {file && (
              <div className="file-info">
                <p>✅ Foto e zgjedhur: <strong>{file.name}</strong></p>
                <img 
                  src={URL.createObjectURL(file)} 
                  alt="Preview" 
                  className="image-preview-small"
                />
                
                {/* ✅ Shfaq rezultatin e analizës së moshës/gjinisë */}
                {analyzingAge && <p className="info-message">🔄 Duke analizuar moshën dhe gjininë...</p>}
                {ageError && <p className="error-message-small">{ageError}</p>}
                {ageAnalysis && !analyzingAge && (
                  <div className="age-gender-analysis">
                    <h4>📊 Analiza automatike e fotos</h4>
                    <p><strong>👤 Gjinia e zbuluar: {ageAnalysis.gender}</strong></p>
                    <p><strong>📅 Mosha e përafërt: {ageAnalysis.age} vjeç</strong></p>
                    {ageAnalysis.probability && (
                      <p><strong>🎯 Siguria: {(ageAnalysis.probability * 100).toFixed(1)}%</strong></p>
                    )}
                  </div>
                )}
                
                <button onClick={clearFileInput} className="clear-btn">
                  ✖ Pastro foton
                </button>
              </div>
            )}
            
            <button 
              onClick={handleSearch} 
              disabled={loading || !file} 
              className="search-btn"
            >
              {loading ? '🔄 Duke analizuar...' : '🔍 Analizo foton'}
            </button>
            
            {error && <div className="error-message">{error}</div>}
            
            {/* REZULTATET E KËRKIMIT */}
            {result && (
              <>
                {!result.is_human ? (
                  <div className="non-human-message">
                    <p>😕 {result.message || 'Nuk u zbulua asnjë fytyrë njerëzore'}</p>
                    {result.detected_objects?.length > 0 && (
                      <p><strong>Objektet e zbuluara:</strong> {result.detected_objects.join(', ')}</p>
                    )}
                  </div>
                ) : (
                  <>
                    {/* Metadata mund të vijë nga backend-i i kërkimit, por ne preferojmë analizën tonë */}
                    {result.metadata && (result.metadata.gender || result.metadata.age) && !ageAnalysis && (
                      <div className="query-metadata">
                        <h4>🔍 Informacioni i fytyrës së analizuar (nga kërkimi)</h4>
                        {result.metadata.gender && <p><strong>👤 Gjinia: {result.metadata.gender}</strong></p>}
                        {result.metadata.age && <p><strong>📅 Mosha e përafërt:{result.metadata.age} vjeç</strong> </p>}
                        {result.metadata.denoising_used && <p><strong>🔧 Denoising: Aktiv</strong> </p>}
                      </div>
                    )}
                    
                    <div className="results-container">
                      <h3>🏷️ Rezultatet:</h3>
                      {result.matches?.length === 0 ? (
                        <p className="no-results">😕 Nuk u gjet asnjë person i ngjashëm.</p>
                      ) : (
                        result.matches?.map((match, idx) => (
                          <div key={idx} className="result-card">
                            <div>
                              <p>
                                <strong>👤 Emri:</strong>{' '}
                                <button
                                  onClick={() => goToGalleryItem(match.person_id)}
                                  className="person-name-link"
                                >
                                  {match.name}
                                </button>
                              </p>
                              <p><strong>📊 Ngjashmëria:</strong> {(match.similarity * 100).toFixed(2)}%</p>
                              <p><strong>🆔 ID:</strong> {match.person_id}</p>
                              {match.id_number && <p><strong>🪪 Leternjoftimi:</strong> {match.id_number}</p>}
                              {match.phone && <p><strong>📞 Telefoni:</strong> {match.phone}</p>}
                              
                              {match.residence_location && (
                                <p>
                                  <strong>🏠 Vendbanimi:</strong>{' '}
                                  <button
                                    onClick={() => openGoogleMaps(match.residence_location)}
                                    className="maps-link-btn"
                                  >
                                    {match.residence_location} 📍
                                  </button>
                                </p>
                              )}
                              
                              {match.photo_location && (
                                <p>
                                  <strong>📍 Lokacioni i fotos:</strong>{' '}
                                  <button
                                    onClick={() => openGoogleMaps(match.photo_location)}
                                    className="maps-link-btn"
                                  >
                                    {match.photo_location} 🗺️
                                  </button>
                                </p>
                              )}
                              
                              {match.station_added && <p><strong>🏢 Shtuar nga:</strong> {match.station_added}</p>}
                              {match.birth_date && <p><strong>🎂 Datëlindja:</strong> {match.birth_date}</p>}
                              {match.additional_info && <p><strong>📝 Të dhëna shtesë:</strong> {match.additional_info}</p>}
                              {getAlertBadge(match.person_id)}
                              
                              <button
                                onClick={() => goToGalleryItem(match.person_id)}
                                className="view-details-btn"
                              >
                                👁️ Shiko në Galeri
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}
      
      {activeTab === 'live' && <LiveSearch />}
    </div>
  );
}