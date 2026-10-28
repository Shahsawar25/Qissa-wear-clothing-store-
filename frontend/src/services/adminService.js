import api from './api';

export const adminService = {
  getDashboardStats() {
    return api.get('/orders/dashboard-stats');
  },

  getAllProducts(params) {
    return api.get('/products', { params });
  },

  getProductById(id) {
    return api.get(`/products/${id}`);
  },

  createProduct(data) {
    return api.post('/products', data);
  },

  updateProduct(id, data) {
    return api.put(`/products/${id}`, data);
  },

  deleteProduct(id) {
    return api.delete(`/products/${id}`);
  },

  getAllOrders() {
    return api.get('/orders');
  },

  getOrderById(id) {
    return api.get(`/orders/${id}`);
  },

  updateOrderStatus(id, status) {
    return api.put(`/orders/${id}/status`, { status });
  },

  getCategories() {
    return api.get('/categories');
  },

  getUsers(params) {
    return api.get('/users', { params });
  },

  getProductCategories() {
    return api.get('/categories');
  },

  updateProductStock(id, variantIndex, stock) {
    return api.patch(`/products/${id}/stock`, { variantIndex, stock });
  },

  toggleProductStatus(id) {
    return api.patch(`/products/${id}/toggle-status`);
  },
};
