import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services';
import '../styles/Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tenantId, setTenantId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [requires2FA, setRequires2FA] = useState(false);
  const [otp, setOtp] = useState('');
  const [tempUserId, setTempUserId] = useState(null);

  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
    // Load saved tenant ID
    const savedTenantId = localStorage.getItem('tenant_id');
    if (savedTenantId) {
      setTenantId(savedTenantId);
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Save tenant ID to localStorage
      if (tenantId) {
        localStorage.setItem('tenant_id', tenantId);
      }

      if (requires2FA) {
        // Verify 2FA
        await authService.verify2FALogin(tempUserId, otp);
        // If successful, authService stores token, and we can reload or redirect
        // Ideally, useAuth should expose a method to update state, but a reload works for now to pick up the token
        window.location.href = '/';
      } else {
        // Normal Login
        const response = await login(email, password);
        if (response.requires2FA) {
          setRequires2FA(true);
          setTempUserId(response.userId);
          setLoading(false);
          return;
        }
        navigate('/');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>HRMS Pro</h1>
          <p>Advanced Human Resource Management System</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {!requires2FA ? (
            <>
              <div className="form-group">
                <label className="form-label">Company ID</label>
                <input
                  type="text"
                  className="form-input"
                  value={tenantId}
                  onChange={(e) => setTenantId(e.target.value)}
                  placeholder="e.g., tenant_default"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@hrmspro.com"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  className="form-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                />
                <div style={{ textAlign: 'right', marginTop: '0.5rem' }}>
                  <Link to="/forgot-password" style={{ fontSize: '0.875rem', color: '#4f46e5', textDecoration: 'none' }}>
                    Forgot Password?
                  </Link>
                </div>
              </div>
            </>
          ) : (
            <div className="form-group">
              <label className="form-label">Two-Factor Authentication</label>
              <p style={{ marginBottom: '1rem', color: '#666', fontSize: '0.9rem' }}>
                Please enter the code from your authenticator app.
              </p>
              <input
                type="text"
                className="form-input"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter 6-digit code"
                required
                autoFocus
                maxLength={6}
              />
            </div>
          )}

          {error && <div className="error">{error}</div>}

          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'Verifying...' : (requires2FA ? 'Verify Code' : 'Login')}
          </button>

          {!requires2FA && (
            <div className="login-info">
              <p><strong>Default Credentials:</strong></p>
              <p>Email: admin@hrmspro.com</p>
              <p>Password: admin123</p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default Login;
