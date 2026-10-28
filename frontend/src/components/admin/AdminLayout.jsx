import { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Tags,
  Users,
  BarChart3,
  Settings,
  LogOut,
  Bell,
  Search,
  Menu,
  X,
  ChevronDown,
  ShoppingCart,
  AlertTriangle,
  User,
  ExternalLink,
  Loader,
} from 'lucide-react';
import { logout } from '../../features/auth/authSlice';
import api from '../../services/api';
import './AdminLayout.css';

const SIDEBAR_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/admin/dashboard' },
  { icon: ShoppingBag, label: 'Orders', path: '/admin/orders' },
  { icon: Package, label: 'Products', path: '/admin/products' },
  { icon: Tags, label: 'Categories', path: '/admin/categories' },
  { icon: Users, label: 'Customers', path: '/admin/customers' },
  { icon: BarChart3, label: 'Analytics', path: '/admin/analytics' },
  { icon: Settings, label: 'Settings', path: '/admin/settings' },
];

function formatDate() {
  return new Date().toLocaleDateString('en-PK', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);
  const notifRef = useRef(null);
  const userMenuRef = useRef(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notifLoading, setNotifLoading] = useState(false);

  useEffect(() => {
    function handleClick(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    if (notifOpen && notifications.length === 0 && !notifLoading) {
      fetchNotifications();
    }
  }, [notifOpen]);

  useEffect(() => {
    if (searchOpen) {
      setSearchQuery('');
      setSearchResults(null);
    }
  }, [searchOpen]);

  let searchTimer = useRef(null);
  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults(null); return; }
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => performSearch(searchQuery.trim()), 300);
    return () => clearTimeout(searchTimer.current);
  }, [searchQuery]);

  const fetchNotifications = async () => {
    setNotifLoading(true);
    try {
      const [ordersRes, productsRes] = await Promise.allSettled([
        api.get('/orders?limit=100'),
        api.get('/products?limit=100'),
      ]);
      const items = [];
      if (ordersRes.status === 'fulfilled') {
        const orders = ordersRes.value.data?.data || [];
        const pending = orders.filter((o) => o.status === 'Pending');
        pending.slice(0, 3).forEach((o) => {
          items.push({
            id: o._id,
            type: 'order',
            icon: ShoppingCart,
            color: '#8a6700',
            bg: '#fdf0d5',
            title: `New Order ${o.orderNumber}`,
            desc: `Rs.${(o.total || 0).toLocaleString()} — ${o.user?.name || 'Unknown'}`,
            action: () => { setNotifOpen(false); navigate('/admin/orders'); },
          });
        });
      }
      if (productsRes.status === 'fulfilled') {
        const products = productsRes.value.data?.data || [];
        const low = products.filter((p) =>
          p.variants?.some((v) => v.stock <= 5)
        );
        low.slice(0, 3).forEach((p) => {
          const minStock = Math.min(...(p.variants?.map((v) => v.stock) || [0]));
          items.push({
            id: p._id,
            type: 'stock',
            icon: AlertTriangle,
            color: '#b33a2e',
            bg: '#fef0ee',
            title: `Low Stock: ${p.name}`,
            desc: `${minStock} remaining — restock soon`,
            action: () => { setNotifOpen(false); navigate('/admin/products'); },
          });
        });
      }
      setNotifications(items);
    } catch {
      setNotifications([]);
    } finally {
      setNotifLoading(false);
    }
  };

  const performSearch = async (query) => {
    setSearching(true);
    try {
      const [ordersRes, productsRes, usersRes] = await Promise.allSettled([
        api.get(`/orders`),
        api.get(`/products?search=${encodeURIComponent(query)}&limit=5`),
        api.get(`/users?search=${encodeURIComponent(query)}&limit=5`),
      ]);
      const results = [];

      if (ordersRes.status === 'fulfilled') {
        const orders = ordersRes.value.data?.data || [];
        const matched = orders.filter(
          (o) =>
            o.orderNumber?.toLowerCase().includes(query.toLowerCase()) ||
            o.user?.name?.toLowerCase().includes(query.toLowerCase()) ||
            o.user?.email?.toLowerCase().includes(query.toLowerCase())
        ).slice(0, 3);
        matched.forEach((o) => {
          results.push({
            id: o._id,
            type: 'Order',
            name: o.orderNumber,
            meta: `${o.user?.name || 'N/A'} — Rs.${(o.total || 0).toLocaleString()}`,
            action: () => { setSearchOpen(false); navigate('/admin/orders'); },
          });
        });
      }

      if (productsRes.status === 'fulfilled') {
        const products = productsRes.value.data?.data || [];
        products.slice(0, 3).forEach((p) => {
          results.push({
            id: p._id,
            type: 'Product',
            name: p.name,
            meta: `Rs.${(p.price || 0).toLocaleString()} — ${p.category || ''}`,
            action: () => { setSearchOpen(false); navigate('/admin/products'); },
          });
        });
      }

      if (usersRes.status === 'fulfilled') {
        const users = usersRes.value.data?.data || [];
        users.slice(0, 3).forEach((u) => {
          results.push({
            id: u._id,
            type: 'Customer',
            name: u.name,
            meta: u.email,
            action: () => { setSearchOpen(false); navigate('/admin/customers'); },
          });
        });
      }

      setSearchResults(results);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <div className="admin-shell">
      {sidebarOpen && (
        <div className="admin-sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`admin-sidebar ${sidebarOpen ? 'admin-sidebar--open' : ''}`}>
        <div className="admin-sidebar-header">
          <div className="admin-sidebar-logo">
            <span className="admin-logo-title">QISSA</span>
            <span className="admin-logo-subtitle">Wear</span>
          </div>
          <button className="admin-sidebar-close" onClick={() => setSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <nav className="admin-sidebar-nav">
          {SIDEBAR_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/admin/dashboard'}
              className={({ isActive }) =>
                `admin-nav-item ${isActive ? 'admin-nav-item--active' : ''}`
              }
              onClick={() => setSidebarOpen(false)}
            >
              <item.icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <button className="admin-nav-item admin-nav-item--logout" onClick={handleLogout}>
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <div className="admin-topbar-left">
            <button className="admin-topbar-menu-btn" onClick={() => setSidebarOpen(true)}>
              <Menu size={20} />
            </button>
            <div className="admin-topbar-search" onClick={() => setSearchOpen(true)}>
              <Search size={16} />
              <span className="admin-topbar-search-text">Search orders, products, customers...</span>
            </div>
          </div>

          <div className="admin-topbar-right">
            <div className="admin-topbar-date">{formatDate()}</div>

            <div style={{ position: 'relative' }} ref={notifRef}>
              <button className="admin-topbar-icon-btn" onClick={() => setNotifOpen(!notifOpen)}>
                <Bell size={18} />
                {notifications.length > 0 && <span className="admin-topbar-notif-dot" />}
              </button>
              {notifOpen && (
                <div className="admin-notif-dropdown">
                  <div className="admin-notif-header">
                    <span>Notifications</span>
                    <span style={{ fontSize: 11, color: 'var(--admin-text-muted)', fontWeight: 400 }}>
                      {notifications.length} alerts
                    </span>
                  </div>
                  {notifLoading ? (
                    <div style={{ padding: 24, textAlign: 'center', color: 'var(--admin-text-muted)', fontSize: 12 }}>
                      Loading...
                    </div>
                  ) : notifications.length === 0 ? (
                    <div style={{ padding: 24, textAlign: 'center', color: 'var(--admin-text-muted)', fontSize: 12 }}>
                      No notifications
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div key={n.id} className="admin-notif-item" onClick={n.action}>
                        <div className="admin-notif-icon" style={{ background: n.bg, color: n.color }}>
                          <n.icon size={14} />
                        </div>
                        <div className="admin-notif-content">
                          <div className="admin-notif-title">{n.title}</div>
                          <div className="admin-notif-desc">{n.desc}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            <div style={{ position: 'relative' }} ref={userMenuRef}>
              <div className="admin-topbar-user" onClick={() => setUserMenuOpen(!userMenuOpen)}>
                <div className="admin-topbar-avatar">
                  {user?.name?.charAt(0)?.toUpperCase() || 'A'}
                </div>
                <div className="admin-topbar-user-info">
                  <span className="admin-topbar-user-name">{user?.name || 'Administrator'}</span>
                  <span className="admin-topbar-user-role">Admin</span>
                </div>
                <ChevronDown size={14} className="admin-topbar-chevron" />
              </div>
              {userMenuOpen && (
                <div className="admin-user-dropdown">
                  <button className="admin-user-dropdown-item" onClick={() => { setUserMenuOpen(false); navigate('/admin/dashboard'); }}>
                    <LayoutDashboard size={14} /> Dashboard
                  </button>
                  <button className="admin-user-dropdown-item" onClick={() => { setUserMenuOpen(false); navigate('/admin/settings'); }}>
                    <Settings size={14} /> Settings
                  </button>
                  <div className="admin-user-dropdown-divider" />
                  <button className="admin-user-dropdown-item" onClick={() => { setUserMenuOpen(false); handleLogout(); }} style={{ color: 'var(--admin-accent)' }}>
                    <LogOut size={14} /> Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="admin-content">
          <Outlet />
        </main>
      </div>

      {searchOpen && (
        <div className="admin-search-overlay" onClick={() => setSearchOpen(false)}>
          <div className="admin-search-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-search-input-wrap">
              <Search size={18} />
              <input
                type="text"
                className="admin-search-input"
                placeholder="Search orders, products, customers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
              <button className="admin-search-close-btn" onClick={() => setSearchOpen(false)}>
                <X size={18} />
              </button>
            </div>
            {searching ? (
              <div className="admin-search-loading">
                <Loader size={14} /> Searching...
              </div>
            ) : searchResults === null ? (
              <div className="admin-search-empty">Type to search across orders, products, and customers</div>
            ) : searchResults.length === 0 ? (
              <div className="admin-search-empty">No results found for &ldquo;{searchQuery}&rdquo;</div>
            ) : (
              <div className="admin-search-results">
                {searchResults.map((r, i) => (
                  <button key={`${r.type}-${r.id}-${i}`} className="admin-search-result-item" onClick={r.action}>
                    <div className="admin-search-result-icon">
                      {r.type === 'Order' ? <ShoppingBag size={14} /> : r.type === 'Product' ? <Package size={14} /> : <User size={14} />}
                    </div>
                    <div className="admin-search-result-info">
                      <div className="admin-search-result-name">{r.name}</div>
                      <div className="admin-search-result-meta">{r.meta}</div>
                    </div>
                    <span className="admin-search-result-type">{r.type}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
