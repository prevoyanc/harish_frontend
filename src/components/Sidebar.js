import { NavLink } from "react-router-dom";
import {
  FiHome,
  FiBox,
  FiUsers,
  FiLogOut,
  FiUserPlus,
  FiUserCheck,
  FiClipboard,
  FiTruck,
  FiCalendar,
  FiX,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";
import { useAuth } from "../context/AuthContext";

const menuItems = [
  { path: "/", icon: FiHome, label: "Dashboard" },
  { path: "/dealers", icon: FiUsers, label: "Dealers" },
  { path: "/employees", icon: FiTruck, label: "Employee Assignment" },
  { path: "/sales-tracking", icon: FiClipboard, label: "Sales Tracking" },
  { path: "/attendance", icon: FiCalendar, label: "Attendance" },
  { path: "/users", icon: FiUserPlus, label: "Users" },
  { path: "/assign-dealer", icon: FiUserCheck, label: "Assign Dealer" },
];

const Sidebar = ({ isOpen, onClose, onToggle }) => {
  const { logout } = useAuth();

  return (
    <div className={`sidebar ${isOpen ? "sidebar-open" : ""}`}>
      <div className="sidebar-logo">
        <img
          src="/logo.png"
          alt="Logo"
          className="logo-image"
          style={{ height: 40, width: "auto", objectFit: "contain" }}
        />
        <span className="logo-text">IncentivePro</span>
        <button
          className="menu-toggle-btn"
          onClick={onToggle}
          title={isOpen ? "Collapse Menu" : "Expand Menu"}
        >
          {isOpen ? <FiChevronLeft size={18} /> : <FiChevronRight size={18} />}
        </button>
      </div>
      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === "/"}
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
            onClick={() => {}}
          >
            <item.icon size={18} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <button className="nav-link logout-btn" onClick={logout}>
          <FiLogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
