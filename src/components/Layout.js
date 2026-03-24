import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';
import { FiBell, FiSearch, FiMenu } from 'react-icons/fi';

const Layout = () => {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-layout">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className={`main-content ${sidebarOpen ? 'shifted' : ''}`}>
        <header className="top-header">
          <div className="header-left" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Hamburger menu button */}
            <button
              className="menu-toggle-btn"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              title="Toggle Menu"
            >
              <FiMenu size={20} />
            </button>

            <div className="search-box">
              <FiSearch size={16} />
              <input type="text" placeholder="Search..." />
            </div>
          </div>
          <div className="header-right">
            <button className="icon-btn"><FiBell size={18} /></button>
            <div className="user-info">
              <div className="avatar">{user?.name?.charAt(0) || 'A'}</div>
              <div className="user-details">
                <span className="user-name">{user?.name || 'Admin'}</span>
                <span className="user-role">Super Admin</span>
              </div>
            </div>
          </div>
        </header>
        <div className="page-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Layout;
