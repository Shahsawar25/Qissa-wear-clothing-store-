import { useMemo, useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Search, ShoppingBag, User, Heart, X, ArrowRight, ChevronDown, Menu } from 'lucide-react';
import { catalogProducts, categoryConfig } from '../../data/catalog';
import { logout } from '../../features/auth/authSlice';
import { fetchCart } from '../../features/cart/cartSlice';
import CartDrawer from '../cart/CartDrawer';

const megaMenuItems = [
  {
    label: 'Women',
    path: '/category/new-arrivals',
    columns: [
      {
        title: 'Categories',
        links: [
          { name: 'New Arrivals', path: '/category/new-arrivals' },
          { name: 'Unstitched', path: '/category/unstitched' },
          { name: 'Ready to Wear', path: '/category/ready-to-wear' },
          { name: 'Formal', path: '/category/formal' },
          { name: 'Festive', path: '/category/formal' },
          { name: 'Bottoms', path: '/category/ready-to-wear' },
          { name: 'Shawls', path: '/category/shawls' },
          { name: 'Accessories', path: '/category/new-arrivals' },
        ],
      },
      {
        title: 'Collections',
        links: [
          { name: 'Summer Collection', path: '/category/new-arrivals' },
          { name: 'Winter Collection', path: '/category/unstitched' },
          { name: 'Eid Collection', path: '/category/formal' },
          { name: 'Wedding Collection', path: '/category/formal' },
          { name: 'Best Sellers', path: '/category/sale' },
          { name: 'Trending', path: '/category/new-arrivals' },
        ],
      },
    ],
  },
  {
    label: 'Collections',
    path: '/category/new-arrivals',
    columns: [
      {
        title: 'Seasonal',
        links: [
          { name: 'Summer Collection', path: '/category/new-arrivals' },
          { name: 'Winter Collection', path: '/category/unstitched' },
          { name: 'Eid Collection', path: '/category/formal' },
          { name: 'Wedding Collection', path: '/category/formal' },
        ],
      },
      {
        title: 'Featured',
        links: [
          { name: 'Best Sellers', path: '/category/sale' },
          { name: 'Trending', path: '/category/new-arrivals' },
          { name: 'New Arrivals', path: '/category/new-arrivals' },
        ],
      },
    ],
  },
  {
    label: 'Fabric',
    path: '/category/unstitched',
    columns: [
      {
        title: 'By Fabric',
        links: [
          { name: 'Lawn', path: '/category/unstitched' },
          { name: 'Chiffon', path: '/category/formal' },
          { name: 'Silk', path: '/category/ready-to-wear' },
          { name: 'Cotton', path: '/category/unstitched' },
          { name: 'Karandi', path: '/category/new-arrivals' },
          { name: 'Khaddar', path: '/category/sale' },
        ],
      },
    ],
  },
  { label: 'Sale', path: '/category/sale', sale: true },
  { label: 'About', path: '/about' },
  { label: 'Contact', path: '/contact' },
];

export default function Navbar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [cartOpen, setCartOpen] = useState(false);
  const [activeMega, setActiveMega] = useState(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState(null);
  const megaRef = useRef(null);
  const timeoutRef = useRef(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  const { token } = useSelector((s) => s.auth);
  const { totalItems } = useSelector((s) => s.cart);

  useEffect(() => {
    if (token) {
      dispatch(fetchCart());
    }
  }, [dispatch, token]);

  useEffect(() => {
    const handler = () => setCartOpen(true);
    window.addEventListener('qissa:cart-open', handler);
    return () => window.removeEventListener('qissa:cart-open', handler);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleMegaEnter = (index) => {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setActiveMega(index), 80);
  };

  const handleMegaLeave = () => {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setActiveMega(null), 150);
  };

  const handleMegaClick = (item) => {
    if (item.columns) {
      setMobileExpanded(mobileExpanded === item.label ? null : item.label);
    } else {
      navigate(item.path);
      setMobileNavOpen(false);
    }
  };

  const navLinks = [
    { name: 'New Arrivals', path: '/category/new-arrivals' },
    { name: 'Unstitched', path: '/category/unstitched' },
    { name: 'Ready To Wear', path: '/category/ready-to-wear' },
    { name: 'Formal', path: '/category/formal' },
    { name: 'Shawls', path: '/category/shawls' },
    { name: 'Sale', path: '/category/sale' },
  ];

  const quickResults = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) {
      return catalogProducts.slice(0, 6);
    }
    return catalogProducts
      .filter((product) => {
        return [product.title, product.fabric, product.color, product.categoryKey]
          .join(' ')
          .toLowerCase()
          .includes(term);
      })
      .slice(0, 8);
  }, [query]);

  const quickCategories = [
    'new-arrivals', 'unstitched', 'ready-to-wear', 'formal', 'shawls', 'sale', 'monochrome',
  ].map((key) => ({
    key,
    title: categoryConfig[key]?.title || key,
    path: `/category/${key}`,
  }));

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  return (
    <header className="navbar">
      <div className="container navbar-main">
        <div className="navbar-left">
          <button
            className="mobile-menu-btn icon-label"
            type="button"
            aria-label="Menu"
            onClick={() => setMobileNavOpen(true)}
          >
            <Menu size={18} strokeWidth={1.75} />
            <span>Menu</span>
          </button>

          <button
            className="icon-label search-trigger"
            type="button"
            aria-label="Search products"
            onClick={() => setSearchOpen(true)}
          >
            <Search size={18} strokeWidth={1.75} />
            <span>Search</span>
          </button>
        </div>

        <div className="brand-wrap">
          <Link to="/" className="brand-title">
            QISSA
          </Link>
          <p className="brand-subtitle">Wear</p>
        </div>

        <div className="navbar-actions">
          {token ? (
            <div className="user-dropdown" ref={userMenuRef}>
              <button type="button" className="icon-link" title="Account" aria-label="Account" onClick={() => setUserMenuOpen((prev) => !prev)}>
                <User size={20} strokeWidth={1.75} />
              </button>
              {userMenuOpen && (
                <div className="user-dropdown-menu">
                  <Link to="/orders" className="user-dropdown-item" onClick={() => setUserMenuOpen(false)}>
                    My Orders
                  </Link>
                  <button type="button" className="user-dropdown-item" onClick={handleLogout}>
                    Log Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="icon-link" title="Account" aria-label="Account">
              <User size={20} strokeWidth={1.75} />
            </Link>
          )}
          <Link to="/wishlist" className="icon-link" title="Wishlist" aria-label="Wishlist">
            <Heart size={20} strokeWidth={1.75} />
          </Link>
          <button type="button" className="icon-link cart-button" title="Cart" aria-label="Cart" onClick={() => setCartOpen(true)}>
            <ShoppingBag size={20} strokeWidth={1.75} />
            {totalItems > 0 && <span className="cart-dot">{totalItems > 99 ? '99+' : totalItems}</span>}
          </button>
        </div>
      </div>

      {/* Desktop Mega Menu */}
      <nav className="mega-nav" aria-label="Main navigation">
        <div className="container mega-nav-inner">
          {megaMenuItems.map((item, i) => (
            <div
              key={item.label}
              className="mega-nav-item"
              onMouseEnter={() => handleMegaEnter(i)}
              onMouseLeave={handleMegaLeave}
            >
              {item.columns ? (
                <>
                  <Link
                    to={item.path}
                    className={`mega-nav-link${item.sale ? ' mega-nav-link-sale' : ''}`}
                    onClick={(e) => {
                      if (item.columns) e.preventDefault();
                    }}
                  >
                    {item.label}
                    <ChevronDown size={12} strokeWidth={2.5} className="mega-nav-chevron" />
                  </Link>
                  {activeMega === i && (
                    <div className="mega-dropdown" onMouseEnter={() => clearTimeout(timeoutRef.current)}>
                      <div className="mega-dropdown-inner">
                        {item.columns.map((col) => (
                          <div key={col.title} className="mega-col">
                            <h4 className="mega-col-title">{col.title}</h4>
                            <ul className="mega-col-list">
                              {col.links.map((link) => (
                                <li key={link.name}>
                                  <Link to={link.path} className="mega-col-link" onClick={() => setActiveMega(null)}>
                                    {link.name}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                        <div className="mega-featured">
                          <div className="mega-featured-image">
                            <img src="/assets/images/pret.webp" alt="Featured" />
                          </div>
                          <div className="mega-featured-content">
                            <h4>New Season Edit</h4>
                            <p>Explore our latest arrivals with premium fabric finishes.</p>
                            <Link to="/category/new-arrivals" className="mega-featured-link" onClick={() => setActiveMega(null)}>
                              Shop Now <ArrowRight size={12} />
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <Link to={item.path} className={`mega-nav-link${item.sale ? ' mega-nav-link-sale' : ''}`}>
                  {item.label}
                </Link>
              )}
            </div>
          ))}
        </div>
      </nav>

      {/* Mobile Navigation Overlay */}
      {mobileNavOpen && (
        <div className="mobile-nav-overlay" role="dialog" aria-modal="true" aria-label="Site navigation">
          <div className="mobile-nav-backdrop" onClick={() => setMobileNavOpen(false)} />
          <div className="mobile-nav-panel">
            <div className="mobile-nav-header">
              <span className="mobile-nav-brand">QISSA</span>
              <button type="button" className="mobile-nav-close" onClick={() => setMobileNavOpen(false)} aria-label="Close menu">
                <X size={20} />
              </button>
            </div>
            <ul className="mobile-nav-list">
              {megaMenuItems.map((item) => (
                <li key={item.label} className="mobile-nav-item">
                  {item.columns ? (
                    <>
                      <button
                        type="button"
                        className="mobile-nav-toggle"
                        onClick={() => handleMegaClick(item)}
                      >
                        {item.label}
                        <ChevronDown
                          size={14}
                          strokeWidth={2.5}
                          className={`mobile-nav-chevron${mobileExpanded === item.label ? ' mobile-nav-chevron-open' : ''}`}
                        />
                      </button>
                      <div className={`mobile-submenu${mobileExpanded === item.label ? ' mobile-submenu-open' : ''}`}>
                        {item.columns.map((col) => (
                          <div key={col.title} className="mobile-sub-col">
                            <h4 className="mobile-sub-title">{col.title}</h4>
                            <ul className="mobile-sub-list">
                              {col.links.map((link) => (
                                <li key={link.name}>
                                  <Link
                                    to={link.path}
                                    className="mobile-sub-link"
                                    onClick={() => setMobileNavOpen(false)}
                                  >
                                    {link.name}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <Link
                      to={item.path}
                      className={`mobile-nav-direct${item.sale ? ' mobile-nav-direct-sale' : ''}`}
                      onClick={() => setMobileNavOpen(false)}
                    >
                      {item.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
            <div className="mobile-nav-footer">
              {token ? (
                <>
                  <Link to="/orders" className="mobile-nav-direct" onClick={() => setMobileNavOpen(false)}>My Orders</Link>
                  <button type="button" className="mobile-nav-direct mobile-nav-logout" onClick={handleLogout}>Log Out</button>
                </>
              ) : (
                <Link to="/login" className="mobile-nav-direct" onClick={() => setMobileNavOpen(false)}>Sign In</Link>
              )}
            </div>
          </div>
        </div>
      )}

      {searchOpen && (
        <div className="search-overlay" role="dialog" aria-modal="true" aria-label="Site search">
          <div className="search-backdrop" onClick={() => setSearchOpen(false)} />
          <div className="search-panel">
            <div className="search-panel-head">
              <div>
                <p className="search-panel-kicker">Search the collection</p>
                <h2>Find fabric, color, or product</h2>
              </div>
              <button type="button" className="search-close" onClick={() => setSearchOpen(false)} aria-label="Close search">
                <X size={18} />
              </button>
            </div>

            <label className="search-panel-input">
              <Search size={16} />
              <input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search lawn, chiffon, silk, black, sale..."
              />
            </label>

            <div className="search-panel-grid">
              <div className="search-panel-section">
                <h3>Quick categories</h3>
                <div className="search-category-list">
                  {quickCategories.map((category) => (
                    <Link
                      key={category.key}
                      to={category.path}
                      className="search-category-link"
                      onClick={() => setSearchOpen(false)}
                    >
                      <span>{category.title}</span>
                      <ArrowRight size={13} />
                    </Link>
                  ))}
                </div>
              </div>

              <div className="search-panel-section">
                <h3>Popular results</h3>
                <div className="search-result-list">
                  {quickResults.map((product) => (
                    <Link
                      key={product.id}
                      to={`/product/${product.id}`}
                      className="search-result-item"
                      onClick={() => setSearchOpen(false)}
                    >
                      <img src={product.images[0]} alt={product.title} />
                      <div>
                        <strong>{product.title}</strong>
                        <span>{product.fabric} • Rs.{product.price.toLocaleString()}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />
    </header>
  );
}
