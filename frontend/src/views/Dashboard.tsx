import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ConvertedAmount } from './JobList';
import api from '../utils/api';

export const Dashboard: React.FC = () => {
  const { user, updateUser } = useAuth();
  const queryClient = useQueryClient();

  const [displayName, setDisplayName] = useState('');

  const { data: wallet } = useQuery({
    queryKey: ['wallet'],
    queryFn: async () => {
      const res = await api.get('/wallet');
      return res.data;
    },
    enabled: !!user
  });

  const { data: myContracts } = useQuery({
    queryKey: ['my-contracts'],
    queryFn: async () => {
      const res = await api.get('/contracts/mine');
      return res.data;
    },
    enabled: !!user
  });
  const [preferredCurrency, setPreferredCurrency] = useState('USD');
  const [avatarPath, setAvatarPath] = useState<string | null>(null);

  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName);
      setPreferredCurrency(user.preferredCurrency);
      setAvatarPath(user.avatarPath);
    }
  }, [user]);

  const { data: myJobs, isLoading: loadingJobs } = useQuery({
    queryKey: ['my-jobs'],
    queryFn: async () => {
      const res = await api.get('/jobs/mine');
      return res.data;
    },
    enabled: user?.role === 'Client'
  });

  const { data: myProposals, isLoading: loadingProposals } = useQuery({
    queryKey: ['my-proposals-dashboard'],
    queryFn: async () => {
      const res = await api.get('/proposals/mine');
      return res.data;
    },
    enabled: user?.role === 'Freelancer'
  });

  const withdrawMutation = useMutation({
    mutationFn: async (proposalId: string) => {
      await api.post(`/proposals/${proposalId}/withdraw`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-proposals-dashboard'] });
    }
  });

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setProfileError(null);
    setUploadingAvatar(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/files', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setAvatarPath(response.data.fileId);
    } catch (err: any) {
      setProfileError(err.response?.data?.detail || 'Failed to upload avatar.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(false);
    setUpdatingProfile(true);

    try {
      const res = await api.put('/auth/profile', { displayName, preferredCurrency, avatarPath });
      updateUser(res.data);
      setProfileSuccess(true);
    } catch (err: any) {
      setProfileError(err.response?.data?.detail || 'Failed to update profile.');
    } finally {
      setUpdatingProfile(false);
    }
  };

  const proposalBadge = (status: number) =>
    status === 0 ? 'badge-brand' : status === 1 ? 'badge-warning' : status === 2 ? 'badge-success' : 'badge-muted';
  const proposalLabel = (status: number) =>
    status === 0 ? 'Submitted' : status === 1 ? 'Withdrawn' : status === 2 ? 'Accepted (Hired)' : 'Declined';

  const jobBadge = (status: number) =>
    status === 0 ? 'badge-success' : status === 1 ? 'badge-warning' : 'badge-muted';
  const jobLabel = (status: number) => (status === 0 ? 'Open' : status === 1 ? 'In Progress' : 'Closed');

  return (
    <div className="container-app max-w-7xl py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Profile panel */}
      <div className="lg:col-span-1 space-y-6">
        <div className="card p-6 space-y-6 animate-fade-up">
          <div className="text-center pb-5 border-b border-line">
            <div className="relative inline-block mb-3">
              {avatarPath ? (
                <img
                  src={`/api/files/${avatarPath}`}
                  alt="Avatar"
                  className="w-24 h-24 rounded-full object-cover ring-2 ring-brand-500/60 shadow-glow-sm"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-brand-gradient flex items-center justify-center text-3xl font-extrabold text-white shadow-glow-sm">
                  {user?.displayName ? user.displayName[0].toUpperCase() : '?'}
                </div>
              )}
            </div>
            <h2 className="text-xl font-bold">{user?.displayName}</h2>
            <p className="text-subtle text-xs mt-1">{user?.role} · {user?.email}</p>
            {wallet !== undefined && (
              <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-line bg-surface-2 text-sm font-semibold text-fg">
                <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                <ConvertedAmount amount={wallet.balance} from="USD" to={user?.preferredCurrency || 'USD'} />
              </div>
            )}
          </div>

          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted">Edit settings</h3>

            {profileSuccess && (
              <div className="p-3 bg-emerald-950/40 border border-emerald-900/60 text-emerald-300 rounded-xl text-xs text-center animate-scale-in">
                Profile updated successfully!
              </div>
            )}
            {profileError && (
              <div className="p-3 bg-rose-950/40 border border-rose-900/60 text-rose-300 rounded-xl text-xs text-center">
                {profileError}
              </div>
            )}

            <div>
              <label className="label">Display name</label>
              <input type="text" required value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="input" />
            </div>

            <div>
              <label className="label">Preferred currency</label>
              <select value={preferredCurrency} onChange={(e) => setPreferredCurrency(e.target.value)} className="input">
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="CAD">CAD ($)</option>
                <option value="AUD">AUD ($)</option>
              </select>
            </div>

            <div>
              <label className="label">Upload avatar</label>
              <input
                type="file"
                onChange={handleAvatarUpload}
                className="block w-full text-xs text-muted file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-brand-500/15 file:text-brand-300 hover:file:bg-brand-500/25 file:cursor-pointer file:transition-colors"
              />
              {uploadingAvatar && (
                <p className="text-xs text-brand-300 flex items-center gap-2 mt-1.5">
                  <span className="w-3 h-3 border-2 border-brand-400/40 border-t-brand-400 rounded-full animate-spin" />
                  Uploading…
                </p>
              )}
            </div>

            <button type="submit" disabled={updatingProfile || uploadingAvatar} className="btn-primary w-full">
              {updatingProfile ? 'Saving…' : 'Save Settings'}
            </button>
          </form>
        </div>
      </div>

      {/* Role panel */}
      <div className="lg:col-span-2 space-y-6">
        {/* Client */}
        {user?.role === 'Client' && (
          <div className="card p-6 space-y-6 animate-fade-up">
            <div className="flex justify-between items-center pb-4 border-b border-line gap-3">
              <div>
                <h2 className="text-2xl font-extrabold">My posted jobs</h2>
                <p className="text-muted text-xs mt-0.5">Manage your active and completed job postings</p>
              </div>
              <Link to="/jobs/new" className="btn-primary shrink-0">Post job</Link>
            </div>

            {loadingJobs ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
              </div>
            ) : !myJobs || myJobs.length === 0 ? (
              <div className="text-center py-12 text-subtle text-sm">You haven't posted any jobs yet.</div>
            ) : (
              <div className="space-y-3 stagger">
                {myJobs.map((job: any) => (
                  <div key={job.id} className="glass rounded-xl p-5 flex justify-between items-center gap-4 transition-all hover:border-brand-500/30">
                    <div className="space-y-2 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={jobBadge(job.status)}>{jobLabel(job.status)}</span>
                        <span className="text-xs text-subtle">{job.category}</span>
                      </div>
                      <Link to={`/jobs/${job.id}`}>
                        <h4 className="font-bold text-fg hover:text-brand-300 transition-colors">{job.title}</h4>
                      </Link>
                      <p className="text-subtle text-xs">
                        Budget: <span className="font-semibold text-muted">{job.budgetAmount.toFixed(2)} {job.budgetCurrency}</span> ({job.budgetType === 0 ? 'Fixed' : 'Hourly'})
                      </p>
                    </div>
                    <div className="text-right space-y-2 shrink-0">
                      <span className="badge-brand">{job.proposalCount} bid{job.proposalCount !== 1 ? 's' : ''}</span>
                      <div>
                        <Link to={`/jobs/${job.id}`} className="btn-secondary py-1.5 px-3.5 text-xs">Manage bids</Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Freelancer */}
        {user?.role === 'Freelancer' && (
          <div className="card p-6 space-y-6 animate-fade-up">
            <div className="pb-4 border-b border-line">
              <h2 className="text-2xl font-extrabold">Applied jobs</h2>
              <p className="text-muted text-xs mt-0.5">Track the status of your submitted proposals</p>
            </div>

            {loadingProposals ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
              </div>
            ) : !myProposals || myProposals.length === 0 ? (
              <div className="text-center py-12 text-subtle text-sm">You haven't applied to any jobs yet.</div>
            ) : (
              <div className="space-y-3 stagger">
                {myProposals.map((proposal: any) => (
                  <div key={proposal.id} className="glass rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:border-brand-500/30">
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={proposalBadge(proposal.status)}>{proposalLabel(proposal.status)}</span>
                        <span className="text-xs text-subtle">Submitted {new Date(proposal.createdAt).toLocaleDateString()}</span>
                      </div>
                      <Link to={`/jobs/${proposal.jobId}`}>
                        <h4 className="font-bold text-fg hover:text-brand-300 transition-colors">{proposal.jobTitle}</h4>
                      </Link>
                      <div className="text-xs text-muted flex flex-wrap gap-x-4 gap-y-1">
                        <span>Your bid: <span className="font-semibold text-fg">{proposal.bidAmount.toFixed(2)} {proposal.jobCurrency || 'USD'}</span></span>
                        <span>Delivery: <span className="font-semibold text-fg">{new Date(proposal.deliveryDate).toLocaleDateString()}</span></span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                      <Link to={`/jobs/${proposal.jobId}`} className="btn-secondary py-1.5 px-3.5 text-xs">View job</Link>
                      {proposal.status === 0 && (
                        <button
                          onClick={() => {
                            if (window.confirm('Withdraw this bid?')) {
                              withdrawMutation.mutate(proposal.id);
                            }
                          }}
                          className="btn-danger py-1.5 px-3.5 text-xs"
                        >
                          Withdraw
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Contracts Section */}
        {myContracts && myContracts.length > 0 && (
          <div className="card p-6 space-y-6 animate-fade-up">
            <div className="pb-4 border-b border-line">
              <h2 className="text-2xl font-extrabold">My contracts</h2>
              <p className="text-muted text-xs mt-0.5">Track your milestone contracts</p>
            </div>
            <div className="space-y-3 stagger">
              {myContracts.map((c: any) => (
                <div key={c.id} className="glass rounded-xl p-5 flex justify-between items-center gap-4 transition-all hover:border-brand-500/30">
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`badge ${c.status === 0 ? 'badge-brand' : c.status === 1 ? 'badge-success' : 'badge-danger'}`}>
                        {c.status === 0 ? 'Active' : c.status === 1 ? 'Completed' : 'Cancelled'}
                      </span>
                      <span className="text-xs text-subtle">Agreed: {c.agreedAmount.toFixed(2)} {c.currency}</span>
                    </div>
                    <Link to={`/jobs/${c.jobId}`}>
                      <h4 className="font-bold text-fg hover:text-brand-300 transition-colors">{c.jobTitle}</h4>
                    </Link>
                    <p className="text-xs text-muted">
                      {user?.role === 'Client' ? `Freelancer: ${c.freelancerName}` : `Client: ${c.clientName}`}
                    </p>
                  </div>
                  <div className="shrink-0">
                    <Link to={`/jobs/${c.jobId}`} className="btn-secondary py-1.5 px-3.5 text-xs">View milestones</Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Ledger Entries Section */}
        {wallet?.ledger && wallet.ledger.length > 0 && (
          <div className="card p-6 space-y-6 animate-fade-up">
            <div className="pb-4 border-b border-line">
              <h2 className="text-2xl font-extrabold">Transaction history</h2>
              <p className="text-muted text-xs mt-0.5">Immutable audit trail of your wallet transfers</p>
            </div>
            <div className="space-y-3">
              {wallet.ledger.map((l: any) => (
                <div key={l.id} className="glass rounded-xl p-4 flex justify-between items-center gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-fg">{l.note}</p>
                    <p className="text-xs text-subtle">{new Date(l.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <span className={`block font-bold text-sm ${l.type === 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {l.type === 0 ? '-' : '+'}{l.amount.toFixed(2)} USD
                    </span>
                    <span className="text-[11px] text-muted">After: {l.balanceAfter.toFixed(2)} USD</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
