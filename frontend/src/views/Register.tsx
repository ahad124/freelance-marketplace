import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

export const Register: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState('Freelancer');
  const [preferredCurrency, setPreferredCurrency] = useState('USD');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const response = await api.post('/auth/register', {
        email,
        password,
        displayName,
        role,
        preferredCurrency,
      });
      const { accessToken, user } = response.data;
      login(accessToken, user);
      navigate('/');
    } catch (err: any) {
      if (err.response && err.response.data && err.response.data.detail) {
        setError(err.response.data.detail);
      } else {
        setError('Failed to create account. Make sure password meets requirements (8+ chars, uppercase, lowercase, digit, symbol).');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const roleOptions = [
    { value: 'Freelancer', label: 'Freelancer', hint: 'Find work & submit proposals' },
    { value: 'Client', label: 'Client', hint: 'Post jobs & hire talent' },
  ];

  return (
    <div className="container-app max-w-md py-10 sm:py-14">
      <div className="card p-8 sm:p-10 animate-fade-up">
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 w-12 h-12 rounded-2xl bg-brand-gradient flex items-center justify-center shadow-glow-sm">
            <svg width="22" height="22" viewBox="0 0 16 16" fill="none">
              <path d="M8 1L14 4.5V11.5L8 15L2 11.5V4.5L8 1Z" fill="white" fillOpacity="0.95" />
            </svg>
          </div>
          <h2 className="text-3xl font-extrabold">Create account</h2>
          <p className="mt-2 text-sm text-slate-400">Join the freelance marketplace</p>
        </div>

        {error && (
          <div className="mb-6 p-3.5 bg-rose-950/40 border border-rose-900/60 rounded-xl text-rose-300 text-sm animate-scale-in">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="label">Display name</label>
            <input
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="input"
              placeholder="Frank Freelancer"
            />
          </div>

          <div>
            <label className="label">Email address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="label">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
              placeholder="••••••••"
            />
            <p className="mt-1.5 text-xs text-slate-500">8+ chars with uppercase, lowercase, number &amp; symbol.</p>
          </div>

          {/* Role selector as segmented cards */}
          <div>
            <label className="label">Join as</label>
            <div className="grid grid-cols-2 gap-2">
              {roleOptions.map((opt) => (
                <button
                  type="button"
                  key={opt.value}
                  onClick={() => setRole(opt.value)}
                  className={`rounded-xl border p-3 text-left transition-all ${
                    role === opt.value
                      ? 'border-brand-500/60 bg-brand-500/10 shadow-glow-sm'
                      : 'border-line bg-ink-900/50 hover:border-line-strong'
                  }`}
                >
                  <span className="block text-sm font-semibold text-white">{opt.label}</span>
                  <span className="block text-[11px] text-slate-400 mt-0.5">{opt.hint}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label">Preferred currency</label>
            <select
              value={preferredCurrency}
              onChange={(e) => setPreferredCurrency(e.target.value)}
              className="input"
            >
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
              <option value="CAD">CAD ($)</option>
              <option value="AUD">AUD ($)</option>
            </select>
          </div>

          <button type="submit" disabled={submitting} className="btn-primary w-full py-3.5">
            {submitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Creating account…
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <p className="mt-7 text-center text-sm text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-300 hover:text-brand-200 font-semibold transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};
