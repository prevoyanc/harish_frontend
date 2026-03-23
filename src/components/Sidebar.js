import { NavLink } from 'react-router-dom';
import { FiHome, FiBox, FiUsers, FiShoppingCart, FiStar, FiGift, FiBarChart2, FiSettings, FiLogOut, FiUserPlus, FiClipboard, FiTruck } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

const menuItems = [
  { path: '/', icon: FiHome, label: 'Dashboard' },
  { path: '/products', icon: FiBox, label: 'Products' },
  { path: '/dealers', icon: FiUsers, label: 'Dealers' },
  { path: '/orders', icon: FiShoppingCart, label: 'Orders' },
  { path: '/points-config', icon: FiStar, label: 'Points Config' },
  { path: '/redemption', icon: FiGift, label: 'Redemption' },
  { path: '/employees', icon: FiTruck, label: 'Employee Assignment' },
  { path: '/sales-tracking', icon: FiClipboard, label: 'Sales Tracking' },
  { path: '/users', icon: FiUserPlus, label: 'Users' },
  { path: '/reports', icon: FiBarChart2, label: 'Reports' },
];

const Sidebar = () => {
  const { logout } = useAuth();

  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <span className="logo-icon">&#9670;</span>
        <span className="logo-text">IncentivePro</span>
      </div>
      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <item.icon size={18} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <NavLink to="/settings" className="nav-link">
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
