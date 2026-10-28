import { useEffect, useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Package, Search, Loader, Plus, Edit3, Trash2, Copy, X, ImageOff,
  ChevronDown, ChevronRight, Minus, Plus as PlusIcon, ToggleLeft, ToggleRight,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { adminService } from '../../services/adminService';
import './admin.css';

function formatCurrency(amount) {
  return `Rs.${(amount || 0).toLocaleString()}`;
}

const emptyProduct = {
  name: '', description: '', price: '', discountPrice: '',
  category: '', subCategory: '', fabric: '', brand: 'Qissa',
  isFeatured: false, isNewArrival: false, isActive: true,
  images: [], variants: [{ color: '', size: '', stock: 0 }],
};

const LOW_STOCK_THRESHOLD = 5;

export default function AdminProducts() {
  const navigate = useNavigate();
  const { user, token } = useSelector((s) => s.auth);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyProduct);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [toggling, setToggling] = useState(null);
  const [stockUpdating, setStockUpdating] = useState(null);
  const [expandedRow, setExpandedRow] = useState(null);
  const limit = 10;

  useEffect(() => {
    if (!token || user?.role !== 'admin') { navigate('/login'); return; }
    fetchProducts();
  }, [token, user, navigate, page]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = { page, limit };
      if (search.trim()) params.search = search.trim();
      const { data } = await adminService.getAllProducts(params);
      setProducts(data.data || []);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchProducts();
  };

  const totalStock = (variants) => {
    return variants?.reduce((sum, v) => sum + (v.stock || 0), 0) || 0;
  };

  const isLowStock = (variants) => {
    return variants?.some((v) => v.stock <= LOW_STOCK_THRESHOLD) || false;
  };

  const getMinStock = (variants) => {
    return Math.min(...(variants?.map((v) => v.stock) || [0]));
  };

  const openCreate = () => {
    setForm({ ...emptyProduct, variants: [{ color: '', size: '', stock: 0 }] });
    setModal('create');
  };

  const openEdit = (productId) => {
    const product = products.find((p) => p._id === productId);
    if (!product) return;
    setForm({
      name: product.name || '',
      description: product.description || '',
      price: product.price || '',
      discountPrice: product.discountPrice || '',
      category: product.category || '',
      subCategory: product.subCategory || '',
      fabric: product.fabric || '',
      brand: product.brand || 'Qissa',
      isFeatured: product.isFeatured || false,
      isNewArrival: product.isNewArrival || false,
      isActive: product.isActive ?? true,
      images: product.images || [],
      variants: product.variants?.length ? product.variants : [{ color: '', size: '', stock: 0 }],
    });
    setModal(productId);
  };

  const handleSave = async () => {
    if (!form.name || !form.price || !form.category) {
      toast.error('Name, price, and category are required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        price: Number(form.price),
        discountPrice: form.discountPrice ? Number(form.discountPrice) : 0,
        slug: form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        variants: form.variants.filter((v) => v.color || v.size),
      };
      if (modal === 'create') {
        await adminService.createProduct(payload);
        toast.success('Product created');
      } else {
        await adminService.updateProduct(modal, payload);
        toast.success('Product updated');
      }
      setModal(null);
      fetchProducts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    setDeleting(id);
    try {
      await adminService.deleteProduct(id);
      toast.success('Product deleted');
      fetchProducts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    } finally {
      setDeleting(null);
    }
  };

  const handleDuplicate = async (product) => {
    try {
      const payload = {
        ...product,
        name: `${product.name} (Copy)`,
        slug: `${product.slug}-copy-${Date.now()}`,
      };
      delete payload._id;
      delete payload.__v;
      delete payload.createdAt;
      delete payload.updatedAt;
      await adminService.createProduct(payload);
      toast.success('Product duplicated');
      fetchProducts();
    } catch (err) {
      toast.error('Failed to duplicate product');
    }
  };

  const handleToggleStatus = async (id) => {
    setToggling(id);
    try {
      const { data } = await adminService.toggleProductStatus(id);
      setProducts((prev) =>
        prev.map((p) => (p._id === id ? { ...p, isActive: data.data.isActive } : p)),
      );
      toast.success(data.data.isActive ? 'Product activated' : 'Product deactivated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to toggle status');
    } finally {
      setToggling(null);
    }
  };

  const handleStockChange = async (productId, variantIndex, newStock) => {
    if (newStock < 0) return;
    setStockUpdating(`${productId}-${variantIndex}`);
    try {
      await adminService.updateProductStock(productId, variantIndex, newStock);
      setProducts((prev) =>
        prev.map((p) => {
          if (p._id !== productId) return p;
          const newVariants = [...(p.variants || [])];
          newVariants[variantIndex] = { ...newVariants[variantIndex], stock: newStock };
          return { ...p, variants: newVariants };
        }),
      );
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update stock');
    } finally {
      setStockUpdating(null);
    }
  };

  const addVariant = () => {
    setForm({ ...form, variants: [...form.variants, { color: '', size: '', stock: 0 }] });
  };

  const removeVariant = (idx) => {
    if (form.variants.length <= 1) return;
    setForm({ ...form, variants: form.variants.filter((_, i) => i !== idx) });
  };

  const updateVariant = (idx, field, value) => {
    const updated = [...form.variants];
    updated[idx] = { ...updated[idx], [field]: value };
    setForm({ ...form, variants: updated });
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return products;
    const term = search.toLowerCase();
    return products.filter((p) =>
      p.name?.toLowerCase().includes(term) ||
      p.category?.toLowerCase().includes(term)
    );
  }, [products, search]);

  if (!token || user?.role !== 'admin') return null;

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Products</h1>
          <p className="admin-page-subtitle">{products.length} products total</p>
        </div>
        <button className="admin-btn admin-btn--primary" onClick={openCreate}>
          <PlusIcon size={16} /> Add Product
        </button>
      </div>

      <div className="admin-toolbar">
        <div className="admin-search-wrap">
          <Search size={16} />
          <input
            type="text"
            className="admin-search-input-field"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          {search && (
            <button className="admin-search-clear" onClick={() => { setSearch(''); fetchProducts(); }}>
              <X size={14} />
            </button>
          )}
        </div>
        <button className="admin-btn" onClick={handleSearch}>
          <Search size={14} /> Search
        </button>
      </div>

      {loading ? (
        <div className="admin-loading"><Loader size={24} /><p>Loading products...</p></div>
      ) : filtered.length === 0 ? (
        <div className="admin-empty">
          <Package size={40} strokeWidth={1} />
          <h3>No products found</h3>
          <p>{search ? 'Try a different search.' : 'Add your first product.'}</p>
        </div>
      ) : (
        <>
          <div className="admin-card">
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th style={{ width: 40 }}></th>
                    <th style={{ width: 50 }}></th>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Variants</th>
                    <th>Status</th>
                    <th style={{ width: 200 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((product) => {
                    const expanded = expandedRow === product._id;
                    const lowStock = isLowStock(product.variants);
                    return (
                      <tr key={product._id}>
                        <td>
                          <button
                            className="admin-btn--icon"
                            onClick={() => setExpandedRow(expanded ? null : product._id)}
                          >
                            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                          </button>
                        </td>
                        <td>
                          {product.images?.[0]?.url ? (
                            <img src={product.images[0].url} alt="" className="admin-product-img" />
                          ) : (
                            <div className="admin-product-img-placeholder">
                              <ImageOff size={16} />
                            </div>
                          )}
                        </td>
                        <td style={{ fontWeight: 600, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {product.name}
                        </td>
                        <td style={{ color: 'var(--admin-text-muted)' }}>{product.category}</td>
                        <td style={{ fontWeight: 600 }}>
                          {formatCurrency(product.price)}
                          {product.discountPrice > 0 && (
                            <span style={{ fontSize: 11, color: '#b33a2e', marginLeft: 6, textDecoration: 'line-through' }}>
                              {formatCurrency(product.discountPrice)}
                            </span>
                          )}
                        </td>
                        <td>
                          <span style={{ fontWeight: 600, color: lowStock ? '#b33a2e' : 'inherit' }}>
                            {totalStock(product.variants)}
                          </span>
                          {lowStock && (
                            <span className="admin-badge admin-badge--low" style={{ marginLeft: 6 }}>
                              <span className="admin-badge-dot" /> Low
                            </span>
                          )}
                        </td>
                        <td style={{ fontSize: 12, color: 'var(--admin-text-muted)' }}>
                          {product.variants?.length || 0}
                        </td>
                        <td>
                          <span className={`admin-badge ${product.isActive ? 'admin-badge--active' : 'admin-badge--inactive'}`}>
                            <span className="admin-badge-dot" />
                            {product.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td>
                          <div className="admin-actions">
                            <button
                              className="admin-btn--icon"
                              title={product.isActive ? 'Deactivate' : 'Activate'}
                              onClick={() => handleToggleStatus(product._id)}
                              disabled={toggling === product._id}
                            >
                              {toggling === product._id ? <Loader size={14} /> : product.isActive ? <ToggleRight size={14} style={{ color: '#1a7a3a' }} /> : <ToggleLeft size={14} style={{ color: '#b33a2e' }} />}
                            </button>
                            <button className="admin-btn--icon" title="Edit" onClick={() => openEdit(product._id)}>
                              <Edit3 size={14} />
                            </button>
                            <button className="admin-btn--icon" title="Duplicate" onClick={() => handleDuplicate(product)}>
                              <Copy size={14} />
                            </button>
                            <button
                              className="admin-btn--icon"
                              title="Delete"
                              style={{ color: deleting === product._id ? 'var(--admin-text-muted)' : '#b33a2e' }}
                              onClick={() => handleDelete(product._id)}
                              disabled={deleting === product._id}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="admin-pagination">
              <button className="admin-page-btn" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </button>
              <span className="admin-page-info">Page {page} of {totalPages}</span>
              <button className="admin-page-btn" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Expanded variant rows */}
      {expandedRow && (
        <div className="admin-card" style={{ marginTop: 16 }}>
          <div className="admin-card-header">
            <h3>Stock Variants — {products.find((p) => p._id === expandedRow)?.name}</h3>
            <button className="admin-btn admin-btn--sm" onClick={() => setExpandedRow(null)}>
              <X size={12} /> Close
            </button>
          </div>
          <div className="admin-card-body admin-card-body--compact">
            {(() => {
              const product = products.find((p) => p._id === expandedRow);
              if (!product || !product.variants?.length) {
                return <div className="admin-empty" style={{ padding: '24px 20px' }}><p>No variants defined</p></div>;
              }
              return (
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Color</th>
                        <th>Size</th>
                        <th>Stock</th>
                        <th style={{ width: 160 }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {product.variants.map((v, idx) => {
                        const low = v.stock <= LOW_STOCK_THRESHOLD;
                        const updating = stockUpdating === `${product._id}-${idx}`;
                        return (
                          <tr key={idx}>
                            <td style={{ fontWeight: 500 }}>{v.color || '—'}</td>
                            <td>{v.size || '—'}</td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <button
                                  className="admin-btn--icon"
                                  disabled={updating || v.stock <= 0}
                                  onClick={() => handleStockChange(product._id, idx, v.stock - 1)}
                                >
                                  {updating ? <Loader size={12} /> : <Minus size={14} />}
                                </button>
                                <span style={{
                                  fontWeight: 700, fontSize: 15, minWidth: 30, textAlign: 'center',
                                  color: low ? '#b33a2e' : 'inherit',
                                }}>
                                  {v.stock}
                                </span>
                                <button
                                  className="admin-btn--icon"
                                  disabled={updating}
                                  onClick={() => handleStockChange(product._id, idx, v.stock + 1)}
                                >
                                  <PlusIcon size={14} />
                                </button>
                                {low && (
                                  <span className="admin-badge admin-badge--low">
                                    <span className="admin-badge-dot" /> Low
                                  </span>
                                )}
                              </div>
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: 4 }}>
                                <button
                                  className="admin-btn admin-btn--sm"
                                  disabled={updating}
                                  onClick={() => handleStockChange(product._id, idx, v.stock + 10)}
                                >
                                  +10
                                </button>
                                <button
                                  className="admin-btn admin-btn--sm"
                                  disabled={updating || v.stock < 10}
                                  onClick={() => handleStockChange(product._id, idx, Math.max(0, v.stock - 10))}
                                >
                                  -10
                                </button>
                                <button
                                  className="admin-btn admin-btn--sm admin-btn--danger"
                                  disabled={updating || v.stock <= 0}
                                  onClick={() => handleStockChange(product._id, idx, 0)}
                                >
                                  Zero
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {modal && (
        <div className="admin-modal-overlay" onClick={() => setModal(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()} style={{ width: 'min(640px, calc(100% - 32px))' }}>
            <div className="admin-modal-header">
              <h2>{modal === 'create' ? 'Add Product' : 'Edit Product'}</h2>
              <button className="admin-modal-close" onClick={() => setModal(null)}><X size={18} /></button>
            </div>
            <div className="admin-modal-body" style={{ maxHeight: '55vh', overflowY: 'auto' }}>
              <div className="admin-form-group">
                <label>Product Name *</label>
                <input className="admin-form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Product name" />
              </div>
              <div className="admin-form-group">
                <label>Description</label>
                <textarea className="admin-form-textarea" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Product description" />
              </div>
              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label>Price *</label>
                  <input className="admin-form-input" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="0" />
                </div>
                <div className="admin-form-group">
                  <label>Discount Price</label>
                  <input className="admin-form-input" type="number" value={form.discountPrice} onChange={(e) => setForm({ ...form, discountPrice: e.target.value })} placeholder="0" />
                </div>
              </div>
              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label>Category *</label>
                  <input className="admin-form-input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="e.g. Unstitched" />
                </div>
                <div className="admin-form-group">
                  <label>Sub Category</label>
                  <input className="admin-form-input" value={form.subCategory} onChange={(e) => setForm({ ...form, subCategory: e.target.value })} placeholder="e.g. Summer Collection" />
                </div>
              </div>
              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label>Fabric</label>
                  <input className="admin-form-input" value={form.fabric} onChange={(e) => setForm({ ...form, fabric: e.target.value })} placeholder="e.g. Lawn" />
                </div>
                <div className="admin-form-group">
                  <label>Brand</label>
                  <input className="admin-form-input" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} placeholder="Qissa" />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })} />
                  Featured
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.isNewArrival} onChange={(e) => setForm({ ...form, isNewArrival: e.target.checked })} />
                  New Arrival
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
                  Active
                </label>
              </div>

              {/* Variants Section */}
              <div style={{ borderTop: '1px solid var(--admin-border)', paddingTop: 16, marginTop: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <h4 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Stock Variants</h4>
                  <button className="admin-btn admin-btn--sm" type="button" onClick={addVariant}>
                    <PlusIcon size={12} /> Add Variant
                  </button>
                </div>
                {form.variants.map((v, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                    <input
                      className="admin-form-input"
                      style={{ flex: 1 }}
                      placeholder="Color"
                      value={v.color}
                      onChange={(e) => updateVariant(idx, 'color', e.target.value)}
                    />
                    <input
                      className="admin-form-input"
                      style={{ width: 80 }}
                      placeholder="Size"
                      value={v.size}
                      onChange={(e) => updateVariant(idx, 'size', e.target.value)}
                    />
                    <input
                      className="admin-form-input"
                      style={{ width: 80 }}
                      type="number"
                      min="0"
                      placeholder="Stock"
                      value={v.stock}
                      onChange={(e) => updateVariant(idx, 'stock', Number(e.target.value))}
                    />
                    <button
                      className="admin-btn--icon"
                      style={{ color: '#b33a2e', flexShrink: 0 }}
                      disabled={form.variants.length <= 1}
                      onClick={() => removeVariant(idx)}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div className="admin-modal-footer">
              <button className="admin-btn" onClick={() => setModal(null)}>Cancel</button>
              <button className="admin-btn admin-btn--primary" onClick={handleSave} disabled={saving}>
                {saving ? <Loader size={14} /> : null}
                {modal === 'create' ? 'Create Product' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
