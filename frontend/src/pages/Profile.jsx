import { useState, useEffect } from 'react';
import { getCurrentUser, changePassword } from '../services/authService';

import './Profile.css';

export default function Profile() {
  const [user, setUser] = useState(null);

  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const fetchUser = async () => {
    try {
      const res = await getCurrentUser();
      setUser(res?.data || null);
    } catch (err) {
      console.error(err); // ✔ FIX: err used properly
    }
  };

  useEffect(() => {
    const loadUser = async () => {
      await fetchUser();
    };

    loadUser();
  }, []);

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    setMessage('');
    setError('');

    if (newPass !== confirmPass) {
      setError('Fjalëkalimet nuk përputhen');
      return;
    }

    if (newPass.length < 6) {
      setError('Fjalëkalimi duhet të ketë të paktën 6 karaktere');
      return;
    }

    try {
      await changePassword(oldPass, newPass);

      setMessage('Fjalëkalimi u ndryshua me sukses!');

      setOldPass('');
      setNewPass('');
      setConfirmPass('');
    } catch (err) {
      console.error(err); // ✔ FIX: err used here too
      setError('Gabim gjatë ndryshimit të fjalëkalimit');
    }
  };

  if (!user) {
    return <div className="loading">Duke ngarkuar...</div>;
  }

  return (
    <div className="profile-page">

      <h1 className="profile-title">Profili im</h1>

      <div className="profile-box">

        <div className="info">
          <label>Email</label>
          <p>{user.email}</p>
        </div>

        <div className="info">
          <label>Emri i plotë</label>
          <p>{user.full_name || 'N/A'}</p>
        </div>

        <div className="info">
          <label>Roli</label>
          <p className="role">{user.role}</p>
        </div>

        <hr className="line" />

        <h2 className="subtitle">Ndrysho fjalëkalimin</h2>

        <form onSubmit={handlePasswordChange} className="form">

          <input
            type="password"
            placeholder="Fjalëkalimi i vjetër"
            value={oldPass}
            onChange={(e) => setOldPass(e.target.value)}
            className="input"
            required
          />

          <input
            type="password"
            placeholder="Fjalëkalimi i ri"
            value={newPass}
            onChange={(e) => setNewPass(e.target.value)}
            className="input"
            required
          />

          <input
            type="password"
            placeholder="Konfirmo fjalëkalimin"
            value={confirmPass}
            onChange={(e) => setConfirmPass(e.target.value)}
            className="input"
            required
          />

          {message && <p className="success">{message}</p>}
          {error && <p className="error">{error}</p>}

          <button type="submit" className="btn">
            Ndrysho fjalëkalimin
          </button>

        </form>

      </div>

    </div>
  );
}