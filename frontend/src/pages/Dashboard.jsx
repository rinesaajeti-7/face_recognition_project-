import { useEffect, useState } from 'react';
import { getAlerts } from '../services/alertsService';
import { getGallery } from '../services/galleryService';
import api from '../services/api';
import './Dashboard.css';

export default function Dashboard() {
  const [stats, setStats] = useState({
    galleryCount: 0,
    alertTotal: 0,
    alertUnreviewed: 0,
    searchCount: 0,
    avgSimilarity: 0,
    successRate: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Galeria
        const galleryRes = await getGallery();
        const galleryCount = galleryRes.data.length;

        // Alertet
        const alertsRes = await getAlerts();
        const alerts = alertsRes.data || [];
        const alertTotal = alerts.length;
        const alertUnreviewed = alerts.filter(a => !a.reviewed).length;

        // Historiku i kërkimeve
        const historyRes = await api.get('/history/');
        const searches = historyRes.data || [];
        const searchCount = searches.length;

        // Llogarit saktësinë mesatare dhe shkallën e suksesit
        let totalSimilarity = 0;
        let successfulSearches = 0;
        searches.forEach(search => {
          try {
            const result = JSON.parse(search.result_json);
            if (result.matches && result.matches.length > 0) {
              successfulSearches++;
              const bestMatch = result.matches[0];
              if (bestMatch.similarity) {
                totalSimilarity += bestMatch.similarity;
              }
            }
          } catch (e) {
            console.error('Error parsing search result', e);
          }
        });

        const avgSimilarity = searchCount > 0 ? (totalSimilarity / searchCount) * 100 : 0;
        const successRate = searchCount > 0 ? (successfulSearches / searchCount) * 100 : 0;

        setStats({
          galleryCount,
          alertTotal,
          alertUnreviewed,
          searchCount,
          avgSimilarity: avgSimilarity.toFixed(1),
          successRate: successRate.toFixed(1),
        });
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="dashboard">
      <h1 className="dashboard-title">📊 Përmbledhje e Sistemit</h1>

      <div className="dashboard-grid">
        <div className="card">
          <p className="card-label">👥 Persona të kërkuar</p>
          <p className="card-value">{stats.galleryCount}</p>
        </div>

        <div className="card">
          <p className="card-label">🚨 Alertet (gjithsej)</p>
          <p className="card-value">{stats.alertTotal}</p>
        </div>

        <div className="card">
          <p className="card-label">⏳ Alerte të pa shqyrtuara</p>
          <p className="card-value">{stats.alertUnreviewed}</p>
        </div>

        <div className="card">
          <p className="card-label">🔍 Kërkime të kryera</p>
          <p className="card-value">{stats.searchCount}</p>
        </div>

        <div className="card">
          <p className="card-label">🎯 Saktësia mesatare</p>
          <p className="card-value">{stats.avgSimilarity}%</p>
          <p className="card-sub">(nga kërkimet me rezultat)</p>
        </div>

        <div className="card">
          <p className="card-label">✅ Shkalla e suksesit</p>
          <p className="card-value">{stats.successRate}%</p>
          <p className="card-sub">(kërkime që gjetën një person)</p>
        </div>
      </div>
    </div>
  );
}