import { useState, useEffect } from 'react';
import { getPublicAlerts } from '../../services/alertsService';
import './CitizenPublicAlerts.css';

const CitizenPublicAlerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await getPublicAlerts();
        console.log('📢 Public alerts data:', res.data);
        setAlerts(res.data || []);
      } catch (err) {
        console.error('Gabim gjatë ngarkimit të shpalljeve:', err);
        setError('Nuk mund të ngarkohen shpalljet publike.');
      } finally {
        setLoading(false);
      }
    };
    fetchAlerts();
  }, []);

  if (loading) return <div className="loading-spinner">Duke ngarkuar...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="public-alerts-container">
      <h2>📢 Shpalljet Publike të Policisë</h2>
      {alerts.length === 0 && <p className="no-alerts">Nuk ka asnjë shpallje publike për momentin.</p>}
      <div className="alerts-grid">
        {alerts.map((alert) => {
          const hasImage = alert.image_path && alert.image_path.trim() !== '';
          
          // Përcakto URL-në e saktë të fotos
          let imageUrl = null;
          if (hasImage) {
            if (alert.image_path.startsWith('media/')) {
              // Foto nga galeria (rruga relative 'media/filename.jpg')
              imageUrl = `http://localhost:8000/${alert.image_path}`;
            } else {
              // Foto nga raportet e qytetarëve
              imageUrl = `http://localhost:8000/data/citizen_reports/${alert.image_path}`;
            }
          }
          
          console.log(`Alert image_path: ${alert.image_path} -> URL: ${imageUrl}`);

          return (
            <div key={alert.id} className="public-alert-card">
              {hasImage ? (
                <div className="alert-image">
                  <img
                    src={imageUrl}
                    alt={alert.title || 'Foto e shpalljes'}
                    onError={(e) => {
                      console.error(`Dështoi ngarkimi i fotos: ${imageUrl}`);
                      e.target.style.display = 'none';
                      const parent = e.target.parentElement;
                      if (parent) {
                        parent.innerHTML = '<div class="image-error">Fotografia nuk u ngarkua</div>';
                      }
                    }}
                  />
                </div>
              ) : (
                <div className="alert-image-placeholder">
                  <span>📷 Pa foto</span>
                </div>
              )}
              <div className="alert-content">
                <div className={`priority-tag ${alert.priority}`}>
                  {alert.priority === 'high'
                    ? '🔴 URGJENT'
                    : alert.priority === 'medium'
                    ? '🟠 E rëndësishme'
                    : '🔵 Informative'}
                </div>
                <h3>{alert.title || 'Shpallje pa titull'}</h3>
                <p className="alert-message">{alert.message || 'Nuk ka përshkrim'}</p>
                <div className="alert-meta">
                  <span className="alert-date">
                    📅 {new Date(alert.created_at).toLocaleString('sq-AL')}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CitizenPublicAlerts;