import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Settings, Store, MapPin, Truck, Percent, CircleDollarSign, Save,
} from 'lucide-react';
import toast from 'react-hot-toast';
import './admin.css';

export default function AdminSettings() {
  const navigate = useNavigate();
  const { user, token } = useSelector((s) => s.auth);

  const [form, setForm] = useState({
    storeName: 'Qissa Wear',
    storeAddress: 'F-10 Markaz, Islamabad, Pakistan',
    shippingCost: '250',
    taxRate: '0',
    currency: 'PKR',
  });

  const [saving, setSaving] = useState(false);

  if (!token || user?.role !== 'admin') {
    navigate('/login');
    return null;
  }

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    toast.success('Settings saved');
    setSaving(false);
  };

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Settings</h1>
          <p className="admin-page-subtitle">Manage your store configuration</p>
        </div>
        <button className="admin-btn admin-btn--primary" onClick={handleSave} disabled={saving}>
          <Save size={16} /> {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      <div style={{ display: 'grid', gap: 16, maxWidth: 640 }}>
        {/* Store Information */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h3><Store size={16} style={{ marginRight: 8, verticalAlign: 'middle' }} /> Store Information</h3>
          </div>
          <div className="admin-card-body">
            <div className="admin-form-group">
              <label>Store Name</label>
              <input
                className="admin-form-input"
                value={form.storeName}
                onChange={(e) => setForm({ ...form, storeName: e.target.value })}
              />
            </div>
            <div className="admin-form-group">
              <label>Store Address</label>
              <textarea
                className="admin-form-textarea"
                value={form.storeAddress}
                onChange={(e) => setForm({ ...form, storeAddress: e.target.value })}
              />
            </div>
            <div className="admin-form-group">
              <label>Store Logo</label>
              <div style={{
                border: '2px dashed var(--admin-border)',
                borderRadius: 'var(--admin-radius-sm)',
                padding: 24,
                textAlign: 'center',
                color: 'var(--admin-text-muted)',
                fontSize: 13,
                cursor: 'pointer',
              }}>
                Upload logo (200x200px recommended)
              </div>
            </div>
          </div>
        </div>

        {/* Shipping & Pricing */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h3><Truck size={16} style={{ marginRight: 8, verticalAlign: 'middle' }} /> Shipping & Pricing</h3>
          </div>
          <div className="admin-card-body">
            <div className="admin-form-row">
              <div className="admin-form-group">
                <label><Truck size={14} style={{ marginRight: 4 }} /> Shipping Cost</label>
                <input
                  className="admin-form-input"
                  type="number"
                  value={form.shippingCost}
                  onChange={(e) => setForm({ ...form, shippingCost: e.target.value })}
                />
              </div>
              <div className="admin-form-group">
                <label><Percent size={14} style={{ marginRight: 4 }} /> Tax Rate (%)</label>
                <input
                  className="admin-form-input"
                  type="number"
                  value={form.taxRate}
                  onChange={(e) => setForm({ ...form, taxRate: e.target.value })}
                />
              </div>
            </div>
            <div className="admin-form-group">
              <label><CircleDollarSign size={14} style={{ marginRight: 4 }} /> Currency</label>
              <select
                className="admin-form-select"
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
              >
                <option value="PKR">PKR - Pakistani Rupee</option>
                <option value="USD">USD - US Dollar</option>
              </select>
            </div>
          </div>
        </div>

        {/* Save button (bottom) */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button className="admin-btn admin-btn--primary" onClick={handleSave} disabled={saving}>
            <Save size={16} /> {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}
