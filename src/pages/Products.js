import { useState, useEffect } from 'react';
import { getProducts, createProduct, updateProduct, deleteProduct, getCategories } from '../services/api';
import { FiPlus, FiEdit2, FiTrash2, FiX } from 'react-icons/fi';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showPanel, setShowPanel] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', sku: '', categoryId: '', basePoints: 0, pointsMultiplier: '1.0', status: 'active' });

  const fetchProducts = async () => {
    try {
      const res = await getProducts({ page, limit: 10, search });
      setProducts(res.data.products);
      setTotal(res.data.total);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => { fetchProducts(); }, [page, search]);
  useEffect(() => { getCategories().then((r) => setCategories(r.data)).catch(console.error); }, []);

  const openAdd = () => {
    setEditing(null);
    setForm({ name: '', sku: '', categoryId: categories[0]?.id || '', basePoints: 0, pointsMultiplier: '1.0', status: 'active' });
    setShowPanel(true);
  };

  const openEdit = (p) => {
    setEditing(p);
    setForm({ name: p.name, sku: p.sku, categoryId: p.categoryId, basePoints: p.basePoints, pointsMultiplier: String(p.pointsMultiplier), status: p.status });
    setShowPanel(true);
  };

  const handleSave = async () => {
    try {
      if (editing) {
        await updateProduct(editing.id, form);
      } else {
        await createProduct(form);
      }
      setShowPanel(false);
      fetchProducts();
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    await deleteProduct(id);
    fetchProducts();
  };

  if (loading) return <div className="loading">Loading products...</div>;

  const totalPages = Math.ceil(total / 10);

  return (
    <div>
      <h2 className="page-title">Product Management</h2>
      <div className="toolbar">
        <input type="text" placeholder="Search SKU or Name..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="search-input" />
        <button className="btn btn-primary" onClick={openAdd}><FiPlus /> Add Product</button>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr><th>SKU</th><th>Product Name</th><th>Category</th><th>Base PTS</th><th>Mult.</th><th>Status</th><th>Action</th></tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <td>{p.sku}</td>
                <td>{p.name}</td>
                <td>{p.category?.name || '-'}</td>
                <td>{p.basePoints}</td>
                <td>{p.pointsMultiplier}x</td>
                <td><span className={`badge badge-${p.status}`}>{p.status}</span></td>
                <td>
                  <button className="icon-btn" onClick={() => openEdit(p)}><FiEdit2 /></button>
                  <button className="icon-btn danger" onClick={() => handleDelete(p.id)}><FiTrash2 /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="pagination">
          <span>Showing {products.length} of {total} entries</span>
          <div className="page-btns">
            {Array.from({ length: totalPages }, (_, i) => (
              <button key={i} className={`page-btn ${page === i + 1 ? 'active' : ''}`} onClick={() => setPage(i + 1)}>{i + 1}</button>
            ))}
          </div>
        </div>
      </div>

      {showPanel && (
        <div className="side-panel">
          <div className="panel-header">
            <h3>{editing ? 'Edit Product' : 'Add Product'}</h3>
            <button className="icon-btn" onClick={() => setShowPanel(false)}><FiX /></button>
          </div>
          <div className="panel-body">
            <div className="form-group">
              <label>Product Name *</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="form-group">
              <label>SKU / Product Code *</label>
              <input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Category</label>
              <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
                <option value="">Select</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Base Points *</label>
              <input type="number" value={form.basePoints} onChange={(e) => setForm({ ...form, basePoints: parseInt(e.target.value) || 0 })} />
            </div>
            <div className="form-group">
              <label>Points Multiplier</label>
              <select value={form.pointsMultiplier} onChange={(e) => setForm({ ...form, pointsMultiplier: e.target.value })}>
                <option value="1.0">1.0x (Standard)</option>
                <option value="1.2">1.2x</option>
                <option value="1.5">1.5x (Premium Boost)</option>
                <option value="2.0">2.0x (Double)</option>
              </select>
            </div>
            <div className="form-group">
              <label>Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="active">Active</option>
                <option value="draft">Draft</option>
              </select>
            </div>
            <div className="panel-footer">
              <button className="btn btn-secondary" onClick={() => setShowPanel(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave}>Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
