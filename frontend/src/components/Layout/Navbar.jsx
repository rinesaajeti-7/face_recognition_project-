import { NavLink, useNavigate } from 'react-router-dom';
import {
  HomeIcon,
  MagnifyingGlassIcon,
  UserGroupIcon,
  BellIcon,
  ClockIcon,
  CogIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';

import './Navbar.css';

const navigation = [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
  { name: 'Kërkim', href: '/search', icon: MagnifyingGlassIcon },
  { name: 'Galeria', href: '/gallery', icon: UserGroupIcon },
  { name: 'Alertet', href: '/alerts', icon: BellIcon },
  { name: 'Historia', href: '/history', icon: ClockIcon },
  { name: 'Admin', href: '/admin', icon: CogIcon },
];

export default function Navbar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">

        {/* Logo */}
        <div className="logo">
          <h1>FaceID<span>Police</span></h1>
          <p>Law Enforcement System</p>
        </div>

        {/* Links */}
        <div className="nav-links">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                `nav-item ${isActive ? 'active' : ''}`
              }
            >
              <item.icon className="icon" />
              {item.name}
            </NavLink>
          ))}
        </div>

        {/* Right */}
        <div className="right">
          <NavLink to="/profile" className="profile">
            Profili
          </NavLink>

          <button onClick={handleLogout} className="logout">
            <ArrowRightOnRectangleIcon className="icon" />
            Dil
          </button>
        </div>

      </div>
    </nav>
  );
}