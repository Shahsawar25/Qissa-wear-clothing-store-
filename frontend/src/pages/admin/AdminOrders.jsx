import { useEffect, useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Search, Loader, X, ExternalLink, Package, AlertCircle, ChevronDown,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { orderService } from '../../services/orderService';
import OrderStatusBadge from '../../components/orders/OrderStatusBadge';
import OrderTimeline from '../../components/orders/OrderTimeline';
import './admin.css';

const STATUS_FILTERS = ['All', 'Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'];

const STATUS_TRANSITIONS = {
  Pending: ['Confirmed', 'Cancelled'],
  Confirmed: ['Shipped', 'Cancelled'],
  Shipped: ['Delivered'],
  Delivered: [],
  Cancelled: [],
};

const PAYMENT_COLORS = {
  Unpaid: { bg: '#fef2f2', text: '#b33a2e', dot: '#b33a2e' },
  Paid: { bg: '#f0fdf4', text: '#1a7a3a', dot: '#1a7a3a' },
};

function PaymentBadge({ status }) {
  const c = PAYMENT_COLORS[status] || { bg: '#f5f5f5', text: '#666', dot: '#666' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      fontSize: 12, fontWeight: 600, padding: '3px 10px',
      borderRadius: 999, background: c.bg, color: c.text,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.dot }} />
      {status}
    </span>
  );
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-PK', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

function formatCurrency(amount) {
  return `PKR ${(amount || 0).toLocaleString()}`;
}

export default function AdminOrders() {
  const navigate = useNavigate();
  const { user, token } = useSelector((s) => s.auth);

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updating, setUpdating] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const [paymentDropdownOpen, setPaymentDropdownOpen] = useState(null);

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (!token) { navigate('/login'); return; }
    if (!isAdmin) { navigate('/'); return; }
  }, [token, isAdmin, navigate]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { data } = await orderService.getAllOrders();
      setOrders(data.data || []);
    } catch (err) {
      toast.error('Failed to load orders');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin && token) fetchOrders();
  }, [isAdmin, token]);

  const filtered = useMemo(() => {
    let list = orders;
    if (search.trim()) {
      const term = search.trim().toLowerCase();
      list = list.filter((o) => {
        const name = o.user?.name || '';
        const email = o.user?.email || '';
        const orderNum = o.orderNumber || '';
        return name.toLowerCase().includes(term) ||
          email.toLowerCase().includes(term) ||
          orderNum.toLowerCase().includes(term);
      });
    }
    if (statusFilter !== 'All') {
      list = list.filter((o) => o.status === statusFilter);
    }
    return list;
  }, [orders, search, statusFilter]);

  const handleStatusUpdate = async (orderId, newStatus) => {
    setUpdating(orderId);
    setDropdownOpen(null);
    try {
      await orderService.updateOrderStatus(orderId, newStatus);
      setOrders((prev) =>
        prev.map((o) => (o._id === orderId ? { ...o, status: newStatus } : o)),
      );
      if (selectedOrder?._id === orderId) {
        setSelectedOrder((prev) => ({ ...prev, status: newStatus }));
      }
      toast.success(`Order status updated to "${newStatus}".`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdating(null);
    }
  };

  const handlePaymentUpdate = async (orderId) => {
    setUpdating(orderId);
    setPaymentDropdownOpen(null);
    try {
      await orderService.updatePaymentStatus(orderId, 'Paid');
      setOrders((prev) =>
        prev.map((o) => (o._id === orderId ? { ...o, paymentStatus: 'Paid' } : o)),
      );
      if (selectedOrder?._id === orderId) {
        setSelectedOrder((prev) => ({ ...prev, paymentStatus: 'Paid' }));
      }
      toast.success('Payment status updated to "Paid".');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update payment status');
    } finally {
      setUpdating(null);
    }
  };

  const dropdownStyle = {
    position: 'absolute', top: '100%', left: 0, zIndex: 50,
    background: 'var(--admin-white)',
    border: '1px solid var(--admin-border)',
    borderRadius: 'var(--admin-radius-sm)',
    boxShadow: 'var(--admin-shadow-lg)',
    minWidth: 160, padding: 4, marginTop: 4,
  };

  const dropdownItemStyle = {
    display: 'flex', alignItems: 'center', gap: 8,
    width: '100%', padding: '8px 12px', border: 'none',
    background: 'none', cursor: 'pointer', fontSize: 13,
    borderRadius: 6, color: 'var(--admin-text)',
    fontFamily: 'var(--font-body)',
  };

  if (!token || !isAdmin) return null;

  if (loading) {
    return <div className="admin-loading"><Loader size={24} /><p>Loading orders...</p></div>;
  }

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Orders</h1>
          <p className="admin-page-subtitle">
            {orders.length} {orders.length === 1 ? 'order' : 'orders'} total
          </p>
        </div>
      </div>

      <div className="admin-toolbar">
        <div className="admin-search-wrap">
          <Search size={16} />
          <input
            type="text"
            className="admin-search-input-field"
            placeholder="Search by order number, customer name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="admin-search-clear" onClick={() => setSearch('')}>
              <X size={14} />
            </button>
          )}
        </div>

        <div className="admin-filter-group">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f}
              className={`admin-filter-chip${statusFilter === f ? ' admin-filter-chip--active' : ''}`}
              onClick={() => setStatusFilter(f)}
            >
              {f === 'All' ? 'All Orders' : f}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="admin-empty">
          <Package size={40} strokeWidth={1} />
          <h3>No orders found</h3>
          <p>{search ? 'Try a different search term.' : 'No orders match the selected filter.'}</p>
        </div>
      ) : (
        <div className="admin-card">
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Total</th>
                  <th>Method</th>
                  <th>Payment Status</th>
                  <th>Order Status</th>
                  <th style={{ width: 40 }} />
                </tr>
              </thead>
              <tbody>
                {filtered.map((order) => {
                  const allowedNext = STATUS_TRANSITIONS[order.status] || [];
                  const canMarkPaid = order.paymentStatus !== 'Paid';
                  return (
                    <tr key={order._id}>
                      <td style={{ fontWeight: 600, fontSize: 12 }}>{order.orderNumber}</td>
                      <td>
                        <div>
                          <div style={{ fontWeight: 500, fontSize: 13 }}>{order.user?.name || 'N/A'}</div>
                          <div style={{ fontSize: 11, color: 'var(--admin-text-muted)' }}>{order.user?.email || ''}</div>
                        </div>
                      </td>
                      <td style={{ color: 'var(--admin-text-muted)', fontSize: 12 }}>{formatDate(order.createdAt)}</td>
                      <td style={{ fontWeight: 600, fontSize: 12 }}>{formatCurrency(order.total)}</td>
                      <td style={{ fontSize: 12 }}>{order.paymentMethod || 'COD'}</td>
                      <td>
                        <div style={{ position: 'relative' }}>
                          <button
                            className="admin-btn admin-btn--sm"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                            onClick={() => setPaymentDropdownOpen(
                              paymentDropdownOpen === order._id ? null : order._id,
                            )}
                            disabled={updating === order._id || !canMarkPaid}
                          >
                            {updating === order._id ? (
                              <Loader size={12} />
                            ) : (
                              <>
                                <PaymentBadge status={order.paymentStatus} />
                                {canMarkPaid && <ChevronDown size={12} />}
                              </>
                            )}
                          </button>
                          {paymentDropdownOpen === order._id && canMarkPaid && (
                            <div style={dropdownStyle}>
                              <button
                                style={dropdownItemStyle}
                                onClick={() => handlePaymentUpdate(order._id)}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--admin-accent-light)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                              >
                                <PaymentBadge status="Paid" />
                                <span>Mark as Paid</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <div style={{ position: 'relative' }}>
                          <button
                            className="admin-btn admin-btn--sm"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                            onClick={() => setDropdownOpen(dropdownOpen === order._id ? null : order._id)}
                            disabled={updating === order._id}
                          >
                            {updating === order._id ? (
                              <Loader size={12} />
                            ) : (
                              <>
                                <OrderStatusBadge status={order.status} />
                                {allowedNext.length > 0 && <ChevronDown size={12} />}
                              </>
                            )}
                          </button>
                          {dropdownOpen === order._id && allowedNext.length > 0 && (
                            <div style={dropdownStyle}>
                              {allowedNext.map((nextStatus) => (
                                <button
                                  key={nextStatus}
                                  style={dropdownItemStyle}
                                  onClick={() => handleStatusUpdate(order._id, nextStatus)}
                                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--admin-accent-light)'}
                                  onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                                >
                                  <OrderStatusBadge status={nextStatus} />
                                  <span>Mark as {nextStatus}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="admin-actions">
                          <button className="admin-btn--icon" title="View Details" onClick={() => setSelectedOrder(order)}>
                            <ExternalLink size={14} />
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
      )}

      {/* Mobile cards */}
      <div style={{ display: 'none' }}>
        {filtered.map((order) => {
          const allowedNext = STATUS_TRANSITIONS[order.status] || [];
          const canMarkPaid = order.paymentStatus !== 'Paid';
          return (
            <div key={order._id} style={{
              background: 'var(--admin-white)',
              borderRadius: 'var(--admin-radius)',
              padding: 16, marginBottom: 12,
              boxShadow: 'var(--admin-shadow)',
              border: '1px solid var(--admin-border)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontWeight: 700, fontSize: 13 }}>{order.orderNumber}</span>
                <OrderStatusBadge status={order.status} />
              </div>
              <div style={{ fontSize: 13, color: 'var(--admin-text-secondary)' }}>{order.user?.name || 'N/A'}</div>
              <div style={{ fontSize: 12, color: 'var(--admin-text-muted)', marginBottom: 8 }}>{order.user?.email || ''}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--admin-text-muted)', flexWrap: 'wrap', marginBottom: 8 }}>
                <span style={{ fontWeight: 600, color: 'var(--admin-text)' }}>{formatCurrency(order.total)}</span>
                <span>|</span>
                <PaymentBadge status={order.paymentStatus} />
                <span>|</span>
                <span>{order.paymentMethod || 'COD'}</span>
                <span>|</span>
                <span>{formatDate(order.createdAt)}</span>
              </div>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
                {canMarkPaid && (
                  <button
                    className="admin-btn admin-btn--sm admin-btn--success"
                    disabled={updating === order._id}
                    onClick={() => handlePaymentUpdate(order._id)}
                  >
                    {updating === order._id ? <Loader size={12} /> : 'Mark Paid'}
                  </button>
                )}
                {allowedNext.map((nextStatus) => (
                  <button
                    key={nextStatus}
                    className={`admin-btn admin-btn--sm ${nextStatus === 'Cancelled' ? 'admin-btn--danger' : 'admin-btn--primary'}`}
                    disabled={updating === order._id}
                    onClick={() => handleStatusUpdate(order._id, nextStatus)}
                  >
                    {updating === order._id ? <Loader size={12} /> : `Mark ${nextStatus}`}
                  </button>
                ))}
              </div>
              <button className="admin-btn admin-btn--sm" onClick={() => setSelectedOrder(order)}>
                <ExternalLink size={13} /> View Details
              </button>
            </div>
          );
        })}
      </div>

      <style>{`
        @media (max-width: 768px) {
          .admin-table-wrap { display: none; }
          [style*="display: none"] { display: block !important; }
        }
      `}</style>

      {/* Details Modal */}
      {selectedOrder && (
        <div className="admin-modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()} style={{ width: 'min(600px, calc(100% - 32px))' }}>
            <div className="admin-modal-header">
              <div>
                <h2>{selectedOrder.orderNumber}</h2>
                <span style={{ fontSize: 12, color: 'var(--admin-text-muted)' }}>{formatDate(selectedOrder.createdAt)}</span>
              </div>
              <button className="admin-modal-close" onClick={() => setSelectedOrder(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="admin-modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              <div style={{ marginBottom: 20 }}>
                <h4 style={{ fontSize: 13, fontWeight: 600, margin: '0 0 12px' }}>Order Progress</h4>
                <OrderTimeline status={selectedOrder.status} />
              </div>

              <div style={{ marginBottom: 20 }}>
                <h4 style={{ fontSize: 13, fontWeight: 600, margin: '0 0 8px' }}>Customer Information</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div>
                    <span style={{ fontSize: 11, color: 'var(--admin-text-muted)', display: 'block' }}>Name</span>
                    <span style={{ fontSize: 13 }}>{selectedOrder.user?.name || 'N/A'}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: 11, color: 'var(--admin-text-muted)', display: 'block' }}>Email</span>
                    <span style={{ fontSize: 13 }}>{selectedOrder.user?.email || 'N/A'}</span>
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <h4 style={{ fontSize: 13, fontWeight: 600, margin: '0 0 8px' }}>Shipping Address</h4>
                <div style={{ fontSize: 13, lineHeight: 1.6 }}>
                  <p style={{ margin: 0 }}>{selectedOrder.address?.fullName}</p>
                  <p style={{ margin: 0 }}>{selectedOrder.address?.phone}</p>
                  <p style={{ margin: 0 }}>{selectedOrder.address?.streetAddress}</p>
                  <p style={{ margin: 0 }}>
                    {selectedOrder.address?.city}, {selectedOrder.address?.provinceState}{' '}
                    {selectedOrder.address?.postalCode}
                  </p>
                  <p style={{ margin: 0 }}>{selectedOrder.address?.country}</p>
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <h4 style={{ fontSize: 13, fontWeight: 600, margin: '0 0 8px' }}>
                  Ordered Products ({selectedOrder.items?.length})
                </h4>
                {selectedOrder.items.map((item, idx) => (
                  <div key={idx} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '8px 0', borderBottom: '1px solid var(--admin-border)',
                    fontSize: 13,
                  }}>
                    <div>
                      <div style={{ fontWeight: 500 }}>{item.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--admin-text-muted)' }}>
                        {item.color} / {item.size} &times; {item.quantity}
                      </div>
                    </div>
                    <div style={{ fontWeight: 600 }}>
                      {formatCurrency(item.price * item.quantity)}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ marginBottom: 20 }}>
                <h4 style={{ fontSize: 13, fontWeight: 600, margin: '0 0 8px' }}>Payment Details</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 13 }}>
                  <div>
                    <span style={{ fontSize: 11, color: 'var(--admin-text-muted)', display: 'block' }}>Method</span>
                    <span>{selectedOrder.paymentMethod || 'COD'}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: 11, color: 'var(--admin-text-muted)', display: 'block' }}>Status</span>
                    <PaymentBadge status={selectedOrder.paymentStatus} />
                  </div>
                  <div>
                    <span style={{ fontSize: 11, color: 'var(--admin-text-muted)', display: 'block' }}>Subtotal</span>
                    <span>{formatCurrency(selectedOrder.subtotal)}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: 11, color: 'var(--admin-text-muted)', display: 'block' }}>Shipping</span>
                    <span>{formatCurrency(selectedOrder.shipping)}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: 11, color: 'var(--admin-text-muted)', display: 'block' }}>Total</span>
                    <span style={{ fontWeight: 700 }}>{formatCurrency(selectedOrder.total)}</span>
                  </div>
                  {selectedOrder.stripePaymentIntent && (
                    <div style={{ gridColumn: '1 / -1' }}>
                      <span style={{ fontSize: 11, color: 'var(--admin-text-muted)', display: 'block' }}>Stripe ID</span>
                      <span style={{ fontSize: 11, fontFamily: 'monospace' }}>{selectedOrder.stripePaymentIntent}</span>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <h4 style={{ fontSize: 13, fontWeight: 600, margin: '0 0 8px' }}>Update Payment Status</h4>
                {selectedOrder.paymentStatus !== 'Paid' ? (
                  <button
                    className="admin-btn admin-btn--sm admin-btn--success"
                    disabled={updating === selectedOrder._id}
                    onClick={() => handlePaymentUpdate(selectedOrder._id)}
                  >
                    {updating === selectedOrder._id ? <Loader size={12} /> : null}
                    Mark as Paid
                  </button>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--admin-text-muted)', fontSize: 13 }}>
                    <AlertCircle size={16} />
                    <span>Payment has already been received.</span>
                  </div>
                )}
              </div>

              {STATUS_TRANSITIONS[selectedOrder.status]?.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <h4 style={{ fontSize: 13, fontWeight: 600, margin: '0 0 8px' }}>Update Order Status</h4>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {STATUS_TRANSITIONS[selectedOrder.status].map((nextStatus) => (
                      <button
                        key={nextStatus}
                        className={`admin-btn admin-btn--sm ${
                          nextStatus === 'Cancelled' ? 'admin-btn--danger'
                          : 'admin-btn--primary'
                        }`}
                        disabled={updating === selectedOrder._id}
                        onClick={() => handleStatusUpdate(selectedOrder._id, nextStatus)}
                      >
                        {updating === selectedOrder._id ? <Loader size={12} /> : null}
                        Mark as {nextStatus}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {STATUS_TRANSITIONS[selectedOrder.status]?.length === 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--admin-text-muted)', fontSize: 13 }}>
                  <AlertCircle size={16} />
                  <span>This order is in its final state.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
