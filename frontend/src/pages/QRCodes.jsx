import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './QRCodes.css';

const QRCodes = () => {
  const [persons, setPersons] = useState([]);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [qrCode, setQrCode] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const isFirstRender = useRef(true);

  // Funksioni për të marrë personat
  const loadPersons = () => {
    setLoading(true);
    const token = localStorage.getItem('access_token');
    
    axios.get('http://localhost:8000/api/gallery/', {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(response => {
      setPersons(response.data || []);
      setLoading(false);
    })
    .catch(err => {
      console.error('Error fetching persons:', err);
      setError('Gabim gjatë ngarkimit të personave');
      setLoading(false);
    });
  };

  // Ngarko personat vetëm në montimin e parë
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      loadPersons();
    }
  }, []);

  const generateQRCode = async (person) => {
    setSelectedPerson(person);
    setGenerating(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`http://localhost:8000/api/qrcodes/person/${person.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setQrCode(response.data);
    } catch (err) {
      console.error('Error generating QR code:', err);
      setError('Gabim gjatë gjenerimit të QR kodit');
    } finally {
      setGenerating(false);
    }
  };

  const downloadQRImage = async (personId) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`http://localhost:8000/api/qrcodes/person/${personId}/image`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `qr_person_${personId}.png`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading QR:', err);
      alert('Gabim gjatë shkarkimit të QR kodit');
    }
  };





  if (loading) {
    return (
      <div className="qrcodes-loading">
        <div className="gold-spinner"></div>
        <p>Duke ngarkuar personat...</p>
      </div>
    );
  }

  return (
    <div className="qrcodes-page">
      <div className="qrcodes-header">
        <h1>📱 QR Code për Personat e Zhdukur</h1>
        <p>Gjenero QR kode për të shpërndarë informacionin e personave të zhdukur</p>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="qrcodes-container">
        <div className="persons-list">
          <h2>📋 Personat në Sistem</h2>
          <div className="persons-grid">
            {persons.filter(p => p.status === 'missing' || p.status === 'wanted').map((person) => (
              <div 
                key={person.id} 
                className={`person-card ${selectedPerson?.id === person.id ? 'active' : ''}`}
                onClick={() => generateQRCode(person)}
              >
                <div className="person-avatar">
                  <img 
                    src={`http://localhost:8000/media/${person.image_path?.split('/').pop() || ''}`}
                    alt={person.name}
                    onError={(e) => { e.target.src = 'https://via.placeholder.com/60x60?text=No+Image'; }}
                  />
                </div>
                <div className="person-info">
                  <h3>{person.name}</h3>
                  <span className={`status-badge ${person.status}`}>
                    {person.status === 'missing' ? 'I zhdukur' : 'Në kërkim'}
                  </span>
                </div>
                <div className="person-action">
                  <button className="btn-generate">🔲 QR Code</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="qr-preview">
          <h2>📱 QR Code Preview</h2>
          
          {generating ? (
            <div className="qr-loading">
              <div className="small-spinner"></div>
              <p>Duke gjeneruar QR Code...</p>
            </div>
          ) : qrCode ? (
            <div className="qr-result">
              <div className="qr-image-container">
                <img 
                  src={`data:image/png;base64,${qrCode.qr_base64}`}
                  alt="QR Code"
                  className="qr-image"
                />
              </div>
              
              <div className="qr-info">
                <h3>{qrCode.person_name}</h3>
                <p><strong>ID:</strong> {qrCode.person_id}</p>
                <p><strong>Përmbajtja e QR:</strong> Informacion i koduar për personin</p>
              </div>
              
              <div className="qr-actions">
                <button className="btn-download" onClick={() => downloadQRImage(qrCode.person_id)}>
                  📥 Shkarko QR Code
                </button>
              
              </div>
              
              <div className="qr-instructions">
                <h4>📌 Si të përdoret:</h4>
                <ul>
                  <li>✅ Shkarko QR kodet dhe vendosi në posterë</li>
                  <li>✅ Qytetarët mund të skanojnë QR kodin për të parë informacionin</li>
                  <li>✅ Ndajeni në rrjetet sociale për të rritur ndërgjegjësimin</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="qr-placeholder">
              <div className="placeholder-icon">📱</div>
              <p>Zgjidhni një person nga lista për të gjeneruar QR Code</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QRCodes;