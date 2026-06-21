import { useState, useEffect, useRef } from 'react';
import { 
  getAlerts, 
  reviewAlert, 
  unreviewAlert, 
  deleteAlert,
  createPublicAlert,
  saveAlertToGallery
} from '../services/alertsService';
import './Alerts.css';

const Alerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState({});
  const [filter, setFilter] = useState('all');
  
  // State për formularin e shpalljes publike
  const [showPublicForm, setShowPublicForm] = useState(false);
  const [publicTitle, setPublicTitle] = useState('');
  const [publicMessage, setPublicMessage] = useState('');
  const [publicPriority, setPublicPriority] = useState('high');
  const [creatingPublic, setCreatingPublic] = useState(false);
  
  const isFirstRender = useRef(true);

  // Funksioni për të marrë URL-në e saktë të fotos
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('media/')) {
      return `http://localhost:8000/${imagePath}`;
    }
    return `http://localhost:8000/data/citizen_reports/${imagePath}`;
  };

  // Ngarko alarmet
  const loadAlerts = () => {
    setLoading(true);
    setError(null);
    getAlerts()
      .then(response => {
        console.log('📋 Alerts response:', response.data);
        const alertsData = Array.isArray(response.data) ? response.data : [];
        setAlerts(alertsData);
        setLoading(false);
      })
      .catch(err => {
        console.error('❌ Error fetching alerts:', err);
        setError('Gabim gjatë ngarkimit të alarmeve');
        setLoading(false);
      });
  };

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      loadAlerts();
    }
  }, []);

  // Krijo shpallje publike nga formular
  const handleCreatePublicAlert = async () => {
    if (!publicTitle.trim() || !publicMessage.trim()) {
      window.alert('Ju lutemi plotësoni titullin dhe mesazhin');
      return;
    }
    setCreatingPublic(true);
    try {
      await createPublicAlert(publicTitle, publicMessage, publicPriority);
      window.alert('Shpallja publike u krijua me sukses!');
      setShowPublicForm(false);
      setPublicTitle('');
      setPublicMessage('');
      setPublicPriority('high');
      loadAlerts();
    } catch (err) {
      console.error('Error creating public alert:', err);
      window.alert('Gabim gjatë krijimit të shpalljes publike');
    } finally {
      setCreatingPublic(false);
    }
  };

  // Shëno të shqyrtuar
  const handleReview = async (id) => {
    setUpdating(prev => ({ ...prev, [id]: true }));
    try {
      await reviewAlert(id);
      setAlerts(prev => prev.map(alert => 
        alert.id === id ? { ...alert, reviewed: true } : alert
      ));
    } catch (err) {
      console.error('Error reviewing alert:', err);
      window.alert('Gabim gjatë shqyrtimit të alarmit');
    } finally {
      setUpdating(prev => ({ ...prev, [id]: false }));
    }
  };

  // Kthe në të pa shqyrtuar
  const handleUnreview = async (id) => {
    setUpdating(prev => ({ ...prev, [id]: true }));
    try {
      await unreviewAlert(id);
      setAlerts(prev => prev.map(alert => 
        alert.id === id ? { ...alert, reviewed: false } : alert
      ));
    } catch (err) {
      console.error('Error unreviewing alert:', err);
      window.alert('Gabim gjatë kthimit të alarmit');
    } finally {
      setUpdating(prev => ({ ...prev, [id]: false }));
    }
  };

  // Fshij alarmin
  const handleDelete = async (id) => {
    if (!window.confirm('A jeni i sigurt që doni ta fshini këtë alarm?')) return;
    setUpdating(prev => ({ ...prev, [id]: true }));
    try {
      await deleteAlert(id);
      setAlerts(prev => prev.filter(alert => alert.id !== id));
    } catch (err) {
      console.error('Error deleting alert:', err);
      window.alert('Gabim gjatë fshirjes së alarmit');
    } finally {
      setUpdating(prev => ({ ...prev, [id]: false }));
    }
  };

  // Ruaj në galeri (për raportet e qytetarëve)
  const handleSaveToGallery = async (id) => {
    setUpdating(prev => ({ ...prev, [id]: true }));
    try {
      await saveAlertToGallery(id);
      window.alert('Personi u ruajt me sukses në galeri!');
      setAlerts(prev => prev.map(alert => 
        alert.id === id ? { ...alert, reviewed: true } : alert
      ));
    } catch (err) {
      console.error('Error saving to gallery:', err);
      window.alert('Gabim gjatë ruajtjes në galeri');
    } finally {
      setUpdating(prev => ({ ...prev, [id]: false }));
    }
  };

  // Kthe alarmin në shpallje publike
  const handleMakePublic = async (alertItem) => {
    if (!window.confirm('Dëshironi ta bëni këtë alarm publik? Ai do të shihet nga të gjithë qytetarët.')) return;
    setUpdating(prev => ({ ...prev, [alertItem.id]: true }));
    try {
      await createPublicAlert(
        alertItem.title || 'Njoftim publik',
        alertItem.message || 'Nuk ka përshkrim',
        alertItem.priority || 'medium',
        alertItem.image_path || null
      );
      window.alert('Shpallja publike u krijua me sukses!');
      loadAlerts();
    } catch (err) {
      console.error('Error making alert public:', err);
      window.alert('Gabim gjatë krijimit të shpalljes publike');
    } finally {
      setUpdating(prev => ({ ...prev, [alertItem.id]: false }));
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleDateString('sq-AL', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'N/A';
    }
  };

  const getPriorityInfo = (priority) => {
    switch(priority) {
      case 'high':
        return { text: '🔴 I lartë', class: 'high' };
      case 'medium':
        return { text: '🟠 I mesëm', class: 'medium' };
      default:
        return { text: '🔵 I ulët', class: 'low' };
    }
  };

  const getFilteredAlerts = () => {
    if (filter === 'all') return alerts;
    if (filter === 'reviewed') return alerts.filter(alert => alert.reviewed === true);
    if (filter === 'unreviewed') return alerts.filter(alert => alert.reviewed === false);
    return alerts;
  };

  const filteredAlerts = getFilteredAlerts();
  const totalCount = alerts.length;
  const reviewedCount = alerts.filter(a => a.reviewed).length;
  const unreviewedCount = totalCount - reviewedCount;

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
  };

  if (loading) {
    return (
      <div className="alerts-loading">
        <div className="gold-spinner"></div>
        <p>Duke ngarkuar alarmet...</p>
      </div>
    );
  }

  return (
    <div className="alerts-page">
      <div className="alerts-header">
        <h1>🚨 Menaxhimi i Alarmeve</h1>
        <p>Shikoni dhe menaxhoni të gjitha alarmet e sistemit</p>
      </div>

      {error && (
        <div className="error-message">
          ❌ {error}
          <button onClick={loadAlerts} className="retry-btn">
            Provo përsëri
          </button>
        </div>
      )}

     

      {/* Formulari për shpallje publike */}
      {showPublicForm && (
        <div className="public-alert-form">
          <h3>Krijo njoftim për qytetarët</h3>
          <div className="form-group">
            <input
              type="text"
              placeholder="Titulli"
              value={publicTitle}
              onChange={(e) => setPublicTitle(e.target.value)}
              className="form-input"
            />
          </div>
          <div className="form-group">
            <textarea
              placeholder="Mesazhi (detajet e njoftimit)"
              value={publicMessage}
              onChange={(e) => setPublicMessage(e.target.value)}
              rows="3"
              className="form-textarea"
            />
          </div>
          <div className="form-group">
            <select
              value={publicPriority}
              onChange={(e) => setPublicPriority(e.target.value)}
              className="form-select"
            >
              <option value="high">🔴 Priorit i lartë</option>
              <option value="medium">🟠 Priorit i mesëm</option>
              <option value="low">🔵 Priorit i ulët</option>
            </select>
          </div>
          <div className="form-actions">
            <button 
              onClick={handleCreatePublicAlert} 
              disabled={creatingPublic}
              className="btn-submit-public"
            >
              {creatingPublic ? 'Duke krijuar...' : 'Publiko njoftimin'}
            </button>
            <button 
              onClick={() => setShowPublicForm(false)} 
              className="btn-cancel-public"
            >
              Anulo
            </button>
          </div>
        </div>
      )}

      <div className="alerts-stats">
        <div 
          className={`stat-card ${filter === 'all' ? 'active' : ''}`}
          onClick={() => handleFilterChange('all')}
        >
          <div className="stat-icon">🚨</div>
          <div className="stat-info">
            <div className="stat-value">{totalCount}</div>
            <div className="stat-label">Gjithsej alarme</div>
          </div>
        </div>
        <div 
          className={`stat-card ${filter === 'unreviewed' ? 'active' : ''}`}
          onClick={() => handleFilterChange('unreviewed')}
        >
          <div className="stat-icon">📋</div>
          <div className="stat-info">
            <div className="stat-value">{unreviewedCount}</div>
            <div className="stat-label">Të pa shqyrtuara</div>
          </div>
        </div>
        <div 
          className={`stat-card ${filter === 'reviewed' ? 'active' : ''}`}
          onClick={() => handleFilterChange('reviewed')}
        >
          <div className="stat-icon">✅</div>
          <div className="stat-info">
            <div className="stat-value">{reviewedCount}</div>
            <div className="stat-label">Të shqyrtuara</div>
          </div>
        </div>
      </div>

      <div className="alerts-list">
        {filteredAlerts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🔔</div>
            <h3>Nuk ka alarme</h3>
            <p>
              {filter !== 'all' 
                ? `Nuk ka alarme ${filter === 'reviewed' ? 'të shqyrtuara' : 'të pa shqyrtuara'} për momentin.`
                : 'Nuk ka asnjë alarm në sistem për momentin.'}
            </p>
            <div className="empty-actions">
              {filter !== 'all' && (
                <button onClick={() => handleFilterChange('all')} className="reload-btn">
                  🔄 Shfaq të gjitha
                </button>
              )}
              <button onClick={loadAlerts} className="reload-btn">
                🔄 Ringarko
              </button>
            </div>
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const priorityInfo = getPriorityInfo(alert.priority);
            const isUpdating = updating[alert.id];
            const hasImage = alert.image_path && alert.image_path.trim() !== '';
            const imageUrl = hasImage ? getImageUrl(alert.image_path) : null;

            return (
              <div key={alert.id} className={`alert-card ${alert.reviewed ? 'reviewed' : 'unreviewed'} ${alert.is_public ? 'public-alert' : ''}`}>
                <div className="alert-header">
                  <div className="alert-title">
                    <span className="alert-icon">{alert.is_public ? '📢' : '🚨'}</span>
                    <h3>{alert.title || (alert.is_public ? 'Njoftim Publik' : 'Alarm')}</h3>
                  </div>
                  <div className={`priority-badge ${priorityInfo.class}`}>
                    {priorityInfo.text}
                  </div>
                </div>
                
                <div className="alert-content">
                  <p className="alert-message">{alert.message || 'Nuk ka përshkrim'}</p>
                  
                  {hasImage && (
                    <div className="alert-image-section">
                      <img 
                        src={imageUrl} 
                        alt="Foto e raportuar" 
                        className="reported-image"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    </div>
                  )}
                  
                  <div className="alert-details">
                    <div className="detail-item">
                      <span className="detail-label">🕒 Data:</span>
                      <span className="detail-value">{formatDate(alert.created_at)}</span>
                    </div>
                    {alert.similarity !== undefined && alert.similarity !== null && (
                      <div className="detail-item">
                        <span className="detail-label">📊 Ngjashmëria:</span>
                        <span className="detail-value">{(alert.similarity * 100).toFixed(1)}%</span>
                      </div>
                    )}
                    <div className="detail-item">
                      <span className="detail-label">📋 Statusi:</span>
                      <span className={`status-badge ${alert.reviewed ? 'reviewed' : 'pending'}`}>
                        {alert.reviewed ? '✅ E shqyrtuar' : '⏳ Në pritje'}
                      </span>
                    </div>
                    {alert.is_public && (
                      <div className="detail-item">
                        <span className="detail-label">🌍 Lloji:</span>
                        <span className="public-badge">Shpallje publike</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="alert-actions">
                  {!alert.reviewed && (
                    <>
                      {hasImage && (
                        <button 
                          className="btn-save-gallery" 
                          onClick={() => handleSaveToGallery(alert.id)}
                          disabled={isUpdating}
                        >
                          {isUpdating ? '⏳ Duke ruajtur...' : '📸 Ruaj në Galeri'}
                        </button>
                      )}
                      <button 
                        className="btn-review" 
                        onClick={() => handleReview(alert.id)}
                        disabled={isUpdating}
                      >
                        {isUpdating ? '⏳ Duke shqyrtuar...' : '✅ Shëno të shqyrtuar'}
                      </button>
                    </>
                  )}
                  {alert.reviewed && (
                    <button 
                      className="btn-unreview" 
                      onClick={() => handleUnreview(alert.id)}
                      disabled={isUpdating}
                    >
                      {isUpdating ? '⏳ Duke ndryshuar...' : '🔄 Kthe në të pa shqyrtuar'}
                    </button>
                  )}
                  
                  {!alert.is_public && (
                    <button 
                      className="btn-make-public" 
                      onClick={() => handleMakePublic(alert)}
                      disabled={isUpdating}
                    >
                      {isUpdating ? '⏳ Duke krijuar...' : '📢 Shto Shpallje Publike'}
                    </button>
                  )}

                  <button 
                    className="btn-delete" 
                    onClick={() => handleDelete(alert.id)}
                    disabled={isUpdating}
                  >
                    {isUpdating ? '⏳ Duke fshirë...' : '🗑️ Fshij'}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Alerts;