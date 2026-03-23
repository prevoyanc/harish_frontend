import { useState, useEffect } from 'react';
import { getOrders, createOrder, updateOrder, getDealers, getProducts } from '../services/api';
import { FiPlus, FiX, FiTrash2 } from 'react-icons/fi';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showPanel, setShowPanel] = useState(false);
  const [dealers, setDealers] = useState([]);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ dealerId: '', items: [], paymentTerms: 'Net 15', invoiceDate: '', paymentDate: '', totalAmount: 0 });

  const fetchOrders = async () => {
    try {
      const res = await getOrders({ page, limit: 10, search, status: statusFilter || undefined });
      setOrders(res.data.orders);
      setTotal(res.data.total);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => { fetchOrders(); }, [page, search, statusFilter]);

  const openCreate = async () => {
    try {
      const [dRes, pRes] = await Promise.all([getDealers({ limit: 100 }), getProducts({ limit: 100 })]);
      setDealers(dRes.data.dealers);
      setProducts(pRes.data.products);
    } catch (err) { console.error(err); }
    setForm({ dealerId: '', items: [], paymentTerms: 'Net 15', invoiceDate: new Date().toISOString().split('T')[0], paymentDate: '', totalAmount: 0 });
    setShowPanel(true);
  };

  const addItem = () => {
    setForm({ ...form, items: [...form.items, { productId: '', quantity: 1, price: 0 }] });
  };

  const updateItem = (index, field, value) => {
    const items = [...form.items];
    items[index][field] = value;
    if (field === 'productId') {
      const prod = products.find((p) => p.id === parseInt(value));
      if (prod) items[index].price = 0;
    }
    setForm({ ...form, items });
  };

  const removeItem = (index) => {
    setForm({ ...form, items: form.items.filter((_, i) => i !== index) });
  };

  const handleCreate = async () => {
    try {
      await createOrder(form);
      setShowPanel(false);
      fetchOrders();
    } catch (err) { console.error(err); }
  };

  const handleStatusUpdate = async (order, newStatus) => {
    await updateOrder(order.id, { status: newStatus, paymentStatus: newStatus === 'paid' ? 'paid' : order.paymentStatus });
    fetchOrders();
  };

  if (loading) return <div className="loading">Loading orders...</div>;

  return (
    <div>
      <h2 className="page-title">Order Management</h2>
      <div className="toolbar">
        <input type="text" placeholder="Search Order ID..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="search-input" />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="filter-select">
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="shipped">Shipped</option>
          <option value="paid">Paid</option>
        </select>
        <button className="btn btn-primary" onClick={openCreate}><FiPlus /> New Order</button>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr><th>Order ID</th><th>Dealer</th><th>Items</th><th>Amount</th><th>Terms</th><th>Pay Date</th><th>Points</th><th>Status</th></tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <td>{o.orderId}</td>
                <td>{o.dealer?.user?.name || '-'}</td>
                <td>{o.items?.length || 0} items</td>
                <td>${Number(o.totalAmount).toLocaleString()}</td>
                <td>{o.paymentTerms}</td>
                <td>{o.paymentDate || '-'}</td>
                <td style={{ color: o.pointsAwarded > 0 ? '#3fb950' : '#8b949e' }}>
                  {o.pointsAwarded > 0 ? `+${o.pointsAwarded.toLocaleString()}` : 'Pending'}
                </td>
                <td>
                  <select value={o.status} onChange={(e) => handleStatusUpdate(o, e.target.value)}
                    className={`status-select badge-${o.status}`} style={{ background: 'transparent', color: '#e6edf3', border: '1px solid #21262d', borderRadius: 4, padding: '2px 6px' }}>
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="paid">Paid</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="pagination"><span>Total: {total} orders</span></div>
      </div>

      {showPanel && (
        <div className="side-panel">
          <div className="panel-header">
            <h3>Create New Order</h3>
            <button className="icon-btn" onClick={() => setShowPanel(false)}><FiX /></button>
          </div>
          <div className="panel-body">
            <div className="form-group">
              <label>Select Dealer *</label>
              <select value={form.dealerId} onChange={(e) => setForm({ ...form, dealerId: e.target.value })}>
                <option value="">Choose dealer...</option>
                {dealers.map((d) => <option key={d.id} value={d.id}>{d.businessName}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Products *</label>
              <button className="btn btn-secondary btn-sm" onClick={addItem}><FiPlus /> Add Item</button>
              {form.items.map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center' }}>
                  <select value={item.productId} onChange={(e) => updateItem(i, 'productId', e.target.value)} style={{ flex: 2 }}>
                    <option value="">Select product</option>
                    {products.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                  </select>
                  <input type="number" value={item.quantity} onChange={(e) => updateItem(i, 'quantity', parseInt(e.target.value) || 1)} style={{ flex: 0.5 }} min="1" placeholder="Qty" />
                  <button className="icon-btn danger" onClick={() => removeItem(i)}><FiTrash2 /></button>
                </div>
              ))}
            </div>
            <div className="form-group">
              <label>Payment Terms *</label>
              <select value={form.paymentTerms} onChange={(e) => setForm({ ...form, paymentTerms: e.target.value })}>
                <option value="Net 7">Net 7 Days</option>
                <option value="Net 15">Net 15 Days</option>
                <option value="Net 30">Net 30 Days</option>
              </select>
            </div>
            <div className="form-group">
              <label>Invoice Date</label>
              <input type="date" value={form.invoiceDate} onChange={(e) => setForm({ ...form, invoiceDate: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Expected Payment Date</label>
              <input type="date" value={form.paymentDate} onChange={(e) => setForm({ ...form, paymentDate: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Total Amount ($)</label>
              <input type="number" value={form.totalAmount} onChange={(e) => setForm({ ...form, totalAmount: parseFloat(e.target.value) || 0 })} />
            </div>
            <div className="info-box">Points are auto-calculated based on product multipliers and payment speed.</div>
            <div className="panel-footer">
              <button className="btn btn-secondary" onClick={() => setShowPanel(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreate}>Create Order</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
