import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

export const Dashboard: React.FC = () => {
  const { user, updateUser } = useAuth();
  const queryClient = useQueryClient();

  const [displayName, setDisplayName] = useState('');
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

  // Fetch client's posted jobs
  const { data: myJobs, isLoading: loadingJobs } = useQuery({
    queryKey: ['my-jobs'],
    queryFn: async () => {
      const res = await api.get('/jobs/mine');
      return res.data;
    },
    enabled: user?.role === 'Client'
  });

  // Fetch freelancer's submitted proposals
  const { data: myProposals, isLoading: loadingProposals } = useQuery({
    queryKey: ['my-proposals-dashboard'],
    queryFn: async () => {
      const res = await api.get('/proposals/mine');
      return res.data;
    },
    enabled: user?.role === 'Freelancer'
  });

  // Withdraw proposal mutation
  const withdrawMutation = useMutation({
    mutationFn: async (proposalId: string) => {
      await api.post(`/proposals/${proposalId}/withdraw`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-proposals-dashboard'] });
    }
  });

  // Avatar upload
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setProfileError(null);
    setUploadingAvatar(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/files', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setAvatarPath(response.data.fileId);
    } catch (err: any) {
      setProfileError(err.response?.data?.detail || 'Failed to upload avatar.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Profile update submission
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(false);
    setUpdatingProfile(true);

    try {
      const res = await api.put('/auth/profile', {
        displayName,
        preferredCurrency,
        avatarPath
      });
      updateUser(res.data);
      setProfileSuccess(true);
    } catch (err: any) {
      setProfileError(err.response?.data?.detail || 'Failed to update profile.');
    } finally {
      setUpdatingProfile(false);
    }
  };

  const getStatusLabel = (status: number) => {
    switch (status) {
      case 0: return { text: 'Submitted', color: 'text-purple-400 bg-purple-950/60 border-purple-900/50' };
      case 1: return { text: 'Withdrawn', color: 'text-yellow-500 bg-yellow-950/60 border-yellow-900/50' };
      case 2: return { text: 'Accepted (Hired)', color: 'text-emerald-400 bg-emerald-950/60 border-emerald-900/50' };
      case 3: return { text: 'Declined', color: 'text-slate-500 bg-slate-900/60 border-slate-800' };
      default: return { text: 'Unknown', color: 'text-slate-500 bg-slate-900' };
    }
  };

  const getJobStatusLabel = (status: number) => {
    switch (status) {
      case 0: return { text: 'Open', color: 'text-purple-400 bg-purple-950/60 border-purple-900/50' };
      case 1: return { text: 'In Progress', color: 'text-emerald-400 bg-emerald-950/60 border-emerald-900/50' };
      case 2: return { text: 'Closed', color: 'text-slate-500 bg-slate-900/60 border-slate-850' };
      default: return { text: 'Unknown', color: 'text-slate-500 bg-slate-900' };
    }
  };

  return (
    <div className="max-w-7xl w-full mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Profile Settings Left Panel */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="text-center pb-4 border-b border-slate-800">
            <div className="relative inline-block mb-3">
              {avatarPath ? (
                <img
                  src={`/api/files/${avatarPath}`}
                  alt="Avatar"
                  className="w-24 h-24 rounded-full object-cover border-2 border-purple-500 shadow-lg shadow-purple-500/10"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-3xl font-extrabold text-white shadow-lg">
                  {user?.displayName ? user.displayName[0].toUpperCase() : '?'}
                </div>
              )}
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">{user?.displayName}</h2>
            <p className="text-slate-500 text-xs mt-0.5">{user?.role} · {user?.email}</p>
          </div>

          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2">Edit Settings</h3>

            {profileSuccess && (
              <div className="p-3 bg-emerald-950/50 border border-emerald-900 text-emerald-400 rounded-xl text-xs text-center">
                Profile updated successfully!
              </div>
            )}
            {profileError && (
              <div className="p-3 bg-red-950/50 border border-red-900 text-red-400 rounded-xl text-xs text-center">
                {profileError}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Display Name</label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Preferred Currency</label>
              <select
                value={preferredCurrency}
                onChange={(e) => setPreferredCurrency(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="CAD">CAD ($)</option>
                <option value="AUD">AUD ($)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Upload Avatar</label>
              <input
                type="file"
                onChange={handleAvatarUpload}
                className="block w-full text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-purple-950 file:text-purple-400 hover:file:bg-purple-900 transition-colors file:cursor-pointer"
              />
              {uploadingAvatar && <p className="text-xs text-purple-400 animate-pulse mt-1">Uploading...</p>}
            </div>

            <button
              type="submit"
              disabled={updatingProfile || uploadingAvatar}
              className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-2.5 rounded-xl text-sm transition-colors mt-2 disabled:opacity-50"
            >
              {updatingProfile ? 'Saving...' : 'Save Settings'}
            </button>
          </form>
        </div>
      </div>

      {/* Role Panel Right Panel */}
      <div className="lg:col-span-2 space-y-6">
        {/* Client Section */}
        {user?.role === 'Client' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex justify-between items-center pb-4 border-b border-slate-800">
              <div>
                <h2 className="text-2xl font-extrabold text-white tracking-tight my-0">My Posted Jobs</h2>
                <p className="text-slate-400 text-xs mt-0.5">Manage your active and completed job postings</p>
              </div>
              <Link
                to="/jobs/new"
                className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 px-4 rounded-xl text-xs transition-colors shadow-md shadow-purple-500/10"
              >
                Post New Job
              </Link>
            </div>

            {loadingJobs ? (
              <div className="flex justify-center py-12 text-purple-500">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
              </div>
            ) : !myJobs || myJobs.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-sm">
                You haven't posted any jobs yet.
              </div>
            ) : (
              <div className="space-y-4">
                {myJobs.map((job: any) => {
                  const jobStatus = getJobStatusLabel(job.status);
                  return (
                    <div
                      key={job.id}
                      className="bg-slate-950 border border-slate-850 hover:border-slate-750 transition-colors p-5 rounded-xl flex justify-between items-center gap-4"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${jobStatus.color}`}>
                            {jobStatus.text}
                          </span>
                          <span className="text-xs text-slate-500">{job.category}</span>
                        </div>
                        <Link to={`/jobs/${job.id}`}>
                          <h4 className="font-bold text-white text-md hover:text-purple-400 transition-colors">
                            {job.title}
                          </h4>
                        </Link>
                        <p className="text-slate-500 text-xs">
                          Budget: <span className="font-semibold text-slate-300">{job.budgetAmount.toFixed(2)} {job.budgetCurrency}</span> ({job.budgetType === 0 ? 'Fixed' : 'Hourly'})
                        </p>
                      </div>

                      <div className="text-right space-y-1">
                        <span className="text-xs font-bold text-purple-400 bg-purple-950/40 border border-purple-900/30 px-3 py-1 rounded-full">
                          {job.proposalCount} Bid{job.proposalCount !== 1 ? 's' : ''}
                        </span>
                        <div className="pt-2.5">
                          <Link
                            to={`/jobs/${job.id}`}
                            className="bg-slate-850 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-200 font-bold py-1.5 px-3.5 rounded-lg text-xs transition-colors"
                          >
                            Manage Bids
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Freelancer Section */}
        {user?.role === 'Freelancer' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="pb-4 border-b border-slate-800">
              <h2 className="text-2xl font-extrabold text-white tracking-tight my-0">Applied Jobs</h2>
              <p className="text-slate-400 text-xs mt-0.5">Track the status of your submitted proposals</p>
            </div>

            {loadingProposals ? (
              <div className="flex justify-center py-12 text-purple-500">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
              </div>
            ) : !myProposals || myProposals.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-sm">
                You haven't applied to any jobs yet.
              </div>
            ) : (
              <div className="space-y-4">
                {myProposals.map((proposal: any) => {
                  const bidStatus = getStatusLabel(proposal.status);
                  return (
                    <div
                      key={proposal.id}
                      className="bg-slate-950 border border-slate-850 hover:border-slate-750 transition-colors p-5 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${bidStatus.color}`}>
                            {bidStatus.text}
                          </span>
                          <span className="text-xs text-slate-500">
                            Submitted on {new Date(proposal.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <Link to={`/jobs/${proposal.jobId}`}>
                          <h4 className="font-bold text-white text-md hover:text-purple-400 transition-colors">
                            {proposal.jobTitle}
                          </h4>
                        </Link>
                        <div className="text-xs text-slate-400 flex flex-wrap gap-x-4 gap-y-1">
                          <span>
                            Your Bid:{' '}
                            <span className="font-semibold text-slate-200">
                              {proposal.bidAmount.toFixed(2)} {proposal.jobCurrency || 'USD'}
                            </span>
                          </span>
                          <span>
                            Delivery:{' '}
                            <span className="font-semibold text-slate-200">
                              {new Date(proposal.deliveryDate).toLocaleDateString()}
                            </span>
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-2 md:pt-0 self-end md:self-center">
                        <Link
                          to={`/jobs/${proposal.jobId}`}
                          className="bg-slate-850 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-200 font-bold py-1.5 px-3.5 rounded-lg text-xs transition-colors"
                        >
                          View Job
                        </Link>
                        {proposal.status === 0 && (
                          <button
                            onClick={() => {
                              if (window.confirm('Withdraw this bid?')) {
                                withdrawMutation.mutate(proposal.id);
                              }
                            }}
                            className="bg-red-950/40 hover:bg-red-950/80 border border-red-900/50 text-red-400 font-bold py-1.5 px-3.5 rounded-lg text-xs transition-colors"
                          >
                            Withdraw
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
