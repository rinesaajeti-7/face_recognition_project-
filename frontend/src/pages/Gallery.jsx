import { useEffect, useState, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { getGallery, createGalleryItem, deleteGalleryItem } from '../services/galleryService';
import { createManualAlert, createPublicAlert } from '../services/alertsService'; // shto createPublicAlert
import { printPersonToPDF } from '../services/pdfService';
import './Gallery.css';

export default function Gallery() {
  const location = useLocation();
  const [items, setItems] = useState([]);
  const [name, setName] = useState('');
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('missing');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [alertLoading, setAlertLoading] = useState({});
  const [publicLoading, setPublicLoading] = useState({}); // state për butonin e shpalljes publike
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [showModal, setShowModal] = useState(false);
  
  const highlightedId = location.state?.highlightPersonId || null;
  const fromMap = location.state?.fromMap || false;
  const personNameFromMap = location.state?.personName || null;
  const hasScrolledRef = useRef(false);
  const fileInputRef = useRef(null);
  const highlightTimerRef = useRef(null);
  const toastTimerRef = useRef(null);

  // State për formular
  const [idNumber, setIdNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [residenceLocation, setResidenceLocation] = useState('');
  const [photoLocation, setPhotoLocation] = useState('');
  const [stationAdded, setStationAdded] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');

  // Funksioni për ngarkimin e të dhënave
  const loadGallery = useCallback(async () => {
    try {
      const res = await getGallery();
      setItems(res.data);
    } catch (err) {
      console.error("Error fetching gallery:", err);
      setError('Gabim gjatë ngarkimit të galerisë');
    }
  }, []);

  // Ngarko të dhënat
  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      if (isMounted) {
        await loadGallery();
      }
    };
    fetchData();
    return () => {
      isMounted = false;
    };
  }, [loadGallery]);

  // Efekti për skrolim dhe theksim kur vjen nga harta
  useEffect(() => {
    if (highlightedId && items.length > 0 && !hasScrolledRef.current) {
      hasScrolledRef.current = true;
      
      if (fromMap && personNameFromMap) {
        console.log(`🔍 Duke theksuar personin: ${personNameFromMap} (ID: ${highlightedId})`);
      }
      
      const timer = setTimeout(() => {
        const element = document.getElementById(`gallery-item-${highlightedId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.classList.add('highlight-pulse');
          element.style.border = '3px solid #ffd700';
          element.style.boxShadow = '0 0 20px rgba(255, 215, 0, 0.5)';
          element.style.transform = 'scale(1.02)';
          
          if (highlightTimerRef.current) {
            clearTimeout(highlightTimerRef.current);
          }
          highlightTimerRef.current = setTimeout(() => {
            element.classList.remove('highlight-pulse');
            element.style.border = '';
            element.style.boxShadow = '';
            element.style.transform = '';
          }, 5000);
        }
      }, 500);
      
      window.history.replaceState({}, document.title);
      
      return () => {
        clearTimeout(timer);
        if (highlightTimerRef.current) {
          clearTimeout(highlightTimerRef.current);
        }
        if (toastTimerRef.current) {
          clearTimeout(toastTimerRef.current);
        }
      };
    }
  }, [highlightedId, items, fromMap, personNameFromMap]);

  const handleFileChange = (e) => {
    console.log('🔍 File selected!');
    const selectedFile = e.target.files[0];
    
    if (selectedFile) {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
      if (!validTypes.includes(selectedFile.type)) {
        setError('Formati i fotos nuk është i lejuar. Përdorni JPEG, PNG, WEBP ose GIF');
        setFile(null);
        e.target.value = '';
        return;
      }
      
      const maxSize = 10 * 1024 * 1024;
      if (selectedFile.size > maxSize) {
        setError('Fotoja është shumë e madhe. Madhësia maksimale është 10MB');
        setFile(null);
        e.target.value = '';
        return;
      }
      
      setFile(selectedFile);
      setError('');
      console.log('✅ File set:', selectedFile.name);
    }
  };

  const handleAdd = async () => {
    if (!name.trim()) {
      setError('Emri është obligativ');
      return;
    }
    if (!file) {
      setError('Zgjidh një foto');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

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

    try {
      await createGalleryItem(formData);

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
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      setSuccess('Personi u shtua me sukses!');
      setTimeout(() => setSuccess(''), 3000);
      
      await loadGallery();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Ndodhi një gabim gjatë shtimit të personit');
    } finally {
      setLoading(false);
    }
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

  // Funksioni për të krijuar shpallje publike direkt nga galeria
  const handleMakePublicFromGallery = async (person) => {
    if (!window.confirm(`Dëshironi ta bëni publik personin "${person.name}"? Ky njoftim do të shihet nga të gjithë qytetarët.`)) return;
    setPublicLoading(prev => ({ ...prev, [person.id]: true }));
    try {
      // Përgatit image_path: ruajmë të njëjtën rrugë që përdoret për shfaqjen e fotos
      // Në galeri, image_path ruhet si "media/filename.jpg" ose thjesht emri i skedarit.
      // Për t'u siguruar që fotoja shfaqet te qytetarët, do të dërgojmë rrugën relative.
      let imagePath = person.image_path || null;
      if (imagePath && !imagePath.startsWith('media/') && !imagePath.startsWith('data/')) {
        // Nëse është vetëm emri skedar, shtojmë "media/" para
        imagePath = `media/${imagePath}`;
      }
      
      await createPublicAlert(
        person.name,                           // titulli = emri i personit
        person.description || 'Nuk ka përshkrim', // mesazhi = përshkrimi
        'medium',                              // prioritet i mesëm (mund ta ndryshoni)
        imagePath                              // rruga e fotos
      );
      alert(`✅ Shpallja publike për "${person.name}" u krijua! Qytetarët do ta shohin në portal.`);
    } catch (err) {
      console.error('Error creating public alert from gallery:', err);
      alert(`❌ Gabim gjatë krijimit të shpalljes publike për "${person.name}".`);
    } finally {
      setPublicLoading(prev => ({ ...prev, [person.id]: false }));
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('A jeni i sigurt që doni ta fshini këtë person?')) {
      try {
        await deleteGalleryItem(id);
        await loadGallery();
      } catch (err) {
        console.error(err);
        alert('Gabim gjatë fshirjes së personit');
      }
    }
  };

  const handlePrintPDF = async (person) => {
    const imageUrl = `http://localhost:8000/media/${person.image_path?.split('/').pop() || ''}`;
    await printPersonToPDF(person, imageUrl);
  };

  const openModal = (person) => {
    setSelectedPerson(person);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedPerson(null);
  };

  const previewUrl = file ? URL.createObjectURL(file) : null;

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return (
    <div className="gallery-page">
      <h1 className="gallery-title" style={{ marginTop: '1rem', paddingTop: '0' }}>🖼️ Galeria e Personave</h1>
      
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="gallery-add-form">
        <h2 className="form-title">➕ Shto Person të Ri</h2>
        
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="name">EMRI *</label>
            <input
              id="name"
              className="gallery-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Emri i plotë"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="idNumber">NUMRI I LETERNJOFTIMIT</label>
            <input
              id="idNumber"
              className="gallery-input"
              value={idNumber}
              onChange={(e) => setIdNumber(e.target.value)}
              placeholder="Numri i leternjoftimit"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="phone">TELEFONI</label>
            <input
              id="phone"
              className="gallery-input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Numri i telefonit"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="residenceLocation">VENDBANIMI</label>
            <input
              id="residenceLocation"
              className="gallery-input"
              value={residenceLocation}
              onChange={(e) => setResidenceLocation(e.target.value)}
              placeholder="Vendbanimi (p.sh. Prishtinë)"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="photoLocation">LOKACIONI I FOTOS</label>
            <input
              id="photoLocation"
              className="gallery-input"
              value={photoLocation}
              onChange={(e) => setPhotoLocation(e.target.value)}
              placeholder="Ku është bërë fotoja"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="stationAdded">STACIONI SHTUES</label>
            <input
              id="stationAdded"
              className="gallery-input"
              value={stationAdded}
              onChange={(e) => setStationAdded(e.target.value)}
              placeholder="Stacioni policor"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="birthDate">DATËLINDJA</label>
            <input
              id="birthDate"
              className="gallery-input"
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="statusSelect">STATUSI</label>
            <select 
              id="statusSelect"
              className="gallery-select" 
              value={status} 
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="missing">I zhdukur</option>
              <option value="wanted">Në kërkim</option>
            </select>
          </div>
          
          <div className="form-group full-width">
            <label style={{ color: '#f1f5f9', marginBottom: '8px', display: 'block' }}>FOTO *</label>
            <input
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
              onChange={handleFileChange}
              ref={fileInputRef}
              style={{
                display: 'block',
                width: '100%',
                padding: '14px',
                backgroundColor: '#1e293b',
                border: '2px solid #3b82f6',
                borderRadius: '8px',
                color: '#f1f5f9',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            />
            
            {previewUrl && (
              <div className="image-preview-container">
                <img src={previewUrl} alt="Preview" className="image-preview" />
                <button 
                  type="button" 
                  className="remove-preview-btn"
                  onClick={() => {
                    setFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                >
                  ✖ Fshije foton
                </button>
              </div>
            )}
          </div>
          
          <div className="form-group">
            <label htmlFor="description">PËRSHKRIMI</label>
            <textarea
              id="description"
              className="gallery-textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Përshkrimi i personit"
              rows="3"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="additionalInfo">TË DHËNA SHTESË</label>
            <textarea
              id="additionalInfo"
              className="gallery-textarea"
              value={additionalInfo}
              onChange={(e) => setAdditionalInfo(e.target.value)}
              placeholder="Të dhëna të tjera"
              rows="3"
            />
          </div>
        </div>
        
        <button className="btn-add" onClick={handleAdd} disabled={loading}>
          {loading ? '🔄 Duke shtuar...' : '+ Shto Person'}
        </button>
      </div>

      <div className="gallery-grid">
        {items.length === 0 ? (
          <div className="empty-gallery">
            <p>📭 Nuk ka asnjë person në galeri.</p>
            <p>Shtoni personin e parë duke përdorur formularin e mësipërm.</p>
          </div>
        ) : (
          items.map((item) => (
            <div 
              key={item.id} 
              id={`gallery-item-${item.id}`}
              className={`gallery-card ${highlightedId === item.id ? 'highlighted' : ''}`}
              onClick={() => openModal(item)}
            >
              <div className="card-image">
                <img
                  src={`http://localhost:8000/media/${item.image_path?.split('/').pop() || ''}`}
                  alt={item.name}
                  className="card-img"
                  onError={(e) => { e.target.src = 'https://via.placeholder.com/300x240?text=Pa+Foto'; }}
                />
                <span className={`card-status-badge ${item.status}`}>
                  {item.status === 'missing' ? 'I ZHDUKUR' : 'NË KËRKIM'}
                </span>
              </div>
              
              <div className="card-content">
                <div className="card-header">
                  <h3 className="card-name">{item.name}</h3>
                </div>
                
                <p className="card-description">{item.description || 'Pa përshkrim'}</p>
                
                <div className="card-info">
                  {item.id_number && <span className="info-chip">🆔 {item.id_number}</span>}
                  {item.phone && <span className="info-chip">📞 {item.phone}</span>}
                  {item.residence_location && <span className="info-chip">🏠 {item.residence_location}</span>}
                </div>
                
                <div className="card-actions">
                  <button 
                    className="btn-details" 
                    onClick={(e) => { e.stopPropagation(); openModal(item); }}
                  >
                    👁️ Detajet
                  </button>
                  <button
                    className="btn-alert"
                    onClick={(e) => { e.stopPropagation(); handleCreateAlert(item.id, item.name); }}
                    disabled={alertLoading[item.id]}
                  >
                    {alertLoading[item.id] ? '⏳...' : '⚠️ Alert'}
                  </button>
                  <button 
                    className="btn-delete" 
                    onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                  >
                    🗑️ Fshij
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && selectedPerson && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedPerson.name}</h2>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>
            
            <div className="modal-body">
              <img
                src={`http://localhost:8000/media/${selectedPerson.image_path?.split('/').pop() || ''}`}
                alt={selectedPerson.name}
                className="modal-image"
                onError={(e) => { e.target.src = 'https://via.placeholder.com/600x300?text=Pa+Foto'; }}
              />
              
              <div className="modal-info-grid">
                <div className="modal-info-item">
                  <label>🆔 LETERNJOFTIMI</label>
                  <p>{selectedPerson.id_number || 'N/A'}</p>
                </div>
                
                <div className="modal-info-item">
                  <label>📞 TELEFONI</label>
                  <p>{selectedPerson.phone || 'N/A'}</p>
                </div>
                
                <div className="modal-info-item">
                  <label>🏠 VEND BANIMI</label>
                  <p>
                    {selectedPerson.residence_location ? (
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedPerson.residence_location)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="maps-link"
                      >
                        📍 {selectedPerson.residence_location}
                      </a>
                    ) : 'N/A'}
                  </p>
                </div>

                <div className="modal-info-item">
                  <label>📍 LOKACIONI I FOTOS</label>
                  <p>
                    {selectedPerson.photo_location ? (
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedPerson.photo_location)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="maps-link"
                      >
                        🗺️ {selectedPerson.photo_location}
                      </a>
                    ) : 'N/A'}
                  </p>
                </div>

                <div className="modal-info-item">
                  <label>🏢 STACIONI SHTUES</label>
                  <p>{selectedPerson.station_added || 'N/A'}</p>
                </div>
                
                <div className="modal-info-item">
                  <label>🎂 DATËLINDJA</label>
                  <p>{selectedPerson.birth_date || 'N/A'}</p>
                </div>
                
                <div className="modal-info-item">
                  <label>📊 STATUSI</label>
                  <p>
                    <span className={`status-badge ${selectedPerson.status}`}>
                      {selectedPerson.status === 'missing' ? 'I ZHDUKUR' : 'NË KËRKIM'}
                    </span>
                  </p>
                </div>
                
                <div className="modal-info-item full-width">
                  <label>📝 PËRSHKRIMI</label>
                  <p>{selectedPerson.description || 'N/A'}</p>
                </div>
                
                <div className="modal-info-item full-width">
                  <label>📝 TË DHËNA SHTESË</label>
                  <p>{selectedPerson.additional_info || 'N/A'}</p>
                </div>
              </div>
              
              <div className="modal-actions">
                <button
                  className="modal-btn-print"
                  onClick={() => handlePrintPDF(selectedPerson)}
                >
                  🖨️ Printo PDF
                </button>
                <button
                  className="modal-btn-alert"
                  onClick={() => {
                    handleCreateAlert(selectedPerson.id, selectedPerson.name);
                    closeModal();
                  }}
                  disabled={alertLoading[selectedPerson.id]}
                >
                  {alertLoading[selectedPerson.id] ? '⏳ Duke shtuar...' : '⚠️ Shto në Alert'}
                </button>
                {/* BUTONI I RI: SHPALLJE PUBLIKE */}
                <button
                  className="modal-btn-public"
                  onClick={() => handleMakePublicFromGallery(selectedPerson)}
                  disabled={publicLoading[selectedPerson.id]}
                >
                  {publicLoading[selectedPerson.id] ? '⏳ Duke krijuar...' : '📢 Shpallje Publike'}
                </button>
                <button className="modal-btn-close" onClick={closeModal}>
                  Mbyll
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}