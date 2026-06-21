import { useState, useCallback } from 'react';
import axios from 'axios';
import './Reports.css';

const Reports = () => {
  const [reportType, setReportType] = useState('summary');
  const [period, setPeriod] = useState('monthly');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState(null);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('access_token');
      let endpoint;
      
      if (reportType === 'summary') {
        endpoint = `http://localhost:8000/api/reports/summary?period=${period}`;
      } else if (reportType === 'performance') {
        endpoint = 'http://localhost:8000/api/reports/performance';
      } else {
        endpoint = `http://localhost:8000/api/reports/person/${reportType}`;
      }
      
      const response = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReportData(response.data);
    } catch (err) {
      console.error('Error fetching report:', err);
      setError('Gabim gjatë ngarkimit të raportit');
    } finally {
      setLoading(false);
    }
  }, [reportType, period]);

  // Ngarko raportin në montimin e parë dhe kur ndryshojnë parametrat
  useState(() => {
    fetchReport();
  });

  // Për ndryshimet e reportType dhe period, thirrim fetchReport direkt
  const handleReportTypeChange = (value) => {
    setReportType(value);
    setTimeout(() => fetchReport(), 0);
  };

  const handlePeriodChange = (value) => {
    setPeriod(value);
    setTimeout(() => fetchReport(), 0);
  };

  const exportReport = async (format) => {
    setExporting(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(
        `http://localhost:8000/api/reports/export/${format}?report_type=${reportType}&period=${period}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob'
        }
      );
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `report_${reportType}_${period}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting report:', err);
      alert('Gabim gjatë eksportimit të raportit');
    } finally {
      setExporting(false);
    }
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('sq-AL').format(num);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('sq-AL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="reports-loading">
        <div className="gold-spinner"></div>
        <p>Duke gjeneruar raportin me AI...</p>
      </div>
    );
  }

  return (
    <div className="reports-page">
      <div className="reports-header">
        <div className="reports-title">
          <h1>🤖 Raporte të Gjeneruara nga AI</h1>
          <p>Analiza inteligjente dhe statistika të avancuara për sistemin</p>
        </div>
        
        <div className="reports-controls">
          <div className="control-group">
            <label>Lloji i raportit</label>
            <select 
              value={reportType} 
              onChange={(e) => handleReportTypeChange(e.target.value)}
              className="report-select"
            >
              <option value="summary">📊 Përmbledhje e Përgjithshme</option>
              <option value="performance">📈 Performanca e Sistemit</option>
            </select>
          </div>
          
          {reportType === 'summary' && (
            <div className="control-group">
              <label>Periudha</label>
              <select 
                value={period} 
                onChange={(e) => handlePeriodChange(e.target.value)}
                className="report-select"
              >
                <option value="daily">📅 Ditore</option>
                <option value="weekly">📆 Javore</option>
                <option value="monthly">📊 Mujore</option>
                <option value="yearly">📈 Vjetore</option>
              </select>
            </div>
          )}
          
          <div className="export-buttons">
            <button 
              className="export-btn pdf" 
              onClick={() => exportReport('pdf')}
              disabled={exporting}
            >
              📄 Eksporto PDF
            </button>
            <button 
              className="export-btn excel" 
              onClick={() => exportReport('excel')}
              disabled={exporting}
            >
              📊 Eksporto Excel
            </button>
          </div>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {reportData && (
        <div className="reports-content">
          {/* Header Info */}
          <div className="report-info">
            <div className="info-card">
              <div className="info-icon">📅</div>
              <div>
                <div className="info-label">Gjeneruar më</div>
                <div className="info-value">{formatDate(reportData.generated_at || new Date())}</div>
              </div>
            </div>
            <div className="info-card">
              <div className="info-icon">🕐</div>
              <div>
                <div className="info-label">Periudha</div>
                <div className="info-value">
                  {reportData.start_date ? formatDate(reportData.start_date) : 'N/A'} - {reportData.end_date ? formatDate(reportData.end_date) : 'N/A'}
                </div>
              </div>
            </div>
          </div>

          {/* Statistics Grid */}
          {reportData.statistics && (
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">👥</div>
                <div className="stat-content">
                  <div className="stat-value">{formatNumber(reportData.statistics.total_persons || 0)}</div>
                  <div className="stat-label">Persona Gjithsej</div>
                </div>
              </div>
              
              <div className="stat-card warning">
                <div className="stat-icon">🔴</div>
                <div className="stat-content">
                  <div className="stat-value">{formatNumber(reportData.statistics.missing_persons || 0)}</div>
                  <div className="stat-label">Të Zhdukur</div>
                </div>
              </div>
              
              <div className="stat-card success">
                <div className="stat-icon">✅</div>
                <div className="stat-content">
                  <div className="stat-value">{formatNumber(reportData.statistics.found_persons || 0)}</div>
                  <div className="stat-label">Të Gjetur</div>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon">📝</div>
                <div className="stat-content">
                  <div className="stat-value">{formatNumber(reportData.statistics.citizen_reports || 0)}</div>
                  <div className="stat-label">Raporte nga Qytetarët</div>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon">🚨</div>
                <div className="stat-content">
                  <div className="stat-value">{formatNumber(reportData.statistics.alerts || 0)}</div>
                  <div className="stat-label">Alarme</div>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon">📊</div>
                <div className="stat-content">
                  <div className="stat-value">{reportData.statistics.resolution_rate || 0}%</div>
                  <div className="stat-label">Shkalla e Zgjidhjes</div>
                </div>
              </div>
            </div>
          )}

          {/* AI Insights */}
          {reportData.insights && reportData.insights.length > 0 && (
            <div className="ai-insights">
              <h2>
                <span className="ai-icon">🤖</span>
                Analiza dhe Insights nga AI
              </h2>
              <div className="insights-list">
                {reportData.insights.map((insight, idx) => (
                  <div key={idx} className="insight-item">
                    <div className="insight-icon">💡</div>
                    <div className="insight-text">{insight}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {reportData.recommendations && reportData.recommendations.length > 0 && (
            <div className="recommendations">
              <h2>📋 Rekomandimet e Sistemit</h2>
              <div className="recommendations-list">
                {reportData.recommendations.map((rec, idx) => (
                  <div key={idx} className="recommendation-item">
                    <span className="rec-icon">🎯</span>
                    <span>{rec}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Trends Chart */}
          {reportData.trends && reportData.trends.length > 0 && (
            <div className="trends-section">
              <h2>📈 Trendet ditore</h2>
              <div className="trends-table">
                <table>
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Të zhdukur të rinj</th>
                      <th>Raporte</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.trends.slice(-14).reverse().map((trend, idx) => (
                      <tr key={idx}>
                        <td>{trend.date}</td>
                        <td>
                          <span className={`trend-value ${trend.new_missing > 0 ? 'increase' : 'neutral'}`}>
                            {trend.new_missing}
                          </span>
                        </td>
                        <td>
                          <span className={`trend-value ${trend.reports > 0 ? 'increase' : 'neutral'}`}>
                            {trend.reports}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Reports;