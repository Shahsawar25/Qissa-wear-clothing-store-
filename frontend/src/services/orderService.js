import api from './api';

export const orderService = {
  checkoutOrder(addressId) {
    return api.post('/orders/checkout', { addressId });
  },

  getMyOrders() {
    return api.get('/orders/my');
  },

  getOrderById(orderId) {
    return api.get(`/orders/${orderId}`);
  },

  getAllOrders() {
    return api.get('/orders');
  },

  updateOrderStatus(orderId, status) {
    return api.put(`/orders/${orderId}/status`, { status });
  },

  updatePaymentStatus(orderId, paymentStatus) {
    return api.patch(`/orders/${orderId}/payment-status`, { paymentStatus });
  },
};
