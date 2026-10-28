import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import './layout.css';

export default function MainLayout() {
  return (
    <div className="site-shell">
      <div className="top-strip">
        Every thread tells a story • Free shipping across Pakistan
      </div>
      <Navbar />
      <main className="site-main">
        <Outlet />
      </main>
      <footer className="site-footer">
        <div className="footer-content">
          <div className="footer-address">
            Qissa &middot; F-10 Markaz &middot; Islamabad, Pakistan
          </div>
          <p>© {new Date().getFullYear()} Qissa Wear. Crafted for the modern storyteller.</p>
        </div>
      </footer>
    </div>
  );
}
