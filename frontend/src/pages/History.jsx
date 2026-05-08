import { useEffect, useState } from 'react';
import api from '../services/api';

import './History.css';

export default function History() {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const res = await api.get('/history/');
        setHistory(res?.data || []);
      } catch (err) {
        console.error('Error loading history:', err);
      }
    };

    loadHistory();
  }, []);

  return (
    <div className="history-page">

      <h1 className="history-title">
        Historia e kërkimeve
      </h1>

      <div className="history-box">

        {history.length === 0 ? (
          <p className="empty">Nuk ka histori</p>
        ) : (
          history.map((h) => (
            <div key={h.id} className="history-item">

              <p className="history-text">
                <b>Lloji:</b> {h.search_type}
              </p>

              <p className="history-time">
                {new Date(h.created_at).toLocaleString()}
              </p>

            </div>
          ))
        )}

      </div>

    </div>
  );
}