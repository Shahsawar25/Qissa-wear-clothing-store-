import axios from 'axios';

const api = axios.create({
  baseURL: 'https://backend-pink-beta-24.vercel.app/api',
  // baseURL: 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('qissa-token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('qissa-token');
      window.location.hash = '';
      window.dispatchEvent(new Event('auth-logout'));
    }
    return Promise.reject(err);
  },
);

export default api;
