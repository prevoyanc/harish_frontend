import { useState, useEffect } from 'react';
import { getPaymentSlabs, createPaymentSlab, updatePaymentSlab, deletePaymentSlab, getProductRules, createProductRule, deleteProductRule } from '../services/api';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';

const PointsConfig = () => {
  const [slabs, setSlabs] = useState([]);
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [slabForm, setSlabForm] = useState({ minDays: 0, maxDays: 7, modifierType: 'bonus', modifierValue: 20 });
  const [ruleForm, setRuleForm] = useState({ conditionField: 'Product Category', conditionOperator: 'Equals', conditionValue: '', actionType: 'Multiply Base Points By', actionValue: 1.5, isStackable: false });
  const [showSlabForm, setShowSlabForm] = useState(false);

  const fetchData = async () => {
    try {
      const [sRes, rRes] = await Promise.all([getPaymentSlabs(), getProductRules()]);
      setSlabs(sRes.data);
      setRules(rRes.data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleAddSlab = async () => {
    await createPaymentSlab(slabForm);
    setShowSlabForm(false);
    fetchData();
  };

  const handleDeleteSlab = async (id) => {
    await deletePaymentSlab(id);
    fetchData();
  };

  const handleAddRule = async () => {
    await createProductRule(ruleForm);
    setRuleForm({ ...ruleForm, conditionValue: '' });
    fetchData();
  };

  const handleDeleteRule = async (id) => {
    await deleteProductRule(id);
    fetchData();
  };

  // Live preview
  const basePoints = 500;
  const premiumMultiplier = rules.find(r => r.conditionValue === 'Premium')?.actionValue || 1;
  const fastPaySlab = slabs.find(s => s.minDays === 0);
  const fastPayBonus = fastPaySlab ? parseFloat(fastPaySlab.modifierValue) : 0;
  const afterRule = basePoints * parseFloat(premiumMultiplier);
  const finalPoints = Math.round(afterRule + (afterRule * fastPayBonus / 100));

  if (loading) return <div className="loading">Loading points config...</div>;

  return (
    <div>
      <h2 className="page-title">Points Configuration</h2>
      <div className="charts-grid">
        <div className="chart-card">
          <div className="card-header">
            <h3>Payment Speed Slabs</h3>
            <button className="btn btn-primary btn-sm" onClick={() => setShowSlabForm(!showSlabForm)}><FiPlus /> Add Slab</button>
          </div>
          {showSlabForm && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              <input type="number" placeholder="Min Days" value={slabForm.minDays} onChange={(e) => setSlabForm({ ...slabForm, minDays: parseInt(e.target.value) })} style={{ width: 80 }} />
              <input type="number" placeholder="Max Days" value={slabForm.maxDays} onChange={(e) => setSlabForm({ ...slabForm, maxDays: parseInt(e.target.value) })} style={{ width: 80 }} />
              <select value={slabForm.modifierType} onChange={(e) => setSlabForm({ ...slabForm, modifierType: e.target.value })}>
                <option value="bonus">Bonus</option>
                <option value="base">Base</option>
                <option value="penalty">Penalty</option>
              </select>
              <input type="number" placeholder="Value %" value={slabForm.modifierValue} onChange={(e) => setSlabForm({ ...slabForm, modifierValue: parseFloat(e.target.value) })} style={{ width: 80 }} />
              <button className="btn btn-primary btn-sm" onClick={handleAddSlab}>Save</button>
            </div>
          )}
          <table className="data-table">
            <thead>
              <tr><th>Payment Days</th><th>Points Modifier</th><th>Action</th></tr>
            </thead>
            <tbody>
              {slabs.map((s) => (
                <tr key={s.id}>
                  <td>{s.minDays} - {s.maxDays > 9000 ? '∞' : s.maxDays} Days</td>
                  <td>
                    <span style={{ color: s.modifierType === 'bonus' ? '#3fb950' : s.modifierType === 'penalty' ? '#f85149' : '#8b949e' }}>
                      {s.modifierType === 'bonus' ? `+${s.modifierValue}% Bonus` : s.modifierType === 'penalty' ? `${s.modifierValue}% Penalty` : 'Base (1x)'}
                    </span>
                  </td>
                  <td>
                    <button className="icon-btn danger" onClick={() => handleDeleteSlab(s.id)}><FiTrash2 /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="info-box" style={{ marginTop: 12 }}>Slabs are automatically applied based on the difference between Invoice Date and actual Payment Date.</div>
        </div>

        <div className="chart-card">
          <h3>Product Rule Builder</h3>
          <div className="rule-builder">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span className="rule-label">IF</span>
              <span>Condition is met:</span>
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              <select value={ruleForm.conditionField} onChange={(e) => setRuleForm({ ...ruleForm, conditionField: e.target.value })}>
                <option value="Product Category">Product Category</option>
                <option value="Product Name">Product Name</option>
                <option value="SKU">SKU</option>
              </select>
              <select value={ruleForm.conditionOperator} onChange={(e) => setRuleForm({ ...ruleForm, conditionOperator: e.target.value })}>
                <option value="Equals">Equals</option>
                <option value="Contains">Contains</option>
                <option value="Starts With">Starts With</option>
              </select>
              <input value={ruleForm.conditionValue} onChange={(e) => setRuleForm({ ...ruleForm, conditionValue: e.target.value })} placeholder="Value" />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span className="rule-label then">THEN</span>
              <span>Apply this action:</span>
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              <select value={ruleForm.actionType} onChange={(e) => setRuleForm({ ...ruleForm, actionType: e.target.value })}>
                <option value="Multiply Base Points By">Multiply Base Points By</option>
              </select>
              <input type="number" step="0.1" value={ruleForm.actionValue} onChange={(e) => setRuleForm({ ...ruleForm, actionValue: parseFloat(e.target.value) })} style={{ width: 80 }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input type="checkbox" checked={ruleForm.isStackable} onChange={(e) => setRuleForm({ ...ruleForm, isStackable: e.target.checked })} />
                Is Stackable
              </label>
              <button className="btn btn-primary btn-sm" onClick={handleAddRule}>Save Rule</button>
            </div>
          </div>
          <h4 style={{ marginTop: 16 }}>Active Rules</h4>
          {rules.map((r) => (
            <div key={r.id} className="rule-item">
              <span>IF {r.conditionField} {r.conditionOperator} "{r.conditionValue}" THEN {r.actionType} {r.actionValue}</span>
              <button className="icon-btn danger" onClick={() => handleDeleteRule(r.id)}><FiTrash2 /></button>
            </div>
          ))}
        </div>
      </div>

      <div className="chart-card" style={{ marginTop: 20 }}>
        <h3>Live Calculation Preview</h3>
        <div className="preview-grid">
          <div className="preview-item">
            <span>Base Product Points:</span><strong>500 pts</strong>
          </div>
          <div className="preview-item">
            <span>Product Category:</span><strong>Premium</strong>
          </div>
          <div className="preview-item">
            <span>Payment Speed:</span><strong>5 Days</strong>
          </div>
        </div>
        <div className="preview-flow">
          <div className="preview-step"><div className="step-value">{basePoints}</div><div className="step-label">Base Points</div></div>
          <div className="preview-arrow">→</div>
          <div className="preview-step"><div className="step-value">x {premiumMultiplier}</div><div className="step-label">Premium Rule</div></div>
          <div className="preview-arrow">→</div>
          <div className="preview-step"><div className="step-value">+{fastPayBonus}%</div><div className="step-label">Fast Pay Bonus</div></div>
          <div className="preview-arrow">→</div>
          <div className="preview-step final"><div className="step-value">{finalPoints}</div><div className="step-label">FINAL AWARD</div></div>
        </div>
      </div>
    </div>
  );
};

export default PointsConfig;
