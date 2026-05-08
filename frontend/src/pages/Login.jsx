import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../services/authService';

import './Login.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError('');
    setLoading(true);

    try {
      const res = await login(email, password);

      localStorage.setItem('access_token', res?.data?.access_token);

      navigate('/');
    } catch (err) {
      console.error(err);
      setError('Email ose fjalëkalim i pasaktë');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">

      <div className="login-box">

        <h1 className="login-title">
          Face Recognition System for Law Enforcement
        </h1>

        <form onSubmit={handleSubmit} className="login-form">

          <input
            type="email"
            placeholder="Email"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && <p className="error">{error}</p>}

          <button
            type="submit"
            className="btn"
            disabled={loading}
          >
            {loading ? 'Duke u kyçur...' : 'Login'}
          </button>

        </form>

        <p className="register-text">
          Nuk ke llogari?{' '}
          <Link to="/register" className="link">
            Regjistrohu këtu
          </Link>
        </p>

      </div>

    </div>
  );
}