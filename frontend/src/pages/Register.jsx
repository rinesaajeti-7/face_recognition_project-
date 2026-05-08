import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../services/authService';

import './Register.css';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError('Fjalëkalimet nuk përputhen');
      return;
    }

    if (password.length < 6) {
      setError('Fjalëkalimi duhet të ketë të paktën 6 karaktere');
      return;
    }

    setLoading(true);

    try {
      await register(email, password, fullName, 'operator');

      setSuccess('Regjistrimi u krye me sukses! Ju po ridrejtoheni...');

      setTimeout(() => {
        navigate('/login');
      }, 2000);

    } catch (err) {
      console.error(err);

      if (err?.response?.status === 400) {
        setError('Ky email është i regjistruar tashmë');
      } else {
        setError('Ndodhi një gabim gjatë regjistrimit');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">

      <div className="register-box">

        <h1 className="register-title">Regjistrimi</h1>

        <form onSubmit={handleSubmit} className="register-form">

          <input
            type="text"
            placeholder="Emri i plotë (opsional)"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="input"
          />

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
            required
          />

          <input
            type="password"
            placeholder="Fjalëkalimi"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input"
            required
          />

          <input
            type="password"
            placeholder="Konfirmo fjalëkalimin"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="input"
            required
          />

          {error && <p className="error">{error}</p>}
          {success && <p className="success">{success}</p>}

          <button
            type="submit"
            disabled={loading}
            className="btn"
          >
            {loading ? 'Duke regjistruar...' : 'Regjistrohu'}
          </button>

        </form>

        <p className="login-text">
          Keni llogari?{' '}
          <Link to="/login" className="link">
            Hyni këtu
          </Link>
        </p>

      </div>

    </div>
  );
}