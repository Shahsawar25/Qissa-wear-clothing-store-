import { useEffect, useState, useMemo, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp, ShoppingBag, Users, Package, IndianRupee,
  Loader, RefreshCw, AlertTriangle, Clock,
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import toast from 'react-hot-toast';
import api from '../../services/api';
import OrderStatusBadge from '../../components/orders/OrderStatusBadge';
import './admin.css';

function formatCurrency(amount) {
  return `PKR ${(amount || 0).toLocaleString()}`;
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-PK', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

const PERIODS = [
  { value: 'today', label: 'Today' },
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
  { value: '3m', label: 'Last 3 Months' },
  { value: '1y', label: 'Last Year' },
  { value: 'all', label: 'All Time' },
];

const STATUS_COLORS = {
  Pending: '#b2493c',
  Confirmed: '#c49a6c',
  Shipped: '#8a6700',
  Delivered: '#1a7a3a',
  Cancelled: '#b33a2e',
};

function InsightCard({ icon: Icon, label, value, color }) {
  return (
    <div className="admin-stat-card">
      <div className="admin-stat-card-info">
        <p>{label}</p>
        <h3 style={{ fontSize: 20 }}>{value}</h3>
      </div>
      <div className="admin-stat-card-icon" style={{ background: `${color}15`, color }}>
        <Icon size={18} />
      </div>
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="admin-chart-card">
      <div className="admin-chart-card-header">
        <div className="admin-skeleton" style={{ height: 16, width: 160 }} />
      </div>
      <div style={{ padding: 20 }}>
        <div className="admin-skeleton" style={{ height: 240, width: '100%', borderRadius: 8 }} />
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: '#fffdfb', border: '1px solid #e8ddd5',
        borderRadius: 8, padding: '10px 14px',
        boxShadow: '0 4px 12px rgba(31,23,18,0.1)',
        fontSize: 12,
      }}>
        <p style={{ fontWeight: 600, margin: '0 0 4px', color: '#1f1712' }}>{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ margin: 0, color: p.color }}>
            {p.name}: {p.name === 'Revenue' ? formatCurrency(p.value) : p.value.toLocaleString()}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function AdminAnalytics() {
  const navigate = useNavigate();
  const { user, token } = useSelector((s) => s.auth);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('all');

  const fetchAnalytics = useCallback(async (p) => {
    try {
      setLoading(true);
      const { data: res } = await api.get(`/dashboard/stats?period=${p}`);
      setData(res.data);
    } catch (err) {
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!token || user?.role !== 'admin') { navigate('/login'); return; }
    fetchAnalytics(period);
  }, [token, user, navigate, period, fetchAnalytics]);

  const stats = data?.stats || {};
  const monthlySales = data?.monthlySales || [];
  const categorySales = data?.categorySales || [];
  const topProducts = data?.topProducts || [];
  const insights = data?.insights || {};
  const recentOrders = data?.recentOrders || [];

  const revenueChartData = useMemo(() =>
    monthlySales.map((m) => ({
      month: new Date(m._id.year, m._id.month - 1).toLocaleDateString('en', { month: 'short', year: '2-digit' }),
      Revenue: m.revenue,
      Orders: m.orders,
    })),
  [monthlySales]);

  const ordersChartData = useMemo(() =>
    monthlySales.map((m) => ({
      month: new Date(m._id.year, m._id.month - 1).toLocaleDateString('en', { month: 'short' }),
      Orders: m.orders,
    })),
  [monthlySales]);

  const statusPieData = useMemo(() =>
    (stats.ordersByStatus || []).map((s) => ({
      name: s._id,
      value: s.count,
      color: STATUS_COLORS[s._id] || '#999',
    })),
  [stats.ordersByStatus]);

  const categoryBarData = useMemo(() =>
    categorySales.slice(0, 8).map((c) => ({
      name: c._id || 'Uncategorized',
      sold: c.totalSold,
    })),
  [categorySales]);

  const topProductsBarData = useMemo(() =>
    topProducts.slice(0, 8).map((p) => ({
      name: p.name?.length > 25 ? p.name.substring(0, 25) + '...' : (p.name || 'Unknown'),
      sold: p.totalSold,
      revenue: p.revenue,
    })),
  [topProducts]);

  if (loading && !data) {
    return (
      <div>
        <div className="admin-page-header">
          <div>
            <h1 className="admin-page-title">Analytics</h1>
            <p className="admin-page-subtitle">Business performance insights</p>
          </div>
        </div>
        <div className="admin-stats-grid">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="admin-stat-card">
              <div style={{ flex: 1 }}>
                <div className="admin-skeleton" style={{ height: 12, width: '60%', marginBottom: 8 }} />
                <div className="admin-skeleton" style={{ height: 24, width: '40%' }} />
              </div>
              <div className="admin-skeleton" style={{ width: 44, height: 44, borderRadius: 10 }} />
            </div>
          ))}
        </div>
        <ChartSkeleton />
        <ChartSkeleton />
      </div>
    );
  }

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Analytics</h1>
          <p className="admin-page-subtitle">
            {stats.totalOrders || 0} orders · {formatCurrency(stats.totalRevenue || 0)} revenue
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="admin-filter-group">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                className={`admin-filter-chip${period === p.value ? ' admin-filter-chip--active' : ''}`}
                onClick={() => setPeriod(p.value)}
              >
                {p.label}
              </button>
            ))}
          </div>
          <button className="admin-btn" onClick={() => fetchAnalytics(period)} disabled={loading}>
            {loading ? <Loader size={14} /> : <RefreshCw size={14} />}
          </button>
        </div>
      </div>

      {/* Quick Insights */}
      <div className="admin-stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))' }}>
        <InsightCard icon={IndianRupee} label="Revenue" value={formatCurrency(stats.totalRevenue)} color="#1a7a3a" />
        <InsightCard icon={ShoppingBag} label="Total Orders" value={stats.totalOrders || 0} color="#b2493c" />
        <InsightCard icon={Users} label="Customers" value={stats.totalCustomers || 0} color="#c49a6c" />
        <InsightCard icon={Package} label="Products" value={stats.totalProducts || 0} color="#6b21a8" />
        <InsightCard icon={TrendingUp} label="Avg. Order Value" value={formatCurrency(stats.averageOrderValue)} color="#1a56db" />
        <InsightCard icon={Clock} label="Paid Orders" value={stats.totalPaidOrders || 0} color="#1a7a3a" />
        <InsightCard icon={AlertTriangle} label="Pending" value={stats.pendingOrders || 0} color="#8a6700" />
        <InsightCard icon={AlertTriangle} label="Cancelled" value={stats.cancelledOrders || 0} color="#b33a2e" />
      </div>

      {/* Best Category & Product Highlight */}
      {(insights.bestCategory || insights.bestProduct) && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          {insights.bestCategory && (
            <div className="admin-card" style={{ flex: 1, minWidth: 200 }}>
              <div className="admin-card-body" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px' }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: '#fdf0d5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#b2493c' }}>
                  <Package size={16} />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--admin-text-muted)', fontWeight: 500 }}>Top Category</div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{insights.bestCategory.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--admin-text-muted)' }}>{insights.bestCategory.sold} items sold</div>
                </div>
              </div>
            </div>
          )}
          {insights.bestProduct && (
            <div className="admin-card" style={{ flex: 1, minWidth: 200 }}>
              <div className="admin-card-body" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px' }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: '#ede0ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b21a8' }}>
                  <TrendingUp size={16} />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--admin-text-muted)', fontWeight: 500 }}>Best Seller</div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{insights.bestProduct.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--admin-text-muted)' }}>{insights.bestProduct.sold} sold · {formatCurrency(insights.bestProduct.revenue)}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Revenue Trend Line Chart */}
      <div className="admin-chart-grid">
        <div className="admin-chart-card">
          <div className="admin-chart-card-header">
            <h3>Revenue Trend</h3>
          </div>
          {revenueChartData.length === 0 ? (
            <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--admin-text-muted)', fontSize: 13 }}>
              No revenue data for this period
            </div>
          ) : (
            <div style={{ padding: '16px 8px 8px' }}>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={revenueChartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8ddd5" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#7f736b' }} axisLine={{ stroke: '#e8ddd5' }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#7f736b' }} axisLine={false} tickLine={false} tickFormatter={(v) => `Rs.${(v / 1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="Revenue" stroke="#b2493c" strokeWidth={2} dot={{ fill: '#b2493c', r: 3 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Orders Trend Bar Chart */}
        <div className="admin-chart-card">
          <div className="admin-chart-card-header">
            <h3>Orders Per Month</h3>
          </div>
          {ordersChartData.length === 0 ? (
            <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--admin-text-muted)', fontSize: 13 }}>
              No order data for this period
            </div>
          ) : (
            <div style={{ padding: '16px 8px 8px' }}>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={ordersChartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8ddd5" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#7f736b' }} axisLine={{ stroke: '#e8ddd5' }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#7f736b' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="Orders" fill="#c49a6c" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      <div className="admin-chart-grid">
        {/* Order Distribution Donut */}
        <div className="admin-chart-card">
          <div className="admin-chart-card-header">
            <h3>Order Status Distribution</h3>
          </div>
          {statusPieData.length === 0 ? (
            <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--admin-text-muted)', fontSize: 13 }}>
              No order status data
            </div>
          ) : (
            <div style={{ padding: 8 }}>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={statusPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {statusPieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    iconSize={8}
                    formatter={(value) => <span style={{ fontSize: 12, color: '#433831' }}>{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Top Categories Horizontal Bar */}
        <div className="admin-chart-card">
          <div className="admin-chart-card-header">
            <h3>Top Selling Categories</h3>
          </div>
          {categoryBarData.length === 0 ? (
            <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--admin-text-muted)', fontSize: 13 }}>
              No category sales data
            </div>
          ) : (
            <div style={{ padding: '16px 8px 8px' }}>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={categoryBarData} layout="vertical" margin={{ top: 5, right: 20, left: 80, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8ddd5" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#7f736b' }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#433831' }} axisLine={false} tickLine={false} width={100} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="sold" fill="#c49a6c" radius={[0, 4, 4, 0]} maxBarSize={24} name="Sold" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      <div className="admin-chart-grid">
        {/* Top Products Horizontal Bar */}
        <div className="admin-chart-card">
          <div className="admin-chart-card-header">
            <h3>Top Selling Products</h3>
          </div>
          {topProductsBarData.length === 0 ? (
            <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--admin-text-muted)', fontSize: 13 }}>
              No product sales data
            </div>
          ) : (
            <div style={{ padding: '16px 8px 8px' }}>
              <ResponsiveContainer width="100%" height={Math.max(200, topProductsBarData.length * 32)}>
                <BarChart data={topProductsBarData} layout="vertical" margin={{ top: 5, right: 80, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8ddd5" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#7f736b' }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#433831' }} axisLine={false} tickLine={false} width={140} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="sold" fill="#b2493c" radius={[0, 4, 4, 0]} maxBarSize={20} name="Sold" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Recent Sales Summary */}
        <div className="admin-chart-card">
          <div className="admin-chart-card-header">
            <h3>Recent Sales</h3>
          </div>
          {recentOrders.length === 0 ? (
            <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--admin-text-muted)', fontSize: 13 }}>
              No recent orders
            </div>
          ) : (
            <div style={{ padding: 0 }}>
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Order</th>
                      <th>Customer</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((order) => (
                      <tr key={order._id}>
                        <td style={{ fontWeight: 600, fontSize: 12 }}>{order.orderNumber}</td>
                        <td style={{ fontSize: 12 }}>{order.user?.name || 'N/A'}</td>
                        <td style={{ fontWeight: 600, fontSize: 12 }}>{formatCurrency(order.total)}</td>
                        <td><OrderStatusBadge status={order.status} /></td>
                        <td style={{ fontSize: 11, color: 'var(--admin-text-muted)' }}>{formatDate(order.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
