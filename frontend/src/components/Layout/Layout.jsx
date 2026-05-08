import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

export default function Layout() {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <Navbar />
      <div className="pt-16">  {/* pt-16 e bën hapësirë që përmbajtja të mos mbulohet nga navbar-i fiks */}
        <main className="container mx-auto px-4 py-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}