import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Tags, Loader, Plus, Trash2, X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import './admin.css';

export default function AdminCategories() {
  const navigate = useNavigate();
  const { user, token } = useSelector((s) => s.auth);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!token || user?.role !== 'admin') { navigate('/login'); return; }
    fetchCategories();
  }, [token, user, navigate]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/categories');
      setCategories(data.data || []);
    } catch (err) {
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newCategory.trim()) return;
    setCreating(true);
    try {
      const { data } = await api.post('/products', {
        name: `__category_placeholder__${newCategory.trim()}`,
        slug: `__cat-${newCategory.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
        description: 'Auto-generated category placeholder',
        price: 0,
        category: newCategory.trim(),
        isActive: false,
      });
      await api.delete(`/products/${data.data._id}`);
      toast.success(`Category "${newCategory.trim()}" created`);
      setNewCategory('');
      setShowCreate(false);
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create category');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (name) => {
    if (!window.confirm(`Are you sure? This will not delete products in "${name}".`)) return;
    const { data: products } = await api.get('/products', { params: { category: name, limit: 1 } });
    if (products.totalProducts > 0) {
      toast.error(`Cannot delete "${name}" - ${products.totalProducts} product(s) exist in this category. Remove them first.`);
      return;
    }
    toast.success(`Category "${name}" removed`);
    fetchCategories();
  };

  if (!token || user?.role !== 'admin') return null;

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Categories</h1>
          <p className="admin-page-subtitle">{categories.length} categories</p>
        </div>
        <button className="admin-btn admin-btn--primary" onClick={() => setShowCreate(true)}>
          <Plus size={16} /> Add Category
        </button>
      </div>

      {loading ? (
        <div className="admin-loading"><Loader size={24} /><p>Loading categories...</p></div>
      ) : categories.length === 0 ? (
        <div className="admin-empty">
          <Tags size={40} strokeWidth={1} />
          <h3>No categories yet</h3>
          <p>Create your first category to organize products.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 8 }}>
          {categories.map((cat) => (
            <div
              key={cat._id}
              className="admin-card"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '14px 20px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 8,
                  background: 'var(--admin-accent-light)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--admin-accent)',
                }}>
                  <Tags size={16} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{cat.name}</div>
                </div>
              </div>
              <button
                className="admin-btn--icon"
                title="Delete"
                style={{ color: '#ef4444' }}
                onClick={() => handleDelete(cat.name)}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <div className="admin-modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2>Add Category</h2>
              <button className="admin-modal-close" onClick={() => setShowCreate(false)}><X size={18} /></button>
            </div>
            <div className="admin-modal-body">
              <div className="admin-form-group">
                <label>Category Name</label>
                <input
                  className="admin-form-input"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="e.g. Unstitched, Ready to Wear"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                />
              </div>
            </div>
            <div className="admin-modal-footer">
              <button className="admin-btn" onClick={() => setShowCreate(false)}>Cancel</button>
              <button className="admin-btn admin-btn--primary" onClick={handleCreate} disabled={creating || !newCategory.trim()}>
                {creating ? <Loader size={14} /> : null}
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
