import { NavLink } from 'react-router-dom';
import { FiHome, FiBox, FiUsers, FiSettings, FiLogOut, FiUserPlus, FiClipboard, FiTruck, FiCalendar, FiX } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

const menuItems = [
  { path: '/', icon: FiHome, label: 'Dashboard' },
  { path: '/products', icon: FiBox, label: 'Products' },
  { path: '/dealers', icon: FiUsers, label: 'Dealers' },
  { path: '/employees', icon: FiTruck, label: 'Employee Assignment' },
  { path: '/sales-tracking', icon: FiClipboard, label: 'Sales Tracking' },
  { path: '/attendance', icon: FiCalendar, label: 'Attendance' },
  { path: '/users', icon: FiUserPlus, label: 'Users' },
];

const Sidebar = ({ isOpen, onClose }) => {
  const { logout } = useAuth();

  return (
    <div className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
      <div className="sidebar-logo">
        <span className="logo-icon">&#9670;</span>
        <span className="logo-text">IncentivePro</span>
        <button className="sidebar-close-btn" onClick={onClose}>
          <FiX size={20} />
        </button>
      </div>
      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <item.icon size={18} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <NavLink to="/settings" className="nav-link" onClick={onClose}>
          <FiSettings size={18} />
          <span>Settings</span>
        </NavLink>
        <button className="nav-link logout-btn" onClick={logout}>
          <FiLogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
