import { useState, useEffect } from 'react';
import { getDealers, updateDealer } from '../services/api';
import { FiEdit2 } from 'react-icons/fi';

const Dealers = () => {
  const [dealers, setDealers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchDealers = async () => {
    try {
      const res = await getDealers({ page, limit: 10, search, tier: tierFilter || undefined });
      setDealers(res.data.dealers);
      setTotal(res.data.total);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => { fetchDealers(); }, [page, search, tierFilter]);

  const handleTierChange = async (dealer, newTier) => {
    await updateDealer(dealer.id, { tier: newTier });
    fetchDealers();
  };

  if (loading) return <div className="loading">Loading dealers...</div>;

  return (
    <div>
      <h2 className="page-title">Dealer Management</h2>
      <div className="toolbar">
        <input type="text" placeholder="Search business name..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="search-input" />
        <select value={tierFilter} onChange={(e) => setTierFilter(e.target.value)} className="filter-select">
          <option value="">All Tiers</option>
          <option value="gold">Gold</option>
          <option value="silver">Silver</option>
          <option value="bronze">Bronze</option>
        </select>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr><th>Business Name</th><th>Contact</th><th>City</th><th>State</th><th>Tier</th><th>Points</th><th>Status</th></tr>
          </thead>
          <tbody>
            {dealers.map((d) => (
              <tr key={d.id}>
                <td>{d.businessName}</td>
                <td>{d.user?.name || '-'}<br/><small style={{color:'#8b949e'}}>{d.user?.email}</small></td>
                <td>{d.city || '-'}</td>
                <td>{d.state || '-'}</td>
                <td>
                  <select value={d.tier} onChange={(e) => handleTierChange(d, e.target.value)} className="tier-select" style={{ background: d.tier === 'gold' ? '#d29922' : d.tier === 'silver' ? '#8b949e' : '#cd7f32', color: '#fff', border: 'none', borderRadius: 4, padding: '2px 8px' }}>
                    <option value="gold">Gold</option>
                    <option value="silver">Silver</option>
                    <option value="bronze">Bronze</option>
                  </select>
                </td>
                <td style={{fontWeight:600}}>{d.totalPoints?.toLocaleString()} pts</td>
                <td><span className={`badge badge-${d.user?.status || 'active'}`}>{d.user?.status || 'active'}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="pagination">
          <span>Total: {total} dealers</span>
        </div>
      </div>
    </div>
  );
};

export default Dealers;
