import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #0d2347 0%, #1a3668 55%, #1e4d8c 100%)' }}
    >
      {/* Decorative blobs */}
      <div
        className="absolute -top-32 -right-32 w-80 h-80 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(56,189,248,0.15) 0%, transparent 70%)' }}
      />
      <div
        className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)' }}
      />

      <div className="relative w-full max-w-sm">
        {/* Logo card */}
        <div className="flex justify-center mb-6">
          <div
            className="rounded-2xl px-8 py-4"
            style={{
              background: 'rgba(255,255,255,0.97)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.08)',
            }}
          >
            <img
              src="/clinic-logo.png"
              alt="Dr. Chavan's Child Clinic"
              className="object-contain"
              style={{ maxHeight: '68px' }}
            />
          </div>
        </div>

        {/* Login card */}
        <div
          className="rounded-2xl p-8"
          style={{
            background: 'rgba(255,255,255,0.97)',
            boxShadow: '0 25px 50px rgba(0,0,0,0.3)',
          }}
        >
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-800">Welcome back</h2>
            <p className="text-sm text-slate-500 mt-1">Sign in to continue to the clinic system</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Username</label>
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <input
                  className="input pl-9"
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  required
                  autoFocus
                  autoComplete="username"
                />
              </div>
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <input
                  className="input pl-9"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full py-3 rounded-xl font-semibold text-sm text-white transition-all duration-150 disabled:opacity-60"
              style={{
                background: loading ? '#3b82f6' : 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                boxShadow: '0 4px 16px rgba(37,99,235,0.35)',
              }}
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Signing in...
                </span>
              ) : 'Sign In'}
            </button>
          </form>

          <div className="mt-5 pt-5 border-t border-slate-100">
            <p className="text-xs text-slate-400 text-center mb-2 font-medium uppercase tracking-wide">Default credentials</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-2.5">
                <span className="text-blue-700 font-bold block">Doctor</span>
                <span className="text-slate-500">doctor / doctor123</span>
              </div>
              <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-2.5">
                <span className="text-emerald-700 font-bold block">Staff</span>
                <span className="text-slate-500">staff / staff123</span>
              </div>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-blue-200/50 mt-6">
          Chavan's Child Clinic &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
