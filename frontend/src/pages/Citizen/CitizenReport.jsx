import { useState } from 'react';
import axios from 'axios';
import "./CitizenReport.css";

const CitizenReport = () => {
  const [formData, setFormData] = useState({
    description: '',
    location_name: '',
    contact_name: '',
    contact_phone: '',
  });
  
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);
  const [location, setLocation] = useState({ lat: null, lng: null });
  const [gettingLocation, setGettingLocation] = useState(false);

  const getCurrentLocation = () => {
    setGettingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setGettingLocation(false);
        },
        (error) => {
          console.error('Geolocation error:', error);
          setError('Nuk mund të merret lokacioni juaj. Ju lutemi shkruani manualisht.');
          setGettingLocation(false);
        }
      );
    } else {
      setError('Shfletuesi juaj nuk mbështet lokacionin');
      setGettingLocation(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Ju lutemi zgjidhni një foto');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError('Fotoja duhet të jetë më e vogël se 10MB');
        return;
      }
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
      setError(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedFile || !formData.description) {
      setError('Ju lutemi plotësoni foton dhe përshkrimin');
      return;
    }

    setLoading(true);
    setError(null);
    
    const submitData = new FormData();
    submitData.append('description', formData.description);
    submitData.append('location_name', formData.location_name || 'I panjohur');
    submitData.append('location_lat', location.lat || 0);
    submitData.append('location_lng', location.lng || 0);
    submitData.append('file', selectedFile);
    // Kontakti opsional
    if (formData.contact_name) submitData.append('contact_name', formData.contact_name);
    if (formData.contact_phone) submitData.append('contact_phone', formData.contact_phone);

    try {
      const response = await axios.post(
        'http://localhost:8000/api/citizen/report',
        submitData,
        { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 30000 }
      );
      
      setSuccess({
        message: 'Raporti u dërgua me sukses!',
        report_id: response.data.id
      });
      
      // Reset form
      setSelectedFile(null);
      setPreview(null);
      setFormData({
        description: '',
        location_name: '',
        contact_name: '',
        contact_phone: '',
      });
      setLocation({ lat: null, lng: null });
      
      setTimeout(() => setSuccess(null), 5000);
      
    } catch (error) {
      console.error('Submit error:', error);
      setError('Raporti dështoi. Ju lutemi provoni përsëri.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="citizen-report-container">
      {/* Success Modal */}
      {success && (
        <div className="modal-overlay">
          <div className="modal-content success-modal">
            <div className="modal-icon">✅</div>
            <h3>Raporti u dërgua!</h3>
            <p>{success.message}</p>
            <p className="report-id">ID e raportit: #{success.report_id}</p>
            <button onClick={() => setSuccess(null)} className="modal-btn">
              Mbylle
            </button>
          </div>
        </div>
      )}

      <div className="report-card">
        <div className="card-header">
          <div className="header-icon">📝</div>
          <h2>Raporto Person të Dyshuar</h2>
          <p>Ndihmoni autoritetet duke raportuar çdo vëzhgim të dyshimtë</p>
        </div>

        <form onSubmit={handleSubmit} className="card-body">
          {/* Photo Upload */}
          <div className="form-group">
            <label>Foto e Personit <span className="required">*</span></label>
            <div className="upload-area" onClick={() => document.getElementById('report-file-input').click()}>
              <input
                type="file"
                id="report-file-input"
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: 'none' }}
                required
              />
              {preview ? (
                <div className="preview-container">
                  <img src={preview} alt="Preview" className="preview-image" />
                  <p className="change-photo-text">Kliko për të ndryshuar foton</p>
                </div>
              ) : (
                <div className="upload-placeholder">
                  <div className="upload-icon">📸</div>
                  <p>Kliko për të ngarkuar foton</p>
                  <small>JPEG, PNG, GIF (max 10MB)</small>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="form-group">
            <label>Përshkrimi <span className="required">*</span></label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="4"
              className="form-textarea"
              placeholder="Përshkruani personin: pamja fizike, veshjet, sjellja, drejtimi ku po shkonte, ora e vëzhgimit, etj."
              required
            />
          </div>

          {/* Location */}
          <div className="form-group">
            <label>Lokacioni</label>
            <div className="location-group">
              <input
                type="text"
                name="location_name"
                value={formData.location_name}
                onChange={handleChange}
                className="form-input"
                placeholder="Qyteti, rruga ose vendi"
              />
              <button
                type="button"
                onClick={getCurrentLocation}
                className="location-btn"
                disabled={gettingLocation}
              >
                {gettingLocation ? '📍...' : '📍 Përdor Lokacionin Tim'}
              </button>
            </div>
            {location.lat && location.lng && (
              <p className="location-success">
                ✓ Lokacioni i zbuluar: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
              </p>
            )}
          </div>

          {/* Contact Info (optional) */}
          <div className="form-group">
            <label>Informacioni i Kontaktit (Opsional)</label>
            <div className="contact-group">
              <input
                type="text"
                name="contact_name"
                value={formData.contact_name}
                onChange={handleChange}
                className="form-input"
                placeholder="Emri juaj"
              />
              <input
                type="tel"
                name="contact_phone"
                value={formData.contact_phone}
                onChange={handleChange}
                className="form-input"
                placeholder="Numri i telefonit"
              />
            </div>
            <p className="info-note">Të dhënat e kontaktit përdoren vetëm nëse autoritetet kanë nevojë për sqarime.</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="error-message">
              <span>⚠️</span>
              <p>{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !selectedFile || !formData.description}
            className="btn-submit"
          >
            {loading ? (
              <>
                <div className="spinner-small"></div>
                Duke dërguar raportin...
              </>
            ) : (
              <>
                📤 Dërgo Raportin te Autoritetet
              </>
            )}
          </button>

          {/* Info Note */}
          <div className="info-note">
            <p>📌 Raporti juaj do të shqyrtohet nga autoritetet. Mos dërgoni informacione të rreme.</p>
            <p className="emergency-note">Nëse është emergjencë, ju lutemi telefononi 112 menjëherë!</p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CitizenReport;