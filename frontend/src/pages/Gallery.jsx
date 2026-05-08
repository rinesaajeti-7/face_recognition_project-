import { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { getGallery, createGalleryItem, deleteGalleryItem } from '../services/galleryService';
import { createManualAlert } from '../services/alertsService';
import './Gallery.css';

// Helper: krijon link Google Maps nga teksti i vendndodhjes
const getGoogleMapsLink = (locationText) => {
  if (!locationText || locationText.trim() === '') return null;
  const query = encodeURIComponent(locationText.trim());
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
};

export default function Gallery() {
  const location = useLocation();
  const [items, setItems] = useState([]);
  const [name, setName] = useState('');
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('missing');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [alertLoading, setAlertLoading] = useState({});
  
  // highlightedId llogaritet direkt nga location.state, jo si state i veçantë
  const highlightedId = location.state?.highlightPersonId || null;
  const hasScrolledRef = useRef(false);

  // State për të dhënat e reja
  const [idNumber, setIdNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [residenceLocation, setResidenceLocation] = useState('');
  const [photoLocation, setPhotoLocation] = useState('');
  const [stationAdded, setStationAdded] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');

  const fetchGallery = async () => {
    const res = await getGallery();
    setItems(res.data);
  };

  useEffect(() => {
    const load = async () => {
      const res = await getGallery();
      setItems(res.data);
    };
    load();
  }, []);

  // Efekt vetëm për skrolim dhe animacion - kjo është e pranueshme sepse
  // është ndërveprim me DOM-in (sistem i jashtëm)
  useEffect(() => {
    if (highlightedId && items.length > 0 && !hasScrolledRef.current) {
      hasScrolledRef.current = true;
      
      // Skrolo te kartela
      setTimeout(() => {
        const element = document.getElementById(`gallery-item-${highlightedId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.classList.add('highlight-pulse');
          setTimeout(() => {
            element.classList.remove('highlight-pulse');
          }, 2000);
        }
      }, 300);
      
      // Pastro state-in e lokacionit për të mos e theksuar përsëri në rifreskim
      window.history.replaceState({}, document.title);
    }
  }, [highlightedId, items]);

  const handleAdd = async () => {
    if (!name.trim()) return setError('Emri është obligativ');
    if (!file) return setError('Zgjidh foto');

    setLoading(true);

    const formData = new FormData();
    formData.append('name', name);
    formData.append('status', status);
    formData.append('description', description);
    formData.append('file', file);
    formData.append('id_number', idNumber);
    formData.append('phone', phone);
    formData.append('residence_location', residenceLocation);
    formData.append('photo_location', photoLocation);
    formData.append('station_added', stationAdded);
    formData.append('birth_date', birthDate);
    formData.append('additional_info', additionalInfo);

    await createGalleryItem(formData);

    // Pastro formularin
    setName('');
    setDescription('');
    setFile(null);
    setStatus('missing');
    setIdNumber('');
    setPhone('');
    setResidenceLocation('');
    setPhotoLocation('');
    setStationAdded('');
    setBirthDate('');
    setAdditionalInfo('');

    const fileInput = document.getElementById('file-input');
    if (fileInput) fileInput.value = '';

    fetchGallery();
    setLoading(false);
  };

  const handleCreateAlert = async (personId, personName) => {
    setAlertLoading(prev => ({ ...prev, [personId]: true }));
    try {
      await createManualAlert(personId);
      alert(`✅ Alerti për "${personName}" u shtua! Shko te faqja e Alerteve.`);
    } catch (err) {
      console.error(err);
      alert(`❌ Gabim gjatë shtimit të alertit për "${personName}".`);
    } finally {
      setAlertLoading(prev => ({ ...prev, [personId]: false }));
    }
  };

  return (
    <div className="gallery-page">
      <h1 className="title">Galeria</h1>
      {error && <div className="error">{error}</div>}

      <div className="form-box">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Emri"
        />
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Përshkrimi"
        />

        <input
          value={idNumber}
          onChange={(e) => setIdNumber(e.target.value)}
          placeholder="Numri i leternjoftimit"
        />
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Numri i telefonit"
        />
        <input
          value={residenceLocation}
          onChange={(e) => setResidenceLocation(e.target.value)}
          placeholder="Vendbanimi (p.sh. Tiranë, Shqipëri)"
        />
        <input
          value={photoLocation}
          onChange={(e) => setPhotoLocation(e.target.value)}
          placeholder="Lokacioni i fotos (p.sh. Sheshi Skënderbej)"
        />
        <input
          value={stationAdded}
          onChange={(e) => setStationAdded(e.target.value)}
          placeholder="Stacioni që e shtoi"
        />
        <input
          type="date"
          value={birthDate}
          onChange={(e) => setBirthDate(e.target.value)}
        />
        <textarea
          value={additionalInfo}
          onChange={(e) => setAdditionalInfo(e.target.value)}
          placeholder="Të dhëna të tjera"
          rows="2"
        />

        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="missing">I zhdukur</option>
          <option value="wanted">Në kërkim</option>
        </select>

        <input
          id="file-input"
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files[0])}
        />

        <button onClick={handleAdd} disabled={loading}>
          {loading ? 'Duke shtuar...' : 'Shto'}
        </button>
      </div>

      <div className="grid">
        {items.map((item) => (
          <div 
            key={item.id} 
            id={`gallery-item-${item.id}`}
            className={`card ${highlightedId === item.id ? 'highlighted' : ''}`}
          >
            <img
              src={`http://localhost:8000/media/${item.image_path?.split('/').pop() || ''}`}
              alt={item.name}
              className="img"
            />
            <div className="card-body">
              <h3>{item.name}</h3>
              <p>{item.description || 'Pa përshkrim'}</p>

              {item.id_number && (
                <p><strong>🆔 Leternjoftimi:</strong> {item.id_number}</p>
              )}
              {item.phone && (
                <p><strong>📞 Telefoni:</strong> {item.phone}</p>
              )}
              
              {item.residence_location && (
                <p>
                  <strong>🏠 Vendbanimi:</strong>{' '}
                  <a href={getGoogleMapsLink(item.residence_location)} target="_blank" rel="noopener noreferrer">
                    {item.residence_location} 📍
                  </a>
                </p>
              )}
              
              {item.photo_location && (
                <p>
                  <strong>📍 Lokacioni i fotos:</strong>{' '}
                  <a href={getGoogleMapsLink(item.photo_location)} target="_blank" rel="noopener noreferrer">
                    {item.photo_location} 🗺️
                  </a>
                </p>
              )}
              
              {item.station_added && (
                <p><strong>🏢 Shtuar nga:</strong> {item.station_added}</p>
              )}
              {item.birth_date && (
                <p><strong>🎂 Datëlindja:</strong> {item.birth_date}</p>
              )}
              {item.additional_info && (
                <p><strong>📝 Info shtesë:</strong> {item.additional_info}</p>
              )}

              <div className="cardbody">
                <span className={`status ${item.status}`}>
                  {item.status === 'missing' ? 'I zhdukur' : 'Në kërkim'}
                </span>
                <button
                  onClick={() => handleCreateAlert(item.id, item.name)}
                  disabled={alertLoading[item.id]}
                  className="btn-alert"
                >
                  {alertLoading[item.id] ? '⏳...' : '⚠️ Shto në alert'}
                </button>
                <button onClick={() => deleteGalleryItem(item.id)}>
                  Fshij
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}