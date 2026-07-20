import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user?.displayName
    ? user.displayName
        .split(' ')
        .slice(0, 2)
        .map((n) => n[0])
        .join('')
        .toUpperCase()
    : '?';

  const navLink = (to: string, label: string) => {
    const active = location.pathname === to;
    return (
      <Link
        to={to}
        className={`relative px-3.5 py-2 text-sm font-semibold rounded-lg transition-colors ${
          active ? 'text-white' : 'text-slate-400 hover:text-white hover:bg-white/[0.06]'
        }`}
      >
        {label}
        {active && (
          <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-brand-gradient" />
        )}
      </Link>
    );
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-line bg-ink/70 backdrop-blur-xl">
      <div className="container-app max-w-7xl h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-brand-gradient flex items-center justify-center shadow-glow-sm transition-transform duration-300 group-hover:scale-105 group-hover:rotate-3">
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 1L14 4.5V11.5L8 15L2 11.5V4.5L8 1Z" fill="white" fillOpacity="0.95" />
            </svg>
          </div>
          <span className="font-display font-extrabold text-white text-lg tracking-tight">
            Freelance<span className="text-gradient">Hub</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1">
          {navLink('/', 'Jobs')}
          {user && navLink('/dashboard', 'Dashboard')}
          {user?.role === 'Client' && navLink('/jobs/new', 'Post Job')}
          {user?.role === 'Admin' && navLink('/admin', 'Admin Panel')}
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2.5 group hover:bg-white/[0.06] py-1.5 px-2 rounded-xl transition-colors"
              >
                <div className="w-9 h-9 rounded-full bg-brand-gradient flex items-center justify-center text-xs font-bold text-white shadow-glow-sm ring-2 ring-white/10">
                  {initials}
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-semibold text-white leading-none">{user.displayName}</p>
                  <p className="text-xs text-slate-500 leading-none mt-1">{user.role}</p>
                </div>
                <svg
                  className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${menuOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 w-60 glass rounded-2xl shadow-elevated overflow-hidden z-50 origin-top-right animate-scale-in">
                    <div className="px-4 py-3 border-b border-line bg-brand-soft">
                      <p className="text-sm font-semibold text-white truncate">{user.displayName}</p>
                      <p className="text-xs text-slate-400 truncate">{user.email}</p>
                    </div>

                    <div className="p-2">
                      <Link
                        to="/dashboard"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center w-full px-3 py-2 rounded-lg text-sm font-semibold text-slate-300 hover:text-white hover:bg-white/[0.06] transition-colors"
                      >
                        My Dashboard
                      </Link>

                      <div className="md:hidden">
                        <Link
                          to="/"
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center w-full px-3 py-2 rounded-lg text-sm font-semibold text-slate-300 hover:text-white hover:bg-white/[0.06] transition-colors"
                        >
                          Browse Jobs
                        </Link>
                        {user.role === 'Client' && (
                          <Link
                            to="/jobs/new"
                            onClick={() => setMenuOpen(false)}
                            className="flex items-center w-full px-3 py-2 rounded-lg text-sm font-semibold text-slate-300 hover:text-white hover:bg-white/[0.06] transition-colors"
                          >
                            Post Job
                          </Link>
                        )}
                        {user.role === 'Admin' && (
                          <Link
                            to="/admin"
                            onClick={() => setMenuOpen(false)}
                            className="flex items-center w-full px-3 py-2 rounded-lg text-sm font-semibold text-slate-300 hover:text-white hover:bg-white/[0.06] transition-colors"
                          >
                            Admin Panel
                          </Link>
                        )}
                      </div>

                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          handleLogout();
                        }}
                        className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 transition-colors mt-1 border-t border-line pt-2"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Sign Out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" className="btn-ghost">
                Sign In
              </Link>
              <Link to="/register" className="btn-primary">
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};
