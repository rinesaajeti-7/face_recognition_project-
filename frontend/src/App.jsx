import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Search from './pages/Search';
import Gallery from './pages/Gallery';
import Alerts from './pages/Alerts';
import History from './pages/History';
import Admin from './pages/Admin';
import Profile from './pages/Profile';
import Chat from './pages/Chat';
import Layout from './components/Layout/Layout';
import CitizenPortal from './pages/Citizen/CitizenPortal';
import Map from './pages/Map';
import Reports from './pages/Reports';
import QRCodes from './pages/QRCodes';
import { SocketProvider } from './contexts/SocketProvider';

import PhotoForensics from './pages/PhotoForensics';


function ProtectedRoute({ children }) {
  const token = localStorage.getItem('access_token');
  if (!token) return <Navigate to="/login" />;
  return children;
}

function App() {
  return (
    <SocketProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/search" element={<Search />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/history" element={<History />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/map" element={<Map />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/qrcodes" element={<QRCodes />} />
           
            <Route path="/photo-forensics" element={
              <ProtectedRoute><PhotoForensics /></ProtectedRoute> } />
          </Route>
          
          <Route path="/citizen" element={<CitizenPortal />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </SocketProvider>
  );
}

export default App;