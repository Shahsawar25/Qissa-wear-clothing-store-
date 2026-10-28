import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ArrowLeft, Loader, Package, CreditCard, MapPin, Receipt } from 'lucide-react';
import { orderService } from '../services/orderService';
import OrderStatusBadge from '../components/orders/OrderStatusBadge';
import OrderTimeline from '../components/orders/OrderTimeline';
import './order-details.css';

const FALLBACK_IMAGE = '/assets/images/clothes/printed-lawn-3pc/IMG1.webp';

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-PK', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function SectionHead({ icon: Icon, title }) {
  return (
    <div className="od-section-head">
      <Icon size={16} strokeWidth={1.5} />
      <h3>{title}</h3>
    </div>
  );
}

export default function OrderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useSelector((s) => s.auth);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    let cancelled = false;

    const load = async () => {
      try {
        const { data } = await orderService.getOrderById(id);
        if (!cancelled) setOrder(data.data);
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.message || 'Order not found.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [id, token, navigate]);

  if (!token) return null;

  if (loading) {
    return (
      <div className="od-page">
        <div className="od-loading">
          <Loader size={24} className="spin" />
          <p>Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="od-page">
        <div className="od-container">
          <button type="button" className="od-back" onClick={() => navigate('/orders')}>
            <ArrowLeft size={14} /> Back to Orders
          </button>
          <div className="od-error">
            <h2>Order not found</h2>
            <p>{error || 'This order could not be loaded.'}</p>
            <button type="button" className="od-btn od-btn-primary" onClick={() => navigate('/orders')}>
              Go to My Orders
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="od-page">
      <div className="od-container">
        <button type="button" className="od-back" onClick={() => navigate('/orders')}>
          <ArrowLeft size={14} /> Back to Orders
        </button>

        {/* Header */}
        <div className="od-header">
          <div className="od-header-left">
            <h1 className="od-title">{order.orderNumber}</h1>
            <p className="od-date">Placed on {formatDate(order.createdAt)}</p>
          </div>
          <OrderStatusBadge status={order.status} />
        </div>

        {/* Timeline */}
        <section className="od-section">
          <SectionHead icon={Receipt} title="Order Progress" />
          <OrderTimeline status={order.status} />
        </section>

        <div className="od-grid">
          {/* Left Column */}
          <div className="od-grid-main">
            {/* Items */}
            <section className="od-section">
              <SectionHead icon={Package} title="Ordered Products" />
              <div className="od-items">
                {order.items.map((item, idx) => {
                  const itemTotal = item.price * item.quantity;
                  return (
                    <div key={idx} className="od-item">
                      <div className="od-item-img">
                        <img src={item.image || FALLBACK_IMAGE} alt={item.name} />
                      </div>
                      <div className="od-item-info">
                        <p className="od-item-name">{item.name}</p>
                        <p className="od-item-variant">{item.color} / {item.size}</p>
                        <p className="od-item-qty">Qty: {item.quantity}</p>
                      </div>
                      <div className="od-item-right">
                        <p className="od-item-price">Rs.{item.price.toLocaleString()}</p>
                        <p className="od-item-total">Rs.{itemTotal.toLocaleString()}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Shipping */}
            <section className="od-section">
              <SectionHead icon={MapPin} title="Shipping Information" />
              <div className="od-address">
                <p className="od-address-name">{order.address.fullName}</p>
                <p className="od-address-detail">{order.address.phone}</p>
                <p className="od-address-detail">{order.address.streetAddress}</p>
                <p className="od-address-detail">
                  {order.address.city}, {order.address.provinceState} {order.address.postalCode}
                </p>
                <p className="od-address-detail">{order.address.country}</p>
              </div>
            </section>
          </div>

          {/* Right Column */}
          <div className="od-grid-side">
            {/* Payment */}
            <section className="od-section">
              <SectionHead icon={CreditCard} title="Payment Details" />
              <div className="od-payment">
                <div className="od-payment-row">
                  <span>Method</span>
                  <span>{order.paymentMethod}</span>
                </div>
                <div className="od-payment-row">
                  <span>Status</span>
                  <span className={`od-payment-status ${order.paymentStatus === 'Paid' ? 'paid' : 'unpaid'}`}>
                    {order.paymentStatus}
                  </span>
                </div>
                {order.stripePaymentIntent && (
                  <div className="od-payment-row od-payment-id">
                    <span>Stripe ID</span>
                    <span className="od-payment-mono">{order.stripePaymentIntent}</span>
                  </div>
                )}
              </div>
            </section>

            {/* Price Summary */}
            <section className="od-section">
              <SectionHead icon={Receipt} title="Price Summary" />
              <div className="od-price">
                <div className="od-price-row">
                  <span>Subtotal</span>
                  <span>Rs.{order.subtotal.toLocaleString()}</span>
                </div>
                <div className="od-price-row">
                  <span>Shipping</span>
                  <span>Rs.{order.shipping.toLocaleString()}</span>
                </div>
                <div className="od-price-row od-price-total">
                  <span>Total</span>
                  <span>Rs.{order.total.toLocaleString()}</span>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
