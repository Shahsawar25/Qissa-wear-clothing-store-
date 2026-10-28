import { useNavigate } from 'react-router-dom';
import { ChevronRight, Package } from 'lucide-react';
import OrderStatusBadge from './OrderStatusBadge';

const FALLBACK_IMAGE = '/assets/images/clothes/printed-lawn-3pc/IMG1.webp';

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-PK', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function OrderCard({ order }) {
  const navigate = useNavigate();
  const firstImage = order.items?.[0]?.image || FALLBACK_IMAGE;

  return (
    <div className="order-card" onClick={() => navigate(`/orders/${order._id}`)}>
      <div className="order-card-top">
        <div className="order-card-img-wrap">
          <img src={firstImage} alt={order.items?.[0]?.name || 'Order'} />
          {order.items?.length > 1 && (
            <span className="order-card-count">+{order.items.length - 1}</span>
          )}
        </div>

        <div className="order-card-info">
          <div className="order-card-head">
            <span className="order-card-number">{order.orderNumber}</span>
            <OrderStatusBadge status={order.status} />
          </div>
          <p className="order-card-date">{formatDate(order.createdAt)}</p>
          <div className="order-card-meta">
            <span className="order-card-items">
              <Package size={12} strokeWidth={1.5} />
              {order.items?.length || 0} {order.items?.length === 1 ? 'item' : 'items'}
            </span>
            <span className="order-card-sep">|</span>
            <span className="order-card-payment">
              {order.paymentMethod} · {order.paymentStatus}
            </span>
          </div>
        </div>

        <div className="order-card-right">
          <span className="order-card-amount">Rs.{order.total?.toLocaleString()}</span>
          <span className="order-card-view">
            View Details <ChevronRight size={12} />
          </span>
        </div>
      </div>
    </div>
  );
}
