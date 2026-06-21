import { useState } from 'react';
import CitizenCheck from './CitizenCheck';
import CitizenReport from './CitizenReport';
import CitizenChatBot from '../../components/Chat/CitizenChatBot';
import './CitizenPortal.css';
import CitizenPublicAlerts from './CitizenPublicAlerts';

const CitizenPortal = () => {
  const [activeTab, setActiveTab] = useState('check');
  const citizenId = localStorage.getItem('citizen_id');

  return (
    <div className="citizen-portal">
      {/* Hero Section */}
      <div className="citizen-hero">
        <h1>🤝 Qytetarët në Veprim</h1>
        <p>Bashkëpunoni me Policinë për të gjetur personat e zhdukur</p>
        <div className="citizen-badge">
          🌟 Çdo raport mund të shpëtojë një jetë
        </div>
      </div>

      {/* Tabs */}
      <div className="citizen-tabs">
        <div className="tab-container">
          <button
            className={`tab-btn ${activeTab === 'check' ? 'active' : ''}`}
            onClick={() => setActiveTab('check')}
          >
            🔍 Kontrollo Personin
          </button>
          <button
            className={`tab-btn ${activeTab === 'report' ? 'active' : ''}`}
            onClick={() => setActiveTab('report')}
          >
            📝 Raporto të Dyshuar
          </button>
          <button
            className={`tab-btn ${activeTab === 'public' ? 'active' : ''}`}
            onClick={() => setActiveTab('public')}
          >
            📢 Shpallje Publike
          </button>
        </div>
      </div>

      {/* Content - shfaq vetëm komponentin e duhur sipas tab-it aktiv */}
      <div className="fade-in">
        {activeTab === 'check' && <CitizenCheck />}
        {activeTab === 'report' && <CitizenReport />}
        {activeTab === 'public' && <CitizenPublicAlerts />}
      </div>

      {/* ChatBot */}
      <CitizenChatBot citizenId={citizenId} />
    </div>
  );
};

export default CitizenPortal;