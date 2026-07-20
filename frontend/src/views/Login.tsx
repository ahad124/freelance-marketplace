import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const response = await api.post('/auth/login', { email, password });
      const { accessToken, user } = response.data;
      login(accessToken, user);
      navigate('/');
    } catch (err: any) {
      if (err.response && err.response.data && err.response.data.detail) {
        setError(err.response.data.detail);
      } else {
        setError('Invalid email or password.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const fillDemo = () => {
    setEmail('client@demo.test');
    setPassword('Password123!');
  };

  return (
    <div className="container-app max-w-5xl py-10 sm:py-16">
      <div className="grid lg:grid-cols-2 gap-6 items-stretch">
        {/* Brand panel */}
        <div className="relative hidden lg:flex flex-col justify-between overflow-hidden rounded-3xl border border-line bg-brand-soft p-10 animate-fade-in">
          <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-brand-500/20 blur-3xl animate-float" />
          <div className="relative">
            <span className="eyebrow">Freelance Marketplace</span>
            <h1 className="mt-5 text-4xl font-extrabold leading-tight">
              Work with the <span className="text-gradient">best talent</span>, on your terms.
            </h1>
            <p className="mt-4 text-slate-300 max-w-sm">
              Post jobs, review proposals, track milestones, and pay securely — all in one professional workspace.
            </p>
          </div>
          <ul className="relative space-y-3 text-sm text-slate-300">
            {['Escrow-inspired milestone tracking', 'Real-time currency conversion', 'Verified reviews & ratings'].map((f) => (
              <li key={f} className="flex items-center gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-500/20 text-brand-300">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                {f}
              </li>
            ))}
          </ul>
        </div>

        {/* Form panel */}
        <div className="card p-8 sm:p-10 animate-fade-up">
          <div className="mb-8">
            <h2 className="text-3xl font-extrabold">Welcome back</h2>
            <p className="mt-2 text-sm text-slate-400">Log in to manage jobs and proposals.</p>
          </div>

          {error && (
            <div className="mb-6 p-3.5 bg-rose-950/40 border border-rose-900/60 rounded-xl text-rose-300 text-sm flex items-center gap-2 animate-scale-in">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z" />
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
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
            </div>

            <button type="submit" disabled={submitting} className="btn-primary w-full py-3.5">
              {submitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Signing in…
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <button
            onClick={fillDemo}
            className="mt-4 w-full text-xs text-slate-400 hover:text-brand-300 transition-colors"
          >
            Use demo credentials (client@demo.test)
          </button>

          <p className="mt-6 text-center text-sm text-slate-400">
            Don't have an account?{' '}
            <Link to="/register" className="text-brand-300 hover:text-brand-200 font-semibold transition-colors">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
