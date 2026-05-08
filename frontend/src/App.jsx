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
import Layout from './components/Layout/Layout';

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('access_token');
  if (!token) return <Navigate to="/login" />;
  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/search" element={<Search />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/history" element={<History />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;