// frontend/src/pages/Dashboard.jsx
import { useEffect, useState } from 'react';
import { getAlerts } from '../services/alertsService';
import { getGallery } from '../services/galleryService';
import api from '../services/api';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler  // <--- Shto Filler këtu!
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';
import './Dashboard.css';

// Regjistro komponentët e Chart.js (përfshirë Filler)
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler  // <--- Regjistro Filler
);

export default function Dashboard() {
  const [stats, setStats] = useState({
    galleryCount: 0,
    missingCount: 0,
    wantedCount: 0,
    alertTotal: 0,
    alertUnreviewed: 0,
    searchCount: 0,
    avgSimilarity: 0,
    successRate: 0,
    searchesByDay: [],
    alertsByDay: []
  });
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Galeria
        const galleryRes = await getGallery();
        const galleryItems = galleryRes.data || [];
        const galleryCount = galleryItems.length;
        const missingCount = galleryItems.filter(p => p.status === 'missing').length;
        const wantedCount = galleryItems.filter(p => p.status === 'wanted').length;

        // Alertet
        const alertsRes = await getAlerts();
        const alerts = alertsRes.data || [];
        const alertTotal = alerts.length;
        const alertUnreviewed = alerts.filter(a => !a.reviewed).length;

        // Historiku i kërkimeve
        const historyRes = await api.get('/history/');
        const searches = historyRes.data || [];
        const searchCount = searches.length;

        // Llogarit saktësinë dhe kërkimet sipas ditëve
        let totalSimilarity = 0;
        let successfulSearches = 0;
        const searchesByDayMap = new Map();
        const alertsByDayMap = new Map();

        searches.forEach(search => {
          // Grupimi sipas ditës
          const date = new Date(search.created_at).toLocaleDateString();
          searchesByDayMap.set(date, (searchesByDayMap.get(date) || 0) + 1);
          
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

        // Grupimi i alarmeve sipas ditëve
        alerts.forEach(alert => {
          const date = new Date(alert.timestamp).toLocaleDateString();
          alertsByDayMap.set(date, (alertsByDayMap.get(date) || 0) + 1);
        });

        const avgSimilarity = successfulSearches > 0 ? (totalSimilarity / successfulSearches) * 100 : 0;
        const successRate = searchCount > 0 ? (successfulSearches / searchCount) * 100 : 0;

        // Konverto map-et në array për grafikët
        const searchesByDay = Array.from(searchesByDayMap.entries())
          .sort((a, b) => new Date(a[0]) - new Date(b[0]))
          .slice(-7);
          
        const alertsByDay = Array.from(alertsByDayMap.entries())
          .sort((a, b) => new Date(a[0]) - new Date(b[0]))
          .slice(-7);

        setStats({
          galleryCount,
          missingCount,
          wantedCount,
          alertTotal,
          alertUnreviewed,
          searchCount,
          avgSimilarity: avgSimilarity.toFixed(1),
          successRate: successRate.toFixed(1),
          searchesByDay,
          alertsByDay
        });
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    
    // Refresh çdo 30 sekonda
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Duke ngarkuar statistikat...</p>
      </div>
    );
  }

  // Config për grafikun e statusit (Pie)
  const statusChartData = {
    labels: ['Të zhdukur', 'Në kërkim'],
    datasets: [
      {
        data: [stats.missingCount, stats.wantedCount],
        backgroundColor: ['#f59e0b', '#ef4444'],
        borderColor: ['#ffffff', '#ffffff'],
        borderWidth: 2,
      },
    ],
  };

  // Config për grafikun e kërkimeve (Bar)
  const searchesChartData = {
    labels: stats.searchesByDay.map(item => item[0]),
    datasets: [
      {
        label: 'Kërkime',
        data: stats.searchesByDay.map(item => item[1]),
        backgroundColor: '#3b82f6',
        borderRadius: 8,
      },
    ],
  };

  // Config për grafikun e alarmeve (Line) - pa fill option problematic
  const alertsChartData = {
    labels: stats.alertsByDay.map(item => item[0]),
    datasets: [
      {
        label: 'Alarme',
        data: stats.alertsByDay.map(item => item[1]),
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 2,
        pointBackgroundColor: '#ef4444',
        pointBorderColor: '#ffffff',
        pointRadius: 4,
        pointHoverRadius: 6,
        // Remove fill: true or set it to false if you don't need it
        fill: false,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { color: '#e5e7eb' }
      },
      tooltip: {
        backgroundColor: '#1e293b',
        titleColor: '#f1f5f9',
        bodyColor: '#cbd5e1'
      }
    },
    scales: {
      y: {
        ticks: { color: '#9ca3af' },
        grid: { color: '#374151' }
      },
      x: {
        ticks: { color: '#9ca3af' },
        grid: { color: '#374151' }
      }
    }
  };

  return (
    <div className="dashboard">
      <h1 className="dashboard-title">📊 Përmbledhje e Sistemit</h1>

      {/* Kartat e statistikave */}
      <div className="dashboard-grid">
        <div className="card">
          <div className="card-icon">👥</div>
          <div>
            <p className="card-label">Persona gjithsej</p>
            <p className="card-value">{stats.galleryCount}</p>
            <p className="card-sub">
              🟠 Të zhdukur: {stats.missingCount} | 🔴 Në kërkim: {stats.wantedCount}
            </p>
          </div>
        </div>

        <div className="card">
          <div className="card-icon">🚨</div>
          <div>
            <p className="card-label">Alertet</p>
            <p className="card-value">{stats.alertTotal}</p>
            <p className="card-sub">
              ⏳ Të pa shqyrtuara: {stats.alertUnreviewed}
            </p>
          </div>
        </div>

        <div className="card">
          <div className="card-icon">🔍</div>
          <div>
            <p className="card-label">Kërkime të kryera</p>
            <p className="card-value">{stats.searchCount}</p>
          </div>
        </div>

        <div className="card">
          <div className="card-icon">🎯</div>
          <div>
            <p className="card-label">Saktësia mesatare</p>
            <p className="card-value">{stats.avgSimilarity}%</p>
            <p className="card-sub">(nga kërkimet me rezultat)</p>
          </div>
        </div>

        <div className="card">
          <div className="card-icon">✅</div>
          <div>
            <p className="card-label">Shkalla e suksesit</p>
            <p className="card-value">{stats.successRate}%</p>
            <p className="card-sub">(kërkime që gjetën një person)</p>
          </div>
        </div>
      </div>

      {/* Grafikët */}
      <div className="dashboard-charts">
        <div className="chart-card">
          <h3 className="chart-title">📊 Ndarja sipas statusit</h3>
          <div className="chart-container">
            <Pie data={statusChartData} options={chartOptions} />
          </div>
        </div>

        <div className="chart-card">
          <h3 className="chart-title">📈 Kërkimet (7 ditët e fundit)</h3>
          <div className="chart-container">
            <Bar data={searchesChartData} options={chartOptions} />
          </div>
        </div>

        <div className="chart-card full-width">
          <h3 className="chart-title">⚠️ Alarme të gjeneruara</h3>
          <div className="chart-container">
            <Line data={alertsChartData} options={chartOptions} />
          </div>
        </div>
      </div>
    </div>
  );
}