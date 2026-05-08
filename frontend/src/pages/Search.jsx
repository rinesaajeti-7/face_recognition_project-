import { useState, useEffect } from 'react';
import { searchImage } from '../services/searchService';
import { getAlerts } from '../services/alertsService';
import LiveSearch from './SearchLive';
import './Search.css';

export default function Search() {
  const [activeTab, setActiveTab] = useState('upload');
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [alertsMap, setAlertsMap] = useState({});

  useEffect(() => {
    const loadAlerts = async () => {
      try {
        const res = await getAlerts();
        const map = {};
        res.data.forEach(alert => {
          map[alert.person_id] = { reviewed: alert.reviewed };
        });
        setAlertsMap(map);
      } catch (err) {
        console.error('Error loading alerts:', err);
      }
    };
    loadAlerts();
    const interval = setInterval(loadAlerts, 10000);
    return () => clearInterval(interval);
  }, []);

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
      console.log('Full search result:', res.data);
      if (res.data.matches && res.data.matches.length > 0) {
        console.log('First match details:', res.data.matches[0]);
      }
      setResult(res.data);
    } catch (err) {
      console.error(err);
      setError('Ndodhi një gabim');
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

  return (
    <div className="search-page">
      <h1 className="search-title">🔍 Kërkim i ri</h1>
      <div className="search-tabs">
        <button className={`tab-btn ${activeTab === 'upload' ? 'active' : ''}`} onClick={() => setActiveTab('upload')}>📸 Ngarko foto</button>
        <button className={`tab-btn ${activeTab === 'live' ? 'active' : ''}`} onClick={() => setActiveTab('live')}>🎥 Kamera live</button>
      </div>

      {activeTab === 'upload' && (
        <div className="upload-panel">
          <div className="upload-box">
            <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files[0])} className="file-input" />
            <button onClick={handleSearch} disabled={loading} className="search-btn">
              {loading ? '🔄 Duke analizuar...' : '🔍 Analizo foton'}
            </button>
            {error && <div className="error-message">{error}</div>}
            
            {result && (
              <>
                {!result.is_human ? (
                  <div className="non-human-message">
                    <p>😕 {result.message}</p>
                    {result.detected_objects?.length > 0 && <p><strong>Objektet e zbuluara:</strong> {result.detected_objects.join(', ')}</p>}
                  </div>
                ) : (
                  <>
                    {result.metadata && (
                      <div className="query-metadata">
                        <h4>🔍 Informacioni i fytyrës së analizuar</h4>
                        <p><strong>👤 Gjinia:</strong> {result.metadata.gender || '?'}</p>
                        <p><strong>📅 Mosha e përafërt:</strong> {result.metadata.age != null ? `${result.metadata.age} vjeç` : '?'}</p>
                      </div>
                    )}
                    <div className="results-container">
                      <h3>🏷️ Rezultatet:</h3>
                      {result.matches.length === 0 ? (
                        <p className="no-results">😕 Nuk u gjet asnjë person i ngjashëm.</p>
                      ) : (
                        result.matches.map((match, idx) => (
                          <div key={idx} className="result-card">
                            <div>
                              <p><strong>👤 Emri:</strong> {match.name}</p>
                              <p><strong>📊 Ngjashmëria:</strong> {(match.similarity * 100).toFixed(2)}%</p>
                              <p><strong>🆔 ID:</strong> {match.person_id}</p>
                              {match.id_number && <p><strong>🪪 Leternjoftimi:</strong> {match.id_number}</p>}
                              {match.phone && <p><strong>📞 Telefoni:</strong> {match.phone}</p>}
                              {match.residence_location && <p><strong>🏠 Vendbanimi:</strong> {match.residence_location}</p>}
                              {match.photo_location && <p><strong>📍 Lokacioni i fotos:</strong> {match.photo_location}</p>}
                              {match.station_added && <p><strong>🏢 Shtuar nga:</strong> {match.station_added}</p>}
                              {match.birth_date && <p><strong>🎂 Datëlindja:</strong> {match.birth_date}</p>}
                              {match.additional_info && <p><strong>📝 Të dhëna shtesë:</strong> {match.additional_info}</p>}
                              {getAlertBadge(match.person_id)}
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