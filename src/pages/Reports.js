import { FiBarChart2, FiTrendingUp, FiUsers, FiDollarSign } from 'react-icons/fi';

const Reports = () => {
  return (
    <div>
      <h2 className="page-title">Reports</h2>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-info">
            <span className="stat-label">Sales Reports</span>
            <span className="stat-value" style={{ fontSize: 16 }}>Monthly, Quarterly, Annual</span>
          </div>
          <div className="stat-icon" style={{ color: '#58a6ff' }}><FiBarChart2 size={24} /></div>
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <span className="stat-label">Points Analytics</span>
            <span className="stat-value" style={{ fontSize: 16 }}>Earned vs Redeemed</span>
          </div>
          <div className="stat-icon" style={{ color: '#d29922' }}><FiTrendingUp size={24} /></div>
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <span className="stat-label">Dealer Performance</span>
            <span className="stat-value" style={{ fontSize: 16 }}>Top performers, inactive</span>
          </div>
          <div className="stat-icon" style={{ color: '#3fb950' }}><FiUsers size={24} /></div>
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <span className="stat-label">Revenue Analysis</span>
            <span className="stat-value" style={{ fontSize: 16 }}>Payment trends</span>
          </div>
          <div className="stat-icon" style={{ color: '#f85149' }}><FiDollarSign size={24} /></div>
        </div>
      </div>
      <div className="chart-card" style={{ textAlign: 'center', padding: 60, marginTop: 20 }}>
        <FiBarChart2 size={64} style={{ color: '#21262d', marginBottom: 16 }} />
        <h3 style={{ color: '#8b949e' }}>Detailed Reports Coming Soon</h3>
        <p style={{ color: '#484f58' }}>Export and analytics features will be available in the next update.</p>
      </div>
    </div>
  );
};

export default Reports;
