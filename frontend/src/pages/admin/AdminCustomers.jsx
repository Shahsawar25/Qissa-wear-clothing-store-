import { useEffect, useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Users, Search, Loader, X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { adminService } from '../../services/adminService';
import './admin.css';

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-PK', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

export default function AdminCustomers() {
  const navigate = useNavigate();
  const { user, token } = useSelector((s) => s.auth);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 20;

  useEffect(() => {
    if (!token || user?.role !== 'admin') { navigate('/login'); return; }
    fetchCustomers();
  }, [token, user, navigate, page]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const params = { page, limit };
      if (search.trim()) params.search = search.trim();
      const { data } = await adminService.getUsers(params);
      setCustomers(data.data || []);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchCustomers();
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return customers;
    const term = search.toLowerCase();
    return customers.filter((c) =>
      c.name?.toLowerCase().includes(term) ||
      c.email?.toLowerCase().includes(term)
    );
  }, [customers, search]);

  if (!token || user?.role !== 'admin') return null;

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Customers</h1>
          <p className="admin-page-subtitle">{customers.length} registered users</p>
        </div>
      </div>

      <div className="admin-toolbar">
        <div className="admin-search-wrap">
          <Search size={16} />
          <input
            type="text"
            className="admin-search-input-field"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          {search && (
            <button className="admin-search-clear" onClick={() => { setSearch(''); fetchCustomers(); }}>
              <X size={14} />
            </button>
          )}
        </div>
        <button className="admin-btn" onClick={handleSearch}>
          <Search size={14} /> Search
        </button>
      </div>

      {loading ? (
        <div className="admin-loading"><Loader size={24} /><p>Loading customers...</p></div>
      ) : filtered.length === 0 ? (
        <div className="admin-empty">
          <Users size={40} strokeWidth={1} />
          <h3>No customers found</h3>
          <p>{search ? 'Try a different search.' : 'No customers registered yet.'}</p>
        </div>
      ) : (
        <>
          <div className="admin-card">
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Orders</th>
                    <th>Joined</th>
                    <th>Role</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => (
                    <tr key={c._id}>
                      <td style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 30, height: 30, borderRadius: '50%',
                          background: 'var(--admin-accent-light)',
                          color: 'var(--admin-accent)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 12, fontWeight: 700,
                        }}>
                          {c.name?.charAt(0)?.toUpperCase()}
                        </div>
                        {c.name}
                      </td>
                      <td style={{ color: 'var(--admin-text-muted)' }}>{c.email}</td>
                      <td>{c.orderCount || 0}</td>
                      <td style={{ color: 'var(--admin-text-muted)' }}>{formatDate(c.createdAt)}</td>
                      <td>
                        <span className={`admin-badge ${c.role === 'admin' ? 'admin-badge--shipped' : 'admin-badge--ok'}`}>
                          <span className="admin-badge-dot" />
                          {c.role}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="admin-pagination">
              <button className="admin-page-btn" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </button>
              <span className="admin-page-info">Page {page} of {totalPages}</span>
              <button className="admin-page-btn" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
