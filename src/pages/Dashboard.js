import { useState, useEffect } from 'react';
import { getAdminDashboard, getLivePunchCount } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { FiUsers, FiBox, FiTruck, FiClock, FiLogIn, FiLogOut, FiMapPin } from 'react-icons/fi';

const COLORS = ['#4f46e5', '#059669', '#d97706', '#dc2626'];

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [punchData, setPunchData] = useState({ punchedInCount: 0, punchedOutCount: 0, punchedInUsers: [], punchedOutUsers: [] });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('in');

  useEffect(() => {
    Promise.all([getAdminDashboard(), getLivePunchCount()])
      .then(([dashRes, punchRes]) => {
        setData(dashRes.data);
        setPunchData(punchRes.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Loading dashboard...</div>;
  if (!data) return <div className="loading">Failed to load dashboard</div>;

  const stats = [
    { label: 'Total Products', value: String(data.totalProducts ?? 0), icon: FiBox, color: '#4f46e5' },
    { label: 'Total Employees', value: String(data.totalEmployees ?? 0), icon: FiTruck, color: '#d97706' },
    { label: 'Total Dealers', value: String(data.totalDealers ?? 0), icon: FiUsers, color: '#059669' },
  ];

  const categoryData = [
    { name: 'Premium', value: 35 },
    { name: 'Standard', value: 30 },
    { name: 'Economy', value: 20 },
    { name: 'Accessories', value: 15 },
  ];

  const chartData = (data.monthlySales || []).map((m) => ({
    month: new Date(m.month).toLocaleDateString('en', { month: 'short' }),
    points: Number(m.points) / 1000,
    sales: Number(m.sales) / 1000,
  }));

  const formatTime = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const formatDuration = (punchIn, punchOut) => {
    if (!punchIn) return '-';
    const start = new Date(punchIn);
    const end = punchOut ? new Date(punchOut) : new Date();
    const diff = Math.floor((end - start) / 1000);
    const hrs = Math.floor(diff / 3600);
    const mins = Math.floor((diff % 3600) / 60);
    return `${hrs}h ${mins}m`;
  };

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

      {/* Punch In / Punch Out Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        {/* Punch In Card */}
        <div style={{
          background: '#ffffff', borderRadius: 12, border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)', overflow: 'hidden',
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #059669, #10b981)',
            padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <FiLogIn size={22} color="#fff" />
              <span style={{ color: '#fff', fontSize: 16, fontWeight: 600 }}>Punch In</span>
            </div>
            <div style={{
              background: 'rgba(255,255,255,0.25)', borderRadius: 20,
              padding: '4px 14px', fontSize: 22, fontWeight: 700, color: '#fff',
            }}>
              {punchData.punchedInCount}
            </div>
          </div>
          <div style={{ padding: 16 }}>
            {punchData.punchedInUsers.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {punchData.punchedInUsers.map((a, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 12px', background: '#ecfdf5', borderRadius: 8, border: '1px solid #d1fae5',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%', background: '#059669',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', fontWeight: 600, fontSize: 13,
                      }}>
                        {a.employee?.user?.name?.charAt(0) || 'E'}
                      </div>
                      <div>
                        <div style={{ fontWeight: 500, fontSize: 14, color: '#1a1a2e' }}>{a.employee?.user?.name}</div>
                        <div style={{ fontSize: 11, color: '#6b7280' }}>{a.employee?.user?.email}</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#059669' }}>
                        <FiClock size={12} style={{ marginRight: 4 }} />
                        {formatTime(a.punchIn)}
                      </div>
                      <div style={{ fontSize: 11, color: '#6b7280' }}>{formatDuration(a.punchIn, null)} ago</div>
                      {a.punchInAddress && (
                        <div style={{ fontSize: 10, color: '#9ca3af', display: 'flex', alignItems: 'center', gap: 2, justifyContent: 'flex-end' }}>
                          <FiMapPin size={9} /> {a.punchInAddress}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: 20, color: '#9ca3af' }}>
                <FiLogIn size={24} style={{ marginBottom: 8, opacity: 0.3 }} />
                <p>No employees punched in right now</p>
              </div>
            )}
          </div>
        </div>

        {/* Punch Out Card */}
        <div style={{
          background: '#ffffff', borderRadius: 12, border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)', overflow: 'hidden',
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #dc2626, #ef4444)',
            padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <FiLogOut size={22} color="#fff" />
              <span style={{ color: '#fff', fontSize: 16, fontWeight: 600 }}>Punch Out</span>
            </div>
            <div style={{
              background: 'rgba(255,255,255,0.25)', borderRadius: 20,
              padding: '4px 14px', fontSize: 22, fontWeight: 700, color: '#fff',
            }}>
              {punchData.punchedOutCount}
            </div>
          </div>
          <div style={{ padding: 16 }}>
            {punchData.punchedOutUsers.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {punchData.punchedOutUsers.map((a, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 12px', background: '#fef2f2', borderRadius: 8, border: '1px solid #fecaca',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%', background: '#dc2626',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', fontWeight: 600, fontSize: 13,
                      }}>
                        {a.employee?.user?.name?.charAt(0) || 'E'}
                      </div>
                      <div>
                        <div style={{ fontWeight: 500, fontSize: 14, color: '#1a1a2e' }}>{a.employee?.user?.name}</div>
                        <div style={{ fontSize: 11, color: '#6b7280' }}>{a.employee?.user?.email}</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 12, color: '#059669' }}>In: {formatTime(a.punchIn)}</div>
                      <div style={{ fontSize: 12, color: '#dc2626', fontWeight: 600 }}>Out: {formatTime(a.punchOut)}</div>
                      <div style={{ fontSize: 11, color: '#6b7280' }}>Total: {a.totalHours ? `${a.totalHours}h` : formatDuration(a.punchIn, a.punchOut)}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: 20, color: '#9ca3af' }}>
                <FiLogOut size={24} style={{ marginBottom: 8, opacity: 0.3 }} />
                <p>No punch outs today</p>
              </div>
            )}
          </div>
        </div>
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
        <div className="chart-card">
          <h3>Top Product Categories</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={categoryData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #e5e7eb', color: '#1a1a2e', borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Orders & Top Dealers */}
      <div className="charts-grid">
        <div className="chart-card">
          <div className="card-header">
            <h3>Recent Orders</h3>
            <a href="/orders" className="link-btn">View All</a>
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
