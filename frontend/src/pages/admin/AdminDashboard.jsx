import { useEffect, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  IndianRupee,
  Package,
  Users,
  ShoppingCart,
  AlertTriangle,
  Loader,
  TrendingUp,
  BarChart3,
  Tags,
  Settings,
  ExternalLink,
  RefreshCw,
  PieChart,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import OrderStatusBadge from '../../components/orders/OrderStatusBadge';
import './admin.css';

function formatCurrency(amount) {
  return `Rs.${(amount || 0).toLocaleString()}`;
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-PK', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function StatCard({ icon: Icon, label, value, color, bg, onClick }) {
  return (
    <div className="admin-stat-card" onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
      <div className="admin-stat-card-info">
        <p>{label}</p>
        <h3>{value}</h3>
      </div>
      <div className="admin-stat-card-icon" style={{ background: bg, color }}>
        <Icon size={20} />
      </div>
    </div>
  );
}

function StatCardSkeleton() {
  return (
    <div className="admin-stat-card" style={{ padding: 20 }}>
      <div style={{ flex: 1 }}>
        <div className="admin-skeleton" style={{ height: 12, width: '60%', marginBottom: 8 }} />
        <div className="admin-skeleton" style={{ height: 28, width: '40%' }} />
      </div>
      <div className="admin-skeleton" style={{ width: 44, height: 44, borderRadius: 10 }} />
    </div>
  );
}

function MiniChart({ title, data, format, color }) {
  if (!data || data.length === 0) {
    return (
      <div className="admin-chart-card">
        <div className="admin-chart-card-header"><h3>{title}</h3></div>
        <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--admin-text-muted)', fontSize: 13 }}>
          No data available yet
        </div>
      </div>
    );
  }
  const maxVal = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="admin-chart-card">
      <div className="admin-chart-card-header">
        <h3>{title}</h3>
      </div>
      <div style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 100 }}>
          {data.map((d, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 9, color: 'var(--admin-text-muted)' }}>{format ? format(d.value) : d.value}</span>
              <div
                style={{
                  width: '100%',
                  height: `${Math.max((d.value / maxVal) * 80, 4)}px`,
                  background: color || 'var(--admin-accent)',
                  borderRadius: '4px 4px 0 0',
                  opacity: 0.8,
                  transition: 'height 0.3s',
                }}
              />
              <span style={{ fontSize: 9, color: 'var(--admin-text-muted)', transform: 'rotate(-45deg)', whiteSpace: 'nowrap' }}>
                {d.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, token } = useSelector((s) => s.auth);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { data: res } = await api.get('/dashboard/stats');
      setData(res.data);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to load dashboard data';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!token || user?.role !== 'admin') {
      navigate('/login');
      return;
    }
    fetchDashboard();
  }, [token, user, navigate, fetchDashboard]);

  if (loading) {
    return (
      <div>
        <div className="admin-page-header">
          <div>
            <h1 className="admin-page-title">Dashboard</h1>
            <p className="admin-page-subtitle">Loading your store data...</p>
          </div>
        </div>
        <div className="admin-stats-grid">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
        <div className="admin-card">
          <div className="admin-card-header">
            <div className="admin-skeleton" style={{ height: 16, width: 140 }} />
          </div>
          <div className="admin-card-body" style={{ padding: 0 }}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: '1px solid var(--admin-border)' }}>
                <div className="admin-skeleton admin-skeleton-avatar" />
                <div style={{ flex: 1 }}>
                  <div className="admin-skeleton" style={{ height: 12, width: '50%', marginBottom: 6 }} />
                  <div className="admin-skeleton" style={{ height: 10, width: '30%' }} />
                </div>
                <div className="admin-skeleton" style={{ height: 22, width: 60, borderRadius: 999 }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-error">
        <AlertTriangle size={40} />
        <h3>Failed to load dashboard</h3>
        <p>{error}</p>
        <button className="admin-btn admin-btn--primary" onClick={fetchDashboard}>
          <RefreshCw size={14} /> Retry
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="admin-empty">
        <Package size={40} strokeWidth={1} />
        <h3>No data available</h3>
        <p>Dashboard data could not be loaded.</p>
        <button className="admin-btn admin-btn--primary" onClick={fetchDashboard} style={{ marginTop: 8 }}>
          <RefreshCw size={14} /> Retry
        </button>
      </div>
    );
  }

  const stats = data.stats || {};
  const recentOrders = data.recentOrders || [];
  const lowStock = data.lowStockProducts || [];
  const latestCustomers = data.latestCustomers || [];
  const monthlySales = data.monthlySales || [];
  const categorySales = data.categorySales || [];

  const ordersByStatus = stats.ordersByStatus || [];
  const totalOrders = stats.totalOrders || 0;
  const totalRevenue = stats.totalRevenue || 0;

  const salesChartData = monthlySales.map((m) => ({
    label: new Date(m._id.year, m._id.month - 1).toLocaleDateString('en', { month: 'short' }),
    value: m.revenue,
  }));

  const ordersChartData = monthlySales.map((m) => ({
    label: new Date(m._id.year, m._id.month - 1).toLocaleDateString('en', { month: 'short' }),
    value: m.orders,
  }));

  const statusDistribution = ordersByStatus.map((s) => ({
    label: s._id,
    value: s.count,
    color: s._id === 'Delivered' ? '#1a7a3a'
      : s._id === 'Pending' ? '#8a6700'
      : s._id === 'Confirmed' ? '#1a56db'
      : s._id === 'Shipped' ? '#6b21a8'
      : '#b33a2e',
  }));

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Dashboard</h1>
          <p className="admin-page-subtitle">Your store at a glance</p>
        </div>
        <button className="admin-btn" onClick={fetchDashboard} disabled={loading}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Stat Cards — real data from backend, all clickable */}
      <div className="admin-stats-grid">
        <StatCard
          icon={ShoppingBag}
          label="Total Orders"
          value={totalOrders.toLocaleString()}
          color="#8a6700"
          bg="#fdf0d5"
          onClick={() => navigate('/admin/orders')}
        />
        <StatCard
          icon={IndianRupee}
          label="Revenue"
          value={formatCurrency(totalRevenue)}
          color="#1a7a3a"
          bg="#e0f7e6"
          onClick={() => navigate('/admin/analytics')}
        />
        <StatCard
          icon={Package}
          label="Products"
          value={(stats.totalProducts || 0).toLocaleString()}
          color="#6b21a8"
          bg="#ede0ff"
          onClick={() => navigate('/admin/products')}
        />
        <StatCard
          icon={Users}
          label="Customers"
          value={(stats.totalCustomers || 0).toLocaleString()}
          color="#1a56db"
          bg="#e0edff"
          onClick={() => navigate('/admin/customers')}
        />
      </div>

      {/* Quick Actions — all buttons navigate to real pages */}
      <div className="admin-card" style={{ marginBottom: 24 }}>
        <div className="admin-card-header">
          <h3>Quick Actions</h3>
        </div>
        <div className="admin-card-body">
          <div className="admin-quick-actions">
            <button className="admin-quick-action" onClick={() => navigate('/admin/orders')}>
              <div className="admin-quick-action-icon" style={{ background: '#fdf0d5', color: '#8a6700' }}>
                <ShoppingBag size={18} />
              </div>
              <span>View Orders</span>
            </button>
            <button className="admin-quick-action" onClick={() => navigate('/admin/products')}>
              <div className="admin-quick-action-icon" style={{ background: '#ede0ff', color: '#6b21a8' }}>
                <Package size={18} />
              </div>
              <span>Manage Products</span>
            </button>
            <button className="admin-quick-action" onClick={() => navigate('/admin/categories')}>
              <div className="admin-quick-action-icon" style={{ background: '#e0edff', color: '#1a56db' }}>
                <Tags size={18} />
              </div>
              <span>Categories</span>
            </button>
            <button className="admin-quick-action" onClick={() => navigate('/admin/customers')}>
              <div className="admin-quick-action-icon" style={{ background: '#e0f7e6', color: '#1a7a3a' }}>
                <Users size={18} />
              </div>
              <span>Customers</span>
            </button>
            <button className="admin-quick-action" onClick={() => navigate('/admin/analytics')}>
              <div className="admin-quick-action-icon" style={{ background: '#fdf0d5', color: '#8a6700' }}>
                <BarChart3 size={18} />
              </div>
              <span>Analytics</span>
            </button>
            <button className="admin-quick-action" onClick={() => navigate('/admin/settings')}>
              <div className="admin-quick-action-icon" style={{ background: '#fef0ee', color: '#b33a2e' }}>
                <Settings size={18} />
              </div>
              <span>Settings</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mini Charts — real data visualized as bar charts */}
      <div className="admin-chart-grid">
        <MiniChart title="Monthly Sales (Rs.)" data={salesChartData} format={(v) => `Rs.${(v / 1000).toFixed(0)}k`} color="#b2493c" />
        <MiniChart title="Orders Per Month" data={ordersChartData} format={(v) => v} color="#c49a6c" />
      </div>

      <div className="admin-chart-grid">
        <div className="admin-chart-card">
          <div className="admin-chart-card-header"><h3>Order Distribution</h3></div>
          <div style={{ padding: 16 }}>
            {statusDistribution.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 24, color: 'var(--admin-text-muted)', fontSize: 13 }}>No orders yet</div>
            ) : (
              statusDistribution.map((s) => (
                <div key={s.label} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                    <span style={{ fontWeight: 600 }}>{s.label}</span>
                    <span style={{ color: 'var(--admin-text-muted)' }}>{s.value}</span>
                  </div>
                  <div style={{ background: 'var(--admin-bg)', borderRadius: 999, height: 6, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: 999, background: s.color,
                      width: `${(s.value / Math.max(totalOrders, 1)) * 100}%`,
                      transition: 'width 0.3s',
                    }} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        <div className="admin-chart-card">
          <div className="admin-chart-card-header"><h3>Top Categories</h3></div>
          {categorySales.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 32, color: 'var(--admin-text-muted)', fontSize: 13 }}>No category data yet</div>
          ) : (
            <div style={{ padding: 16 }}>
              {categorySales.slice(0, 5).map((c, i) => {
                const maxSold = Math.max(...categorySales.map((cs) => cs.totalSold), 1);
                return (
                  <div key={i} style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
                      <span style={{ fontWeight: 600 }}>{c._id || 'Uncategorized'}</span>
                      <span style={{ color: 'var(--admin-text-muted)' }}>{c.totalSold} sold</span>
                    </div>
                    <div style={{ background: 'var(--admin-bg)', borderRadius: 999, height: 5, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', borderRadius: 999,
                        background: ['#b2493c', '#c49a6c', '#8a6700', '#6b21a8', '#1a56db'][i % 5],
                        width: `${(c.totalSold / maxSold) * 100}%`,
                        transition: 'width 0.3s',
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent Orders + Low Stock — side by side */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 24 }}>
        <div className="admin-card">
          <div className="admin-card-header">
            <h3>Recent Orders</h3>
            <button className="admin-btn admin-btn--sm" onClick={() => navigate('/admin/orders')}>
              View All
            </button>
          </div>
          <div className="admin-card-body admin-card-body--compact">
            {recentOrders.length === 0 ? (
              <div className="admin-empty" style={{ padding: '40px 20px' }}>
                <ShoppingCart size={32} strokeWidth={1} />
                <h3>No orders yet</h3>
                <p>Orders will appear here once customers start purchasing.</p>
              </div>
            ) : (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Order</th>
                      <th>Customer</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Payment</th>
                      <th>Amount</th>
                      <th style={{ width: 40 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((order) => (
                      <tr key={order._id}>
                        <td style={{ fontWeight: 600 }}>{order.orderNumber}</td>
                        <td>{order.user?.name || 'N/A'}</td>
                        <td style={{ color: 'var(--admin-text-muted)', fontSize: 12 }}>{formatDate(order.createdAt)}</td>
                        <td><OrderStatusBadge status={order.status} /></td>
                        <td>
                          <span style={{ fontSize: 12, color: order.paymentStatus === 'Paid' ? '#1a7a3a' : '#8a6700' }}>
                            {order.paymentStatus}
                          </span>
                        </td>
                        <td style={{ fontWeight: 600 }}>{formatCurrency(order.total)}</td>
                        <td>
                          <button className="admin-btn--icon" title="View Order" onClick={() => navigate('/admin/orders')}>
                            <ExternalLink size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="admin-card">
          <div className="admin-card-header">
            <h3>Low Stock</h3>
            <button className="admin-btn admin-btn--sm" onClick={() => navigate('/admin/products')}>
              Manage
            </button>
          </div>
          <div className="admin-card-body admin-card-body--compact">
            {lowStock.length === 0 ? (
              <div className="admin-empty" style={{ padding: '40px 20px' }}>
                <Package size={32} strokeWidth={1} />
                <h3>Well stocked</h3>
                <p>All products have sufficient inventory.</p>
              </div>
            ) : (
              <div>
                {lowStock.map((product) => {
                  const minStock = Math.min(...(product.variants?.map((v) => v.stock) || [0]));
                  return (
                    <div
                      key={product._id}
                      className="admin-lowstock-item"
                      onClick={() => navigate('/admin/products')}
                    >
                      {product.images?.[0]?.url ? (
                        <img src={product.images[0].url} alt="" className="admin-product-img" />
                      ) : (
                        <div className="admin-product-img-placeholder">
                          <Package size={16} />
                        </div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {product.name}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--admin-text-muted)', marginTop: 2 }}>
                          {product.category}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', marginRight: 8 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: minStock <= 0 ? '#b33a2e' : '#8a6700' }}>
                          {minStock}
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--admin-text-muted)' }}>left</div>
                      </div>
                      <span className={`admin-badge ${minStock <= 0 ? 'admin-badge--out' : 'admin-badge--low'}`}>
                        <span className="admin-badge-dot" />
                        {minStock <= 0 ? 'Out' : 'Low'}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Latest Customers */}
      <div className="admin-card">
        <div className="admin-card-header">
          <h3>Latest Customers</h3>
          <button className="admin-btn admin-btn--sm" onClick={() => navigate('/admin/customers')}>
            View All
          </button>
        </div>
        <div className="admin-card-body admin-card-body--compact">
          {latestCustomers.length === 0 ? (
            <div className="admin-empty" style={{ padding: '40px 20px' }}>
              <Users size={32} strokeWidth={1} />
              <h3>No customers yet</h3>
              <p>Customer registrations will appear here.</p>
            </div>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Email</th>
                    <th>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {latestCustomers.map((c) => (
                    <tr key={c._id}>
                      <td style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="admin-customer-avatar">
                          {c.name?.charAt(0)?.toUpperCase()}
                        </div>
                        {c.name}
                      </td>
                      <td style={{ color: 'var(--admin-text-muted)' }}>{c.email}</td>
                      <td style={{ color: 'var(--admin-text-muted)' }}>{formatDate(c.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
