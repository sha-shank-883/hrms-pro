import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

const Signup = () => {
  const [formData, setFormData] = useState({
    companyName: '',
    fullName: '',
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // In a real app, you would hit a tenant registration endpoint
      // const res = await api.post('/tenants/register', formData);
      
      // Simulating network delay
      await new Promise(r => setTimeout(r, 1500));
      
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
      
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl text-center border border-neutral-100">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          </div>
          <h2 className="text-3xl font-extrabold text-neutral-900 mb-4">Account Created!</h2>
          <p className="text-neutral-600 mb-8">We've set up your workspace. You will be redirected to the login page momentarily.</p>
          <div className="animate-pulse flex justify-center">
            <div className="h-2 w-24 bg-primary-200 rounded-full overflow-hidden">
              <div className="h-full bg-primary-600 w-1/2 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex font-sans">
      
      {/* Left Form Section */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24 bg-white overflow-y-auto">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div className="mb-8 flex items-center gap-2">
            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">H</div>
            <span className="font-bold text-2xl tracking-tight text-neutral-900">HRMS Pro</span>
          </div>

          <h2 className="mt-6 text-3xl font-extrabold text-neutral-900 tracking-tight">
            Start your free trial
          </h2>
          <p className="mt-2 text-sm text-neutral-600">
            No credit card required. Setup takes less than a minute.
          </p>

          <div className="mt-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              
              <div>
                <label className="block text-sm font-medium text-neutral-700">Company Name</label>
                <div className="mt-1">
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                    placeholder="Acme Corp"
                    required
                    className="appearance-none block w-full px-4 py-3 border border-neutral-300 rounded-xl shadow-sm placeholder-neutral-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition-shadow"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700">Full Name</label>
                <div className="mt-1">
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                    placeholder="John Doe"
                    required
                    className="appearance-none block w-full px-4 py-3 border border-neutral-300 rounded-xl shadow-sm placeholder-neutral-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition-shadow"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700">Work Email</label>
                <div className="mt-1">
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="john@acmecorp.com"
                    required
                    className="appearance-none block w-full px-4 py-3 border border-neutral-300 rounded-xl shadow-sm placeholder-neutral-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition-shadow"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700">Password</label>
                <div className="mt-1">
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    placeholder="Create a strong password"
                    required
                    className="appearance-none block w-full px-4 py-3 border border-neutral-300 rounded-xl shadow-sm placeholder-neutral-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition-shadow"
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm text-center">
                  {error}
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-70 transition-all"
                >
                  {loading ? 'Creating Account...' : 'Create Account'}
                </button>
              </div>

              <div className="mt-6 text-center text-sm">
                <span className="text-neutral-500">Already have an account? </span>
                <Link to="/login" className="font-bold text-primary-600 hover:text-primary-500">
                  Sign in instead
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Right Feature Highlight Section */}
      <div className="hidden lg:flex relative w-0 flex-1 bg-gradient-to-br from-primary-600 to-purple-700 text-white flex-col justify-center items-center overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="relative z-10 p-12 max-w-2xl w-full">
          <h3 className="text-3xl font-extrabold mb-6">Everything you need to grow</h3>
          <ul className="space-y-6">
            <li className="flex items-start gap-4">
              <div className="bg-white/20 p-2 rounded-lg mt-1 shrink-0">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              </div>
              <div>
                <h4 className="text-xl font-bold">Centralized Employee Data</h4>
                <p className="text-primary-100 mt-1">Keep all your employee records in one secure, accessible place.</p>
              </div>
            </li>
            <li className="flex items-start gap-4">
              <div className="bg-white/20 p-2 rounded-lg mt-1 shrink-0">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <div>
                <h4 className="text-xl font-bold">Automated Workflows</h4>
                <p className="text-primary-100 mt-1">Save hours of manual work with custom approval chains and automated notifications.</p>
              </div>
            </li>
            <li className="flex items-start gap-4">
              <div className="bg-white/20 p-2 rounded-lg mt-1 shrink-0">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </div>
              <div>
                <h4 className="text-xl font-bold">Lightning Fast Setup</h4>
                <p className="text-primary-100 mt-1">No complicated implementations. Import your data and get started immediately.</p>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Signup;
