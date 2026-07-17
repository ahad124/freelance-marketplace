import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/api';

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

  return (
    <div className="max-w-7xl w-full mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-4xl font-extrabold text-white tracking-tight my-0">Admin Dashboard</h1>
        <p className="mt-1 text-slate-400">Platform overview and user management</p>
      </div>

      {/* Tab Nav */}
      <div className="flex border-b border-slate-800 gap-1">
        {(['metrics', 'users'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-3 text-sm font-bold capitalize rounded-t-xl transition-colors ${
              activeTab === tab
                ? 'bg-slate-900 border border-slate-800 border-b-slate-900 text-purple-400'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {tab === 'metrics' ? 'Platform Metrics' : 'Manage Users'}
          </button>
        ))}
      </div>

      {/* Metrics Tab */}
      {activeTab === 'metrics' && (
        <>
          {loadingMetrics ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
          ) : metrics ? (
            <div className="space-y-8">
              {/* KPI Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Total Users', value: metrics.totalUsers, color: 'purple' },
                  { label: 'Total Jobs', value: metrics.totalJobs, color: 'indigo' },
                  { label: 'Open Jobs', value: metrics.openJobs, color: 'emerald' },
                  { label: 'Total Proposals', value: metrics.totalProposals, color: 'sky' },
                ].map(({ label, value, color }) => (
                  <div
                    key={label}
                    className={`bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-${color}-500/30 transition-all`}
                  >
                    <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">{label}</p>
                    <p className={`text-4xl font-extrabold text-${color}-400`}>{value}</p>
                  </div>
                ))}
              </div>

              {/* Role Breakdown */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-4">Users by Role</h3>
                <div className="space-y-3">
                  {metrics.usersByRole && Object.entries(metrics.usersByRole).map(([role, count]) => {
                    const total = metrics.totalUsers || 1;
                    const pct = Math.round(((count as number) / total) * 100);
                    return (
                      <div key={role} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="font-semibold text-slate-300">{role}</span>
                          <span className="text-slate-500">{count as number} ({pct}%)</span>
                        </div>
                        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Recent Signups */}
              {metrics.recentSignups?.length > 0 && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-white mb-4">Recent Signups (Last 7 Days)</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-800">
                          <th className="text-left py-2 text-xs font-bold uppercase tracking-wider text-slate-500">Name</th>
                          <th className="text-left py-2 text-xs font-bold uppercase tracking-wider text-slate-500">Email</th>
                          <th className="text-left py-2 text-xs font-bold uppercase tracking-wider text-slate-500">Role</th>
                        </tr>
                      </thead>
                      <tbody>
                        {metrics.recentSignups.map((u: any) => (
                          <tr key={u.id} className="border-b border-slate-800/50">
                            <td className="py-3 text-white font-medium">{u.displayName}</td>
                            <td className="py-3 text-slate-400">{u.email}</td>
                            <td className="py-3">
                              <span className="bg-purple-950/60 text-purple-400 border border-purple-900/50 text-xs px-2 py-0.5 rounded-full font-semibold">
                                {u.role}
                              </span>
                            </td>
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

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          {loadingUsers ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-800 bg-slate-950/60">
                  <tr>
                    {['Name / Email', 'Role', 'Currency', 'Status', 'Actions'].map((h) => (
                      <th key={h} className="text-left px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users?.map((user: any) => (
                    <tr key={user.id} className="border-b border-slate-800/50 hover:bg-slate-950/40 transition-colors">
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
                          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-purple-500 cursor-pointer"
                        >
                          <option value="Freelancer">Freelancer</option>
                          <option value="Client">Client</option>
                          <option value="Admin">Admin</option>
                        </select>
                      </td>
                      <td className="px-5 py-4 text-slate-400 font-mono text-xs">{user.preferredCurrency}</td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${
                            user.isDisabled
                              ? 'bg-red-950/60 text-red-400 border border-red-900/50'
                              : 'bg-emerald-950/60 text-emerald-400 border border-emerald-900/50'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${user.isDisabled ? 'bg-red-400' : 'bg-emerald-400'}`} />
                          {user.isDisabled ? 'Suspended' : 'Active'}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <button
                          onClick={() =>
                            toggleStatusMutation.mutate({ userId: user.id, isDisabled: !user.isDisabled })
                          }
                          disabled={toggleStatusMutation.isPending}
                          className={`text-xs font-bold py-1.5 px-4 rounded-lg border transition-colors disabled:opacity-50 ${
                            user.isDisabled
                              ? 'bg-emerald-950/40 border-emerald-900/50 text-emerald-400 hover:bg-emerald-950/80'
                              : 'bg-red-950/40 border-red-900/50 text-red-400 hover:bg-red-950/80'
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
