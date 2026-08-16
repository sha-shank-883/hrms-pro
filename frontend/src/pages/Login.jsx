import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services';
import api from '../services/api';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tenantId, setTenantId] = useState('');
  const [error, setError] = useState('');
  const [errorDetails, setErrorDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [requires2FA, setRequires2FA] = useState(false);
  const [otp, setOtp] = useState('');
  const [tempUserId, setTempUserId] = useState(null);
  const [honeypot, setHoneypot] = useState('');
  const [botChallenge, setBotChallenge] = useState('');

  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
    const savedTenantId = localStorage.getItem('tenant_id');
    if (savedTenantId) {
      setTenantId(savedTenantId);
    } else {
      setTenantId('tenant_default');
    }

    // Fetch challenge token
    const fetchChallenge = async () => {
      try {
        const res = await api.get('/auth/challenge');
        if (res.data?.challenge) {
          setBotChallenge(res.data.challenge);
        }
      } catch (_) {}
    };
    fetchChallenge();
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setErrorDetails(null);
    setLoading(true);

    try {
      const activeTenantId = tenantId.trim() || 'tenant_default';
      localStorage.setItem('tenant_id', activeTenantId);

      if (requires2FA) {
        await authService.verify2FALogin(tempUserId, otp);
        window.location.href = '/dashboard';
      } else {
        const response = await login(email, password, {
          hp_website_contact: honeypot,
          _bot_challenge: botChallenge
        });
        if (response.requires2FA) {
          setRequires2FA(true);
          setTempUserId(response.userId);
          setLoading(false);
          return;
        }
        navigate('/dashboard');
      }
    } catch (err) {
      console.error(err);
      const data = err.response?.data;
      if (data?.pending_approval) {
        setErrorDetails({
          type: 'pending',
          title: 'Workspace Pending Approval',
          message: data.message || 'Your company workspace is currently awaiting Super Admin review.'
        });
      } else if (data?.locked) {
        setErrorDetails({
          type: 'locked',
          title: 'Account Temporarily Locked',
          message: data.message || 'Too many failed login attempts. Please wait 15 minutes before trying again.'
        });
      } else {
        setError(data?.message || err.message || 'Login failed. Please verify your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex font-sans">
      {/* Left Form Section */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24 bg-white">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div className="mb-8 flex items-center gap-2">
            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">H</div>
            <span className="font-bold text-2xl tracking-tight text-neutral-900">HRMS Pro</span>
          </div>

          <h2 className="mt-6 text-3xl font-extrabold text-neutral-900 tracking-tight">
            {requires2FA ? 'Two-Factor Auth' : 'Welcome back'}
          </h2>
          <p className="mt-2 text-sm text-neutral-600">
            {requires2FA ? 'Enter the 6-digit code from your authenticator app.' : 'Please enter your details to sign in.'}
          </p>

          <div className="mt-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Invisible Honeypot field for bot trapping */}
              <div style={{ display: 'none' }} aria-hidden="true">
                <input
                  type="text"
                  name="hp_website_contact"
                  tabIndex="-1"
                  autoComplete="off"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                />
              </div>

              {!requires2FA ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700">Company ID</label>
                    <div className="mt-1">
                      <input
                        type="text"
                        value={tenantId}
                        onChange={(e) => setTenantId(e.target.value)}
                        placeholder="e.g., tenant_default"
                        required
                        maxLength={60}
                        className="appearance-none block w-full px-4 py-3 border border-neutral-300 rounded-xl shadow-sm placeholder-neutral-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition-shadow"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700">Email address</label>
                    <div className="mt-1">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="admin@hrmspro.com"
                        required
                        maxLength={120}
                        className="appearance-none block w-full px-4 py-3 border border-neutral-300 rounded-xl shadow-sm placeholder-neutral-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition-shadow"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <label className="block text-sm font-medium text-neutral-700">Password</label>
                      <div className="text-sm">
                        <Link to="/forgot-password" className="font-medium text-primary-600 hover:text-primary-500">
                          Forgot your password?
                        </Link>
                      </div>
                    </div>
                    <div className="mt-1">
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        maxLength={100}
                        className="appearance-none block w-full px-4 py-3 border border-neutral-300 rounded-xl shadow-sm placeholder-neutral-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition-shadow"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-neutral-700">Authentication Code</label>
                  <div className="mt-1">
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="000000"
                      required
                      autoFocus
                      maxLength={6}
                      className="appearance-none block w-full px-4 py-3 border border-neutral-300 rounded-xl shadow-sm placeholder-neutral-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-center text-2xl tracking-[0.5em] transition-shadow"
                    />
                  </div>
                </div>
              )}

              {errorDetails && (
                <div className={`p-4 rounded-xl text-sm border ${
                  errorDetails.type === 'pending'
                    ? 'bg-amber-50 border-amber-200 text-amber-900'
                    : 'bg-red-50 border-red-200 text-red-900'
                }`}>
                  <div className="flex items-center gap-2 font-bold mb-1">
                    <span>{errorDetails.type === 'pending' ? '⏳' : '🔒'}</span>
                    <span>{errorDetails.title}</span>
                  </div>
                  <p className="text-xs leading-relaxed opacity-90">{errorDetails.message}</p>
                </div>
              )}

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm text-center">
                  {error}
                </div>
              )}

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-70 transition-all"
                >
                  {loading ? 'Processing...' : (requires2FA ? 'Verify Code' : 'Sign in')}
                </button>
              </div>

              {!requires2FA && (
                <div className="mt-6 text-center text-sm">
                  <span className="text-neutral-500">Don't have an account? </span>
                  <Link to="/signup" className="font-bold text-primary-600 hover:text-primary-500">
                    Sign up for a free trial
                  </Link>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>

      {/* Right Image Section */}
      <div className="hidden lg:block relative w-0 flex-1 bg-gradient-to-br from-primary-950 via-primary-900 to-secondary-950">
        <img
          className="absolute inset-0 h-full w-full object-cover opacity-40 mix-blend-overlay"
          src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1920&q=80"
          alt="Office"
        />
        <div className="absolute inset-0 flex flex-col items-start justify-center p-24 text-white z-10">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 p-8 rounded-3xl max-w-lg">
            <svg className="w-10 h-10 text-white/50 mb-6" fill="currentColor" viewBox="0 0 32 32"><path d="M9.352 4C4.456 7.456 1 13.12 1 19.36c0 5.088 3.072 8.064 6.624 8.064 3.36 0 5.856-2.688 5.856-5.856 0-3.168-2.208-5.472-5.088-5.472-.576 0-1.344.096-1.536.192.48-3.264 3.552-7.104 6.624-9.024L9.352 4zm16.512 0c-4.8 3.456-8.256 9.12-8.256 15.36 0 5.088 3.072 8.064 6.624 8.064 3.264 0 5.856-2.688 5.856-5.856 0-3.168-2.304-5.472-5.184-5.472-.576 0-1.248.096-1.44.192.48-3.264 3.456-7.104 6.528-9.024L25.864 4z" /></svg>
            <p className="text-2xl font-medium leading-snug mb-8">
              "Switching to HRMS Pro was the best decision we made for our team. It streamlined everything from onboarding to payroll in a matter of days."
            </p>
            <div className="flex items-center gap-4">
              <img className="w-12 h-12 rounded-full border-2 border-white/20" src="https://i.pravatar.cc/150?u=a042581f4e29026704d" alt="Testimonial author" />
              <div>
                <p className="font-bold">Sarah Chen</p>
                <p className="text-white/70 text-sm">VP of People, TechGrowth</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
