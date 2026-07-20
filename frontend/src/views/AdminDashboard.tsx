import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/api';

const KPI_STYLES: Record<string, { text: string; ring: string; icon: React.ReactNode }> = {
  users: {
    text: 'text-brand-300',
    ring: 'group-hover:border-brand-500/40',
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-4-4 4 4 0 004 4z" />,
  },
  jobs: {
    text: 'text-accent-400',
    ring: 'group-hover:border-accent-500/40',
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.9 23.9 0 0112 15c-3.18 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />,
  },
  open: {
    text: 'text-emerald-300',
    ring: 'group-hover:border-emerald-500/40',
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />,
  },
  proposals: {
    text: 'text-sky-300',
    ring: 'group-hover:border-sky-500/40',
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.86 9.86 0 01-4-.8L3 20l1.3-3.9A7.96 7.96 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />,
  },
};

export const AdminDashboard: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'metrics' | 'users'>('metrics');

  const { data: metrics, isLoading: loadingMetrics } = useQuery({
    queryKey: ['admin-metrics'],
    queryFn: async () => {
      const res = await api.get('/admin/metrics');
      return res.data;
    }
  });

  const { data: users, isLoading: loadingUsers } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const res = await api.get('/admin/users');
      return res.data;
    },
    enabled: activeTab === 'users'
  });

  const changeRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const res = await api.post(`/admin/users/${userId}/role`, { role });
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] })
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ userId, isDisabled }: { userId: string; isDisabled: boolean }) => {
      const res = await api.post(`/admin/users/${userId}/toggle-status`, { isDisabled });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-metrics'] });
    },
    onError: (err: any) => {
      alert(err.response?.data?.detail || 'Cannot modify account.');
    }
  });

  const kpis = metrics
    ? [
        { key: 'users', label: 'Total Users', value: metrics.totalUsers },
        { key: 'jobs', label: 'Total Jobs', value: metrics.totalJobs },
        { key: 'open', label: 'Open Jobs', value: metrics.openJobs },
        { key: 'proposals', label: 'Total Proposals', value: metrics.totalProposals },
      ]
    : [];

  return (
    <div className="container-app max-w-7xl py-8 space-y-8">
      <div className="animate-fade-up">
        <span className="eyebrow">Control center</span>
        <h1 className="mt-2 text-4xl font-extrabold">Admin dashboard</h1>
        <p className="mt-1 text-slate-400">Platform overview and user management.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-white/[0.04] border border-line w-fit">
        {(['metrics', 'users'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all ${
              activeTab === tab ? 'bg-brand-gradient text-white shadow-glow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            {tab === 'metrics' ? 'Platform Metrics' : 'Manage Users'}
          </button>
        ))}
      </div>

      {/* Metrics */}
      {activeTab === 'metrics' && (
        <>
          {loadingMetrics ? (
            <div className="flex justify-center py-20">
              <div className="w-10 h-10 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
            </div>
          ) : metrics ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 stagger">
                {kpis.map(({ key, label, value }) => {
                  const s = KPI_STYLES[key];
                  return (
                    <div key={key} className={`group card p-6 transition-all ${s.ring}`}>
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">{label}</p>
                        <svg className={`w-5 h-5 ${s.text}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                          {s.icon}
                        </svg>
                      </div>
                      <p className={`text-4xl font-extrabold font-display ${s.text}`}>{value}</p>
                    </div>
                  );
                })}
              </div>

              {/* Role breakdown */}
              <div className="card p-6 animate-fade-up">
                <h3 className="text-lg font-bold mb-4">Users by role</h3>
                <div className="space-y-3.5">
                  {metrics.usersByRole && Object.entries(metrics.usersByRole).map(([role, count]) => {
                    const total = metrics.totalUsers || 1;
                    const pct = Math.round(((count as number) / total) * 100);
                    return (
                      <div key={role} className="space-y-1.5">
                        <div className="flex justify-between text-sm">
                          <span className="font-semibold text-slate-200">{role}</span>
                          <span className="text-slate-500">{count as number} ({pct}%)</span>
                        </div>
                        <div className="h-2.5 bg-white/[0.06] rounded-full overflow-hidden">
                          <div className="h-full bg-brand-gradient rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Recent signups */}
              {metrics.recentSignups?.length > 0 && (
                <div className="card p-6 animate-fade-up">
                  <h3 className="text-lg font-bold mb-4">Recent signups (last 7 days)</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-line">
                          {['Name', 'Email', 'Role'].map((h) => (
                            <th key={h} className="text-left py-2 text-xs font-bold uppercase tracking-wider text-slate-500">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {metrics.recentSignups.map((u: any) => (
                          <tr key={u.id} className="border-b border-line/60">
                            <td className="py-3 text-white font-medium">{u.displayName}</td>
                            <td className="py-3 text-slate-400">{u.email}</td>
                            <td className="py-3"><span className="badge-brand">{u.role}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </>
      )}

      {/* Users */}
      {activeTab === 'users' && (
        <div className="card overflow-hidden animate-fade-up">
          {loadingUsers ? (
            <div className="flex justify-center py-20">
              <div className="w-10 h-10 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-line bg-white/[0.03]">
                  <tr>
                    {['Name / Email', 'Role', 'Currency', 'Status', 'Actions'].map((h) => (
                      <th key={h} className="text-left px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users?.map((user: any) => (
                    <tr key={user.id} className="border-b border-line/60 hover:bg-white/[0.03] transition-colors">
                      <td className="px-5 py-4">
                        <p className="font-semibold text-white">{user.displayName}</p>
                        <p className="text-slate-500 text-xs">{user.email}</p>
                      </td>
                      <td className="px-5 py-4">
                        <select
                          defaultValue={user.role}
                          onChange={(e) => {
                            if (e.target.value !== user.role) {
                              changeRoleMutation.mutate({ userId: user.id, role: e.target.value });
                            }
                          }}
                          className="bg-elevated border border-line rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-brand-500/60 cursor-pointer"
                        >
                          <option value="Freelancer">Freelancer</option>
                          <option value="Client">Client</option>
                          <option value="Admin">Admin</option>
                        </select>
                      </td>
                      <td className="px-5 py-4 text-slate-400 font-mono text-xs">{user.preferredCurrency}</td>
                      <td className="px-5 py-4">
                        <span className={user.isDisabled ? 'badge-danger' : 'badge-success'}>
                          <span className={`w-1.5 h-1.5 rounded-full ${user.isDisabled ? 'bg-rose-400' : 'bg-emerald-400 animate-pulse-glow'}`} />
                          {user.isDisabled ? 'Suspended' : 'Active'}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <button
                          onClick={() => toggleStatusMutation.mutate({ userId: user.id, isDisabled: !user.isDisabled })}
                          disabled={toggleStatusMutation.isPending}
                          className={`btn py-1.5 px-4 text-xs ${
                            user.isDisabled
                              ? 'text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20'
                              : 'text-rose-300 bg-rose-500/10 border border-rose-500/30 hover:bg-rose-500/20'
                          }`}
                        >
                          {user.isDisabled ? 'Enable' : 'Suspend'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
