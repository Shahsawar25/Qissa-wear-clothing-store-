import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, clearAuthError } from '../features/auth/authSlice';
import { ArrowLeft, Loader } from 'lucide-react';
import toast from 'react-hot-toast';
import './auth.css';

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, token, user } = useSelector((s) => s.auth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (token) {
      if (user?.role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    }
  }, [token, user, navigate]);

  useEffect(() => {
    if (error) toast.error(error);
    return () => { dispatch(clearAuthError()); };
  }, [error, dispatch]);

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(loginUser({ email, password })).then((res) => {
      if (res.meta.requestStatus === 'fulfilled') {
        toast.success('Welcome back!');
        const role = res.payload?.data?.role;
        if (role === 'admin') {
          navigate('/admin/dashboard', { replace: true });
        } else {
          navigate('/', { replace: true });
        }
      }
    });
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <Link to="/" className="auth-back"><ArrowLeft size={14} /> Back</Link>
        <div className="auth-card">
          <h1 className="auth-title">Sign In</h1>
          <p className="auth-subtitle">Welcome back to Qissa</p>
          <form onSubmit={handleSubmit} className="auth-form">
            <label className="auth-field">
              <span>Email</span>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" />
            </label>
            <label className="auth-field">
              <span>Password</span>
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            </label>
            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? <Loader size={14} className="spin" /> : 'Sign In'}
            </button>
          </form>
          <p className="auth-footer-text">
            Don&apos;t have an account? <Link to="/signup">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
