import { useState } from 'react';
import './CitizenNavbar.css';

const CitizenNavbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const [user] = useState(() => {
    const citizenId = localStorage.getItem('citizen_id');
    const name = localStorage.getItem('citizen_name');
    const points = localStorage.getItem('citizen_points');

    if (!citizenId) {
      return {
        isLoggedIn: false,
        name: '',
        points: 0
      };
    }

    return {
      isLoggedIn: true,
      name: name || 'Qytetar',
      points: points ? parseInt(points) : 0
    };
  });

  // ✅ USED NOW (fix ESLint)
  const handleLogout = () => {
    localStorage.removeItem('citizen_id');
    localStorage.removeItem('citizen_name');
    localStorage.removeItem('citizen_points');

    setShowDropdown(false);
    window.location.href = '/citizen';
  };

  return (
    <nav className="citizen-navbar">
      <div className="nav-container">

        {/* Logo */}
        <div
          className="nav-logo"
          onClick={() => (window.location.href = '/citizen')}
        >
          <span className="logo-icon">🤝</span>
          <span className="logo-text">
            Citizen<span className="logo-highlight">Helper</span>
          </span>
        </div>

        {/* Desktop Menu */}
        <div className="nav-links">
          <a href="/citizen" className="nav-link">🏠 Ballina</a>
          <a href="/citizen/check" className="nav-link">🔍 Kontrollo</a>
          <a href="/citizen/report" className="nav-link">📝 Raporto</a>
          <a href="/citizen/leaderboard" className="nav-link">🏆 Leaderboard</a>
          <a href="/citizen/guide" className="nav-link">📖 Udhëzues</a>
        </div>

        {/* User Section */}
        <div className="nav-user">
          {user.isLoggedIn ? (
            <div className="user-dropdown">

              <button
                className="user-btn"
                onClick={() => setShowDropdown(!showDropdown)}
              >
                <span>👤</span>
                <span>{user.name}</span>
                <span>⭐ {user.points}</span>
              </button>

              {/* Dropdown */}
              {showDropdown && (
                <div className="dropdown-menu">

                  <a href="/citizen/profile" className="dropdown-item">
                    👤 Profili im
                  </a>

                  <a href="/citizen/reports" className="dropdown-item">
                    📋 Raportet e mia
                  </a>

                  <a href="/citizen/badges" className="dropdown-item">
                    🏅 Arritjet
                  </a>

                  <a href="/citizen/points" className="dropdown-item">
                    ⭐ Pikët e mia
                  </a>

                  <hr />

                  <button onClick={handleLogout} className="logout-btn">
                    🚪 Dil
                  </button>

                </div>
              )}

            </div>
          ) : (
            <button
              className="login-btn"
              onClick={() => (window.location.href = '/citizen/register')}
            >
              📝 Regjistrohu
            </button>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="mobile-menu-btn"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          ☰
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="mobile-menu">
          <a href="/citizen">🏠 Ballina</a>
          <a href="/citizen/check">🔍 Kontrollo</a>
          <a href="/citizen/report">📝 Raporto</a>
          <a href="/citizen/leaderboard">🏆 Leaderboard</a>
          <a href="/citizen/guide">📖 Udhëzues</a>

          {!user.isLoggedIn && (
            <a href="/citizen/register">📝 Regjistrohu</a>
          )}

          {user.isLoggedIn && (
            <button onClick={handleLogout} className="mobile-logout">
              🚪 Dil
            </button>
          )}
        </div>
      )}
    </nav>
  );
};

export default CitizenNavbar;