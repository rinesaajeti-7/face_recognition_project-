import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  HomeIcon,
  MagnifyingGlassIcon,
  UserGroupIcon,
  BellIcon,
  ClockIcon,
  CogIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  ChatBubbleLeftRightIcon,
  MapIcon,
  DocumentTextIcon,
  QrCodeIcon,
  MoonIcon,
  SunIcon,
     // for Photo Progression
  PhotoIcon          // for Photo Forensics
} from '@heroicons/react/24/outline';
import './Navbar.css';
import NotificationBell from '../Notifications/NotificationBell';

const navigation = [
  { name: 'Dashboard', href: '/', icon: HomeIcon, badge: false },
  { name: 'Kërkim', href: '/search', icon: MagnifyingGlassIcon, badge: false },
  { name: 'Galeria', href: '/gallery', icon: UserGroupIcon, badge: false },
  { name: 'Alertet', href: '/alerts', icon: BellIcon, badge: false }, // ✅ No fake badge
  { name: 'Historia', href: '/history', icon: ClockIcon, badge: false },
  { name: 'Chat AI', href: '/chat', icon: ChatBubbleLeftRightIcon, badge: false, new: true },
  { name: 'Harta', href: '/map', icon: MapIcon, badge: false, new: true },
  { name: 'Raporte', href: '/reports', icon: DocumentTextIcon, badge: false, new: true },
  { name: 'QR Kodet', href: '/qrcodes', icon: QrCodeIcon, badge: false, new: true },
  { name: 'Admin', href: '/admin', icon: CogIcon, badge: false },

  { name: 'Photo Forensics', href: '/photo-forensics', icon: PhotoIcon, badge: false, new: true } // ✅ Added back
];

export default function Navbar() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true';
  });
  const [moreDropdownOpen, setMoreDropdownOpen] = useState(false);

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-mode');
      localStorage.setItem('darkMode', 'true');
    } else {
      document.body.classList.remove('dark-mode');
      localStorage.setItem('darkMode', 'false');
    }
  }, [darkMode]);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    navigate('/login');
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
    setMoreDropdownOpen(false);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
    setMoreDropdownOpen(false);
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const toggleMoreDropdown = () => {
    setMoreDropdownOpen(!moreDropdownOpen);
  };

  return (
    <nav className={`navbar ${darkMode ? 'dark' : ''}`}>
      <div className="navbar-container">

        {/* Logo */}
        <div className="logo">
          <h1>FaceID<span>Police</span></h1>
          <p>Law Enforcement System</p>
        </div>

        {/* Desktop Navigation */}
        <div className="desktop-nav">
          {/* First 5 items visible */}
          {navigation.slice(0, 5).map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                `nav-item ${isActive ? 'active' : ''} ${item.new ? 'new-feature' : ''}`
              }
            >
              <item.icon className="icon" />
              <span>{item.name}</span>
              {item.new && <span className="new-badge">New</span>}
            </NavLink>
          ))}
          
          {/* "Më shumë" dropdown – contains remaining items (Chat AI, Harta, Raporte, QR Kodet, Admin, Photo Progression, Photo Forensics) */}
          <div className={`nav-dropdown ${moreDropdownOpen ? 'open' : ''}`}>
            <button className="dropdown-btn" onClick={toggleMoreDropdown}>
              <Bars3Icon className="icon" />
              <span>Më shumë</span>
              <span className="dropdown-arrow">▼</span>
            </button>
            <div className="dropdown-menu">
              {navigation.slice(5).map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={({ isActive }) =>
                    `dropdown-item ${isActive ? 'active' : ''}`
                  }
                  onClick={closeMobileMenu}
                >
                  <item.icon className="icon" />
                  <span>{item.name}</span>
                  {item.new && <span className="new-badge">New</span>}
                </NavLink>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side - Desktop */}
        <div className="desktop-right">
          <button className="dark-mode-btn" onClick={toggleDarkMode} title="Dark mode">
            {darkMode ? <SunIcon className="icon" /> : <MoonIcon className="icon" />}
          </button>
          
          <NotificationBell />
          
          <NavLink to="/profile" className="profile">
            <span>👤</span>
            <span>Profili</span>
          </NavLink>

          <button onClick={handleLogout} className="logout">
            <ArrowRightOnRectangleIcon className="icon" />
            <span>Dil</span>
          </button>
        </div>

        {/* Mobile Menu Button */}
        <button className="mobile-menu-btn" onClick={toggleMobileMenu}>
          {mobileMenuOpen ? (
            <XMarkIcon className="icon" />
          ) : (
            <Bars3Icon className="icon" />
          )}
        </button>

      </div>

      {/* Mobile Menu */}
      <div className={`mobile-menu ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="mobile-menu-header">
          <div className="mobile-user-info">
            <span className="mobile-avatar">👤</span>
            <div>
              <p>Oficer i Policisë</p>
              <small>Logged in</small>
            </div>
          </div>
        </div>
        
        <div className="mobile-nav-items">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                `mobile-nav-item ${isActive ? 'active' : ''}`
              }
              onClick={closeMobileMenu}
            >
              <item.icon className="icon" />
              <span>{item.name}</span>
              {item.new && <span className="new-badge">New</span>}
            </NavLink>
          ))}
        </div>
        
        <div className="mobile-menu-footer">
          <button className="mobile-darkmode-btn" onClick={toggleDarkMode}>
            {darkMode ? <SunIcon className="icon" /> : <MoonIcon className="icon" />}
            <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
          
          <button onClick={handleLogout} className="mobile-logout-btn">
            <ArrowRightOnRectangleIcon className="icon" />
            <span>Dil</span>
          </button>
        </div>
      </div>

    </nav>
  );
}