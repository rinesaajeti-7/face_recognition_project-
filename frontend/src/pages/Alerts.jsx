import { useEffect, useState } from 'react';
import { getAlerts, reviewAlert, deleteAlert } from '../services/alertsService';
import './Alerts.css';

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [filterReviewed, setFilterReviewed] = useState('all');
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const fetchAlerts = async () => {
    try {
      const res = await getAlerts();
      setAlerts(res?.data || []);
    } catch (err) {
      console.error('Error fetching alerts:', err);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleReview = async (id) => {
    try {
      await reviewAlert(id);
      await fetchAlerts();
    } catch (err) {
      console.error('Error reviewing alert:', err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('A jeni i sigurt që doni ta fshini këtë alert?')) {
      try {
        await deleteAlert(id);
        await fetchAlerts();
      } catch (err) {
        console.error('Error deleting alert:', err);
      }
    }
  };

  const getSimilarityColor = (similarity) => {
    if (similarity >= 0.8) return 'high';
    if (similarity >= 0.6) return 'medium';
    return 'low';
  };

  const getSimilarityLabel = (similarity) => {
    if (similarity >= 0.8) return '⚠️ Shumë i lartë';
    if (similarity >= 0.6) return '🟡 Mesatar';
    return '🔵 I ulët';
  };

  const filteredAlerts = alerts.filter(alert => {
    if (filterReviewed === 'reviewed') return alert.reviewed === true;
    if (filterReviewed === 'unreviewed') return alert.reviewed === false;
    return true;
  });

  const unreviewedCount = alerts.filter(a => !a.reviewed).length;

  return (
    <div className="alerts-page">
      <div className="alerts-header">
        <h1 className="alerts-title">🚨 Alertet</h1>
        {unreviewedCount > 0 && (
          <span className="badge-unreviewed">{unreviewedCount} të pa shqyrtuara</span>
        )}
      </div>

      <div className="alerts-filters">
        <button className={`filter-btn ${filterReviewed === 'all' ? 'active' : ''}`} onClick={() => setFilterReviewed('all')}>Të gjitha</button>
        <button className={`filter-btn ${filterReviewed === 'unreviewed' ? 'active' : ''}`} onClick={() => setFilterReviewed('unreviewed')}>Të pa shqyrtuara</button>
        <button className={`filter-btn ${filterReviewed === 'reviewed' ? 'active' : ''}`} onClick={() => setFilterReviewed('reviewed')}>Të shqyrtuara</button>
      </div>

      <div className="alerts-list">
        {filteredAlerts.length === 0 ? (
          <p className="empty">✅ Nuk ka alerte për të shfaqur</p>
        ) : (
          filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`alert-card ${alert.reviewed ? 'reviewed' : 'unreviewed'} ${getSimilarityColor(alert.similarity)}`}
              onClick={() => { setSelectedAlert(alert); setShowModal(true); }}
            >
              <div className="alert-info">
                <p className="alert-name">{alert.person_name}</p>
                <p className="alert-time">🕒 {new Date(alert.timestamp).toLocaleString()}</p>
                <p className={`alert-similarity ${getSimilarityColor(alert.similarity)}`}>
                  {getSimilarityLabel(alert.similarity)} – {(alert.similarity * 100).toFixed(2)}%
                </p>
              </div>
              <div className="alert-actions">
                {!alert.reviewed && (
                  <button onClick={(e) => { e.stopPropagation(); handleReview(alert.id); }} className="btn-review">
                    ✅ Shëno të shqyrtuar
                  </button>
                )}
                <button onClick={(e) => { e.stopPropagation(); handleDelete(alert.id); }} className="btn-delete">
                  🗑️ Fshij
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && selectedAlert && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>🔍 Detajet e alertit</h2>
            <p><strong>Personi:</strong> {selectedAlert.person_name}</p>
            <p><strong>Ngjashmëria:</strong> {(selectedAlert.similarity * 100).toFixed(2)}%</p>
            <p><strong>Koha:</strong> {new Date(selectedAlert.timestamp).toLocaleString()}</p>
            <p><strong>Burimi:</strong> {selectedAlert.source || 'N/A'}</p>
            <p><strong>Statusi:</strong> {selectedAlert.reviewed ? '✅ I shqyrtuar' : '⏳ I pa shqyrtuar'}</p>
            <button className="btn-close" onClick={() => setShowModal(false)}>Mbyll</button>
          </div>
        </div>
      )}
    </div>
  );
}