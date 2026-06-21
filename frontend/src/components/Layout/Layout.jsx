// Layout.jsx
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import './Layout.css';

export default function Layout() {
  return (
    <div className="layout">
      <Navbar />
      <div className="layout-content">
        <main className="layout-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}