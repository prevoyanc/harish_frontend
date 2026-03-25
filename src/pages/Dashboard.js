import { useState, useEffect } from 'react';
import { getAdminDashboard } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { FiUsers, FiTruck } from 'react-icons/fi';

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAdminDashboard()
      .then((dashRes) => {
        setData(dashRes.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Loading dashboard...</div>;
  if (!data) return <div className="loading">Failed to load dashboard</div>;

  const stats = [
    { label: 'Total Employees', value: String(data.totalEmployees ?? 0), icon: FiTruck, color: '#d97706' },
    { label: 'Total Dealers', value: String(data.totalDealers ?? 0), icon: FiUsers, color: '#059669' },
  ];

  const chartData = (data.monthlySales || []).map((m) => ({
    month: new Date(m.month).toLocaleDateString('en', { month: 'short' }),
    points: Number(m.points) / 1000,
    sales: Number(m.sales) / 1000,
  }));

  return (
    <div>
      <h2 className="page-title">Dashboard Overview</h2>

      {/* Stats Cards */}
      <div className="stats-grid">
        {stats.map((s, i) => (
          <div className="stat-card" key={i}>
            <div className="stat-info">
              <span className="stat-label">{s.label}</span>
              <span className="stat-value">{s.value}</span>
            </div>
            <div className="stat-icon" style={{ color: s.color }}><s.icon size={24} /></div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="charts-grid">
        <div className="chart-card">
          <h3>Sales vs Points Awarded (6 Months)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #e5e7eb', color: '#1a1a2e', borderRadius: 8 }} />
              <Legend />
              <Bar dataKey="points" name="Points Awarded (K)" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              <Bar dataKey="sales" name="Sales Revenue ($K)" fill="#059669" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Orders & Top Dealers */}
      <div className="charts-grid">
        <div className="chart-card">
          <div className="card-header">
            <h3>Recent Orders</h3>
            <span className="link-btn" style={{ opacity: 0.5, pointerEvents: 'none', cursor: 'not-allowed' }}>View All</span>
          </div>
          <table className="data-table">
            <thead>
              <tr><th>Order ID</th><th>Dealer</th><th>Amount</th><th>Payment Status</th><th>Points</th></tr>
            </thead>
            <tbody>
              {(data.recentOrders || []).map((o) => (
                <tr key={o.id}>
                  <td>{o.orderId}</td>
                  <td>{o.dealer?.user?.name || '-'}</td>
                  <td>${Number(o.totalAmount).toLocaleString()}</td>
                  <td><span className={`badge badge-${o.paymentStatus}`}>{o.paymentStatus}</span></td>
                  <td>{o.pointsAwarded > 0 ? `+${o.pointsAwarded}` : 'Pending'}</td>
                </tr>
              ))}
              {(!data.recentOrders || data.recentOrders.length === 0) && (
                <tr><td colSpan="5" style={{ textAlign: 'center' }}>No orders yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="chart-card">
          <h3>Top Dealers</h3>
          <div className="top-dealers-list">
            {(data.topDealers || []).map((d, i) => (
              <div className="top-dealer-item" key={d.id}>
                <div className="rank">{i + 1}</div>
                <div className="dealer-info">
                  <span className="dealer-name">{d.user?.name || d.businessName}</span>
                  <span className="dealer-city">{d.city}, {d.state}</span>
                </div>
                <span className="dealer-points">{(d.totalPoints / 1000).toFixed(1)}K pts</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
