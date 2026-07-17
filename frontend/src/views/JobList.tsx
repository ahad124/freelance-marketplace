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
    return <span className="font-semibold text-white">{amount.toFixed(2)} {to}</span>;
  }

  if (isLoading) {
    return <span className="text-slate-500 text-sm">Converting...</span>;
  }

  return (
    <span className="font-semibold text-white">
      {data?.toFixed(2)} {to}{' '}
      <span className="text-xs text-slate-500 font-normal">
        (Original: {amount.toFixed(2)} {from})
      </span>
    </span>
  );
};

export const JobList: React.FC = () => {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [minBudget, setMinBudget] = useState('');
  const [maxBudget, setMaxBudget] = useState('');

  // Fetch open jobs
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
    <div className="max-w-6xl w-full mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight my-0">Explore Jobs</h1>
          <p className="mt-1 text-slate-400">Discover and bid on open freelance projects</p>
        </div>
        {user?.role === 'Client' && (
          <Link
            to="/jobs/new"
            className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg shadow-purple-500/10"
          >
            Post a Job
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filters Panel */}
        <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-2xl p-6 h-fit space-y-6">
          <h2 className="text-xl font-bold text-white mb-4">Filters</h2>
          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Search</label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Keywords..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
              >
                <option value="">All Categories</option>
                <option value="Web Development">Web Development</option>
                <option value="Mobile Development">Mobile Development</option>
                <option value="Design">Design</option>
                <option value="Writing">Writing</option>
                <option value="Marketing">Marketing</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Min Budget</label>
              <input
                type="number"
                value={minBudget}
                onChange={(e) => setMinBudget(e.target.value)}
                placeholder="0"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Max Budget</label>
              <input
                type="number"
                value={maxBudget}
                onChange={(e) => setMaxBudget(e.target.value)}
                placeholder="Any"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 rounded-xl text-sm transition-colors"
              >
                Apply
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="bg-slate-850 hover:bg-slate-800 border border-slate-800 text-slate-350 font-bold py-2 px-3 rounded-xl text-sm transition-colors"
              >
                Clear
              </button>
            </div>
          </form>
        </div>

        {/* Jobs List */}
        <div className="lg:col-span-3 space-y-4">
          {isLoading ? (
            <div className="flex justify-center items-center py-20 text-purple-500">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
            </div>
          ) : error ? (
            <div className="text-center py-20 text-red-400 border border-slate-800 rounded-2xl bg-slate-900/50">
              Error fetching jobs. Please try again.
            </div>
          ) : !jobs || jobs.length === 0 ? (
            <div className="text-center py-20 text-slate-450 border border-slate-800 rounded-2xl bg-slate-900/50">
              No open jobs found matching your criteria.
            </div>
          ) : (
            jobs.map((job: any) => (
              <div
                key={job.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-purple-500/50 transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="bg-purple-950/80 border border-purple-900 text-purple-400 text-xs px-2.5 py-1 rounded-full font-semibold">
                      {job.category}
                    </span>
                    <span className="text-slate-500 text-xs">
                      Posted by {job.clientName}
                    </span>
                  </div>
                  <Link to={`/jobs/${job.id}`} className="block">
                    <h3 className="text-xl font-bold text-white hover:text-purple-400 transition-colors">
                      {job.title}
                    </h3>
                  </Link>
                  <p className="text-slate-400 text-sm line-clamp-2 pr-4">
                    {job.description}
                  </p>
                </div>

                <div className="flex flex-col items-start md:items-end gap-3 min-w-[200px] border-t md:border-t-0 border-slate-800 pt-4 md:pt-0 w-full md:w-auto">
                  <div className="text-sm">
                    <span className="text-slate-400 block text-xs">Budget ({job.budgetType === 0 ? 'Fixed' : 'Hourly'})</span>
                    {user ? (
                      <ConvertedAmount
                        amount={job.budgetAmount}
                        from={job.budgetCurrency}
                        to={user.preferredCurrency}
                      />
                    ) : (
                      <span className="font-semibold text-white">
                        {job.budgetAmount.toFixed(2)} {job.budgetCurrency}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500">
                    {job.proposalCount} active proposal{job.proposalCount !== 1 ? 's' : ''}
                  </div>
                  <Link
                    to={`/jobs/${job.id}`}
                    className="w-full md:w-auto bg-slate-850 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-white font-bold py-2 px-4 rounded-xl text-sm transition-colors text-center"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
