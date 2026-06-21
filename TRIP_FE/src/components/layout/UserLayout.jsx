import { Outlet } from 'react-router-dom';
import Navbar      from './navbar/Navbar.jsx';
import Footer      from './footer/Footer.jsx';

const UserLayout = () => (
  <div className="min-h-screen flex flex-col bg-background">
    <Navbar />
    <main className="flex-1">
      <Outlet />
    </main>
    <Footer />
  </div>
);

export default UserLayout;
