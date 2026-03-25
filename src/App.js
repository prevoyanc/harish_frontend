import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

import Dealers from './pages/Dealers';
import Orders from './pages/Orders';
import PointsConfig from './pages/PointsConfig';
import Redemption from './pages/Redemption';
import Reports from './pages/Reports';
import Users from './pages/Users';
import Employees from './pages/Employees';
import SalesTracking from './pages/SalesTracking';
import Attendance from './pages/Attendance';
import './App.css';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (user.role !== 'admin') return <Navigate to="/login" />;
  return children;
};

const AppRoutes = () => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading">Loading...</div>;

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="dealers" element={<Dealers />} />
        <Route path="orders" element={<Orders />} />
        <Route path="points-config" element={<PointsConfig />} />
        <Route path="redemption" element={<Redemption />} />
        <Route path="employees" element={<Employees />} />
        <Route path="sales-tracking" element={<SalesTracking />} />
        <Route path="attendance" element={<Attendance />} />
        <Route path="users" element={<Users />} />
        <Route path="reports" element={<Reports />} />
        <Route path="settings" element={<Reports />} />
      </Route>
    </Routes>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
