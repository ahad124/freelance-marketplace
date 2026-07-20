import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

// Reusable ConvertedAmount component using TanStack Query
export const ConvertedAmount: React.FC<{ amount: number; from: string; to: string }> = ({ amount, from, to }) => {
  const { data, isLoading } = useQuery({
    queryKey: ['convert', amount, from, to],
    queryFn: async () => {
      const res = await api.get('/currency/convert', {
        params: { amount, from, to }
      });
      return res.data.convertedAmount;
    },
    enabled: from.toUpperCase() !== to.toUpperCase() && amount > 0,
    staleTime: 1000 * 60 * 30, // Cache for 30 minutes
  });

  if (from.toUpperCase() === to.toUpperCase()) {
    return <span className="font-bold text-white">{amount.toFixed(2)} {to}</span>;
  }

  if (isLoading) {
    return <span className="text-slate-500 text-sm">Converting…</span>;
  }

  return (
    <span className="font-bold text-white">
      {data?.toFixed(2)} {to}{' '}
      <span className="text-xs text-slate-500 font-normal">
        (was {amount.toFixed(2)} {from})
      </span>
    </span>
  );
};

const CategoryChip: React.FC<{ label: string }> = ({ label }) => (
  <span className="badge-brand">{label}</span>
);

export const JobList: React.FC = () => {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [minBudget, setMinBudget] = useState('');
  const [maxBudget, setMaxBudget] = useState('');

  const { data: jobs, isLoading, error, refetch } = useQuery({
    queryKey: ['jobs', search, category, minBudget, maxBudget],
    queryFn: async () => {
      const params: any = {};
      if (search) params.search = search;
      if (category) params.category = category;
      if (minBudget) params.minBudget = parseFloat(minBudget);
      if (maxBudget) params.maxBudget = parseFloat(maxBudget);
      const res = await api.get('/jobs', { params });
      return res.data;
    }
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    refetch();
  };

  const handleClear = () => {
    setSearch('');
    setCategory('');
    setMinBudget('');
    setMaxBudget('');
  };

  return (
    <div className="container-app py-8">
      {/* Hero header */}
      <div className="relative overflow-hidden rounded-3xl border border-line bg-brand-soft p-8 sm:p-10 mb-8 animate-fade-up">
        <div className="absolute -top-20 -right-10 w-64 h-64 rounded-full bg-accent-500/15 blur-3xl animate-float" />
        <div className="relative flex flex-col md:flex-row justify-between items-start md:items-end gap-5">
          <div>
            <span className="eyebrow">Marketplace</span>
            <h1 className="mt-3 text-4xl sm:text-5xl font-extrabold">
              Explore <span className="text-gradient">open jobs</span>
            </h1>
            <p className="mt-2 text-slate-300">Discover and bid on freelance projects from vetted clients.</p>
          </div>
          {user?.role === 'Client' && (
            <Link to="/jobs/new" className="btn-primary">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Post a Job
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters Panel */}
        <aside className="lg:col-span-1">
          <div className="card p-6 lg:sticky lg:top-24">
            <h2 className="text-lg font-bold mb-4">Filters</h2>
            <form onSubmit={handleSearch} className="space-y-4">
              <div>
                <label className="label">Search</label>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Keywords…"
                  className="input"
                />
              </div>
              <div>
                <label className="label">Category</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="input">
                  <option value="">All categories</option>
                  <option value="Web Development">Web Development</option>
                  <option value="Mobile Development">Mobile Development</option>
                  <option value="Design">Design</option>
                  <option value="Writing">Writing</option>
                  <option value="Marketing">Marketing</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Min $</label>
                  <input type="number" value={minBudget} onChange={(e) => setMinBudget(e.target.value)} placeholder="0" className="input" />
                </div>
                <div>
                  <label className="label">Max $</label>
                  <input type="number" value={maxBudget} onChange={(e) => setMaxBudget(e.target.value)} placeholder="Any" className="input" />
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button type="submit" className="btn-primary flex-1">Apply</button>
                <button type="button" onClick={handleClear} className="btn-secondary">Clear</button>
              </div>
            </form>
          </div>
        </aside>

        {/* Jobs List */}
        <section className="lg:col-span-3 space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              {[0, 1, 2].map((i) => (
                <div key={i} className="card p-6">
                  <div className="skeleton h-4 w-24 mb-3" />
                  <div className="skeleton h-6 w-2/3 mb-3" />
                  <div className="skeleton h-4 w-full mb-2" />
                  <div className="skeleton h-4 w-4/5" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="card p-12 text-center text-rose-300">
              Couldn't load jobs. Please try again.
            </div>
          ) : !jobs || jobs.length === 0 ? (
            <div className="card p-16 text-center animate-fade-in">
              <div className="mx-auto mb-4 w-14 h-14 rounded-2xl bg-white/[0.04] flex items-center justify-center">
                <svg className="w-7 h-7 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <p className="text-slate-300 font-semibold">No jobs match your filters</p>
              <p className="text-slate-500 text-sm mt-1">Try clearing filters or broadening your search.</p>
            </div>
          ) : (
            <div className="space-y-4 stagger">
              {jobs.map((job: any) => (
                <div key={job.id} className="card card-hover p-6 flex flex-col md:flex-row justify-between gap-6">
                  <div className="space-y-2.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <CategoryChip label={job.category} />
                      <span className="text-slate-500 text-xs">by {job.clientName}</span>
                    </div>
                    <Link to={`/jobs/${job.id}`} className="block">
                      <h3 className="text-xl font-bold text-white hover:text-brand-300 transition-colors">{job.title}</h3>
                    </Link>
                    <p className="text-slate-400 text-sm line-clamp-2">{job.description}</p>
                  </div>

                  <div className="flex flex-col items-start md:items-end gap-3 md:min-w-[210px] border-t md:border-t-0 md:border-l border-line pt-4 md:pt-0 md:pl-6 w-full md:w-auto">
                    <div className="text-sm md:text-right">
                      <span className="block text-[11px] uppercase tracking-wide text-slate-500">
                        Budget · {job.budgetType === 0 ? 'Fixed' : 'Hourly'}
                      </span>
                      {user ? (
                        <ConvertedAmount amount={job.budgetAmount} from={job.budgetCurrency} to={user.preferredCurrency} />
                      ) : (
                        <span className="font-bold text-white">{job.budgetAmount.toFixed(2)} {job.budgetCurrency}</span>
                      )}
                    </div>
                    <span className="badge-muted">
                      {job.proposalCount} proposal{job.proposalCount !== 1 ? 's' : ''}
                    </span>
                    <Link to={`/jobs/${job.id}`} className="btn-secondary w-full md:w-auto justify-center">
                      View details
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
