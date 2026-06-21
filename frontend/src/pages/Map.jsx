import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Map.css';

// Fix Leaflet icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom marker icons
const missingIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const reportIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const ChangeView = ({ center, zoom }) => {
  const map = useMap();
  map.setView(center, zoom);
  return null;
};

const Map = () => {
  const navigate = useNavigate();
  const [heatmapData, setHeatmapData] = useState([]);
  const [reports, setReports] = useState([]);
  const [missingPersons, setMissingPersons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('all');
  const [hoveredItem, setHoveredItem] = useState(null);
  const [center] = useState([42.602636, 20.902977]);
  const [zoom] = useState(8);

  const fetchMapData = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const headers = { Authorization: `Bearer ${token}` };
      
      const [heatmapRes, reportsRes, missingRes] = await Promise.all([
        axios.get('http://localhost:8000/api/map/heatmap', { headers }),
        axios.get('http://localhost:8000/api/map/reports?days=365', { headers }),
        axios.get('http://localhost:8000/api/map/missing', { headers })
      ]);
      
      setHeatmapData(heatmapRes.data.heatmap_points || []);
      setReports(reportsRes.data || []);
      setMissingPersons(missingRes.data || []);
    } catch (error) {
      console.error('Error fetching map data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchMapData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getFilteredData = () => {
    if (selectedType === 'reports') return reports;
    if (selectedType === 'missing') return missingPersons;
    return [...reports, ...missingPersons];
  };

  // Funksioni për të shkuar te galeria me ID specifike dhe theksimin e personit
// Funksioni për të shkuar te galeria me ID specifike dhe theksimin e personit
const goToPersonDetails = (personId, personName) => {
  if (personId) {
    console.log(`🔍 Navigating to gallery and highlighting person ID: ${personId}, Name: ${personName}`);
    // Navigo te gallery me state që tregon se cili person duhet theksuar
    navigate('/gallery', { 
      state: { 
        highlightPersonId: personId,
        fromMap: true,
        personName: personName
      }
    });
  }
};

  // Funksioni për të shkuar te raporti
  const goToReport = (reportId) => {
    if (reportId) {
      navigate(`/alerts?report=${reportId}`);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('sq-AL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="map-loading">
        <div className="gold-spinner"></div>
        <p>Duke ngarkuar hartën...</p>
      </div>
    );
  }

  const filteredData = getFilteredData();

  return (
    <div className="map-page">
      <div className="map-header">
        <div className="map-title">
          <h1>🗺️ Harta Interaktive e Rasteve</h1>
          <p>Vizualizimi i lokacioneve të personave të zhdukur dhe raporteve nga qytetarët</p>
        </div>
        <div className="map-filters">
          <button 
            className={`filter-btn ${selectedType === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedType('all')}
          >
            📍 Të gjitha ({reports.length + missingPersons.length})
          </button>
          <button 
            className={`filter-btn ${selectedType === 'reports' ? 'active' : ''}`}
            onClick={() => setSelectedType('reports')}
          >
            📝 Raporte ({reports.length})
          </button>
          <button 
            className={`filter-btn ${selectedType === 'missing' ? 'active' : ''}`}
            onClick={() => setSelectedType('missing')}
          >
            👤 Të zhdukur ({missingPersons.length})
          </button>
        </div>
      </div>

      <div className="map-stats">
        <div className="stat-card">
          <div className="stat-icon">📍</div>
          <div className="stat-info">
            <div className="stat-value">{heatmapData.length}</div>
            <div className="stat-label">Pika aktive</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📝</div>
          <div className="stat-info">
            <div className="stat-value">{reports.length}</div>
            <div className="stat-label">Raporte nga qytetarët</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">👤</div>
          <div className="stat-info">
            <div className="stat-value">{missingPersons.length}</div>
            <div className="stat-label">Persona të zhdukur</div>
          </div>
        </div>
      </div>

      <div className="map-container">
        <MapContainer center={center} zoom={zoom} className="leaflet-map">
          <ChangeView center={center} zoom={zoom} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {/* Heatmap circles */}
          {heatmapData.map((point, idx) => (
            point.lat && point.lng && (
              <Circle
                key={`heat-${idx}`}
                center={[point.lat, point.lng]}
                radius={Math.min(Math.abs(point.weight * 800), 3000)}
                pathOptions={{
                  color: '#ff8c00',
                  fillColor: '#ffd700',
                  fillOpacity: 0.3,
                  weight: 2,
                  opacity: 0.6
                }}
              />
            )
          ))}
          
          {/* Markers for missing persons */}
          {filteredData
            .filter(item => item.type === 'missing_person' || item.status === 'missing' || item.status === 'wanted')
            .map((item, idx) => (
              item.latitude && item.longitude && (
                <Marker
                  key={`missing-${item.id || idx}`}
                  position={[item.latitude, item.longitude]}
                  icon={missingIcon}
                  eventHandlers={{
                    click: () => goToPersonDetails(item.id, item.name),
                    mouseover: (e) => {
                      setHoveredItem(item);
                      e.target.openPopup();
                    },
                    mouseout: () => setHoveredItem(null)
                  }}
                >
                  <Popup>
                    <div className="popup-content">
                      <h4>🔴 {item.name || 'Person i zhdukur'}</h4>
                      <p><strong>Statusi:</strong> 
                        <span className={`status-badge ${item.status === 'missing' ? 'missing' : 'wanted'}`}>
                          {item.status === 'missing' ? 'I ZHDUKUR' : 'NË KËRKIM'}
                        </span>
                      </p>
                      <p><strong>📍 Vendndodhja e fundit:</strong> {item.location_name || 'E panjohur'}</p>
                      {item.description && (
                        <p><strong>📝 Përshkrimi:</strong> {item.description.substring(0, 80)}...</p>
                      )}
                      <button 
                        className="popup-btn missing-btn" 
                        onClick={() => goToPersonDetails(item.id, item.name)}
                      >
                        🔍 Shiko detajet e personit →
                      </button>
                    </div>
                  </Popup>
                </Marker>
              )
            ))}
          
          {/* Markers for citizen reports */}
          {filteredData
            .filter(item => item.type === 'citizen_report')
            .map((item, idx) => (
              item.latitude && item.longitude && (
                <Marker
                  key={`report-${item.id || idx}`}
                  position={[item.latitude, item.longitude]}
                  icon={reportIcon}
                  eventHandlers={{
                    click: () => goToReport(item.id),
                    mouseover: (e) => {
                      setHoveredItem(item);
                      e.target.openPopup();
                    },
                    mouseout: () => setHoveredItem(null)
                  }}
                >
                  <Popup>
                    <div className="popup-content">
                      <h4>📝 Raport nga qytetari #{item.id}</h4>
                      <p><strong>Statusi:</strong> 
                        <span className={`status-badge ${item.status === 'verified' ? 'found' : 'pending'}`}>
                          {item.status === 'verified' ? 'I VERIFIKUAR' : 'NË PRITJE'}
                        </span>
                      </p>
                      <p><strong>📍 Lokacioni:</strong> {item.location_name || 'I panjohur'}</p>
                      {item.description && (
                        <p><strong>📝 Përshkrimi:</strong> {item.description.substring(0, 80)}...</p>
                      )}
                      <p><strong>📅 Raportuar:</strong> {formatDate(item.reported_at)}</p>
                      <button 
                        className="popup-btn report-btn" 
                        onClick={() => goToReport(item.id)}
                      >
                        📋 Shiko raportin →
                      </button>
                    </div>
                  </Popup>
                </Marker>
              )
            ))}
        </MapContainer>
      </div>

      {/* Hover Info Card */}
      {hoveredItem && hoveredItem.latitude && (
        <div className="hover-info-card">
          <h4>
            {hoveredItem.type === 'missing_person' ? '🔴 ' : '📝 '}
            {hoveredItem.name || (hoveredItem.type === 'citizen_report' ? `Raport #${hoveredItem.id}` : 'Person i zhdukur')}
          </h4>
          <p>{hoveredItem.location_name || 'Lokacion i panjohur'}</p>
          <small>Kliko për më shumë detaje →</small>
        </div>
      )}

      <div className="map-legend">
        <div className="legend-item">
          <div className="legend-color red"></div>
          <span>🔴 Persona të zhdukur / Në kërkim</span>
        </div>
        <div className="legend-item">
          <div className="legend-color blue"></div>
          <span>📝 Raporte nga qytetarët</span>
        </div>
        <div className="legend-item">
          <div className="legend-color orange"></div>
          <span>🔥 Zonë me aktivitet të lartë</span>
        </div>
      </div>
    </div>
  );
};

export default Map;