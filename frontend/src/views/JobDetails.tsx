import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { ConvertedAmount } from './JobList';
import api from '../utils/api';

export const JobDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [coverLetter, setCoverLetter] = useState('');
  const [bidAmount, setBidAmount] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Editing state for freelancer's own proposal
  const [editingProposalId, setEditingProposalId] = useState<string | null>(null);

  // Fetch job details
  const { data: job, isLoading: loadingJob, error: jobError } = useQuery({
    queryKey: ['job', id],
    queryFn: async () => {
      const res = await api.get(`/jobs/${id}`);
      return res.data;
    }
  });

  // Fetch proposals (only for Client owner or Admin)
  const { data: proposals, isLoading: loadingProposals } = useQuery({
    queryKey: ['job-proposals', id],
    queryFn: async () => {
      const res = await api.get(`/jobs/${id}/proposals`);
      return res.data;
    },
    enabled: !!job && (user?.role === 'Admin' || job.clientId === user?.id)
  });

  // Fetch freelancer's own proposals to check if they already bid
  const { data: myProposals } = useQuery({
    queryKey: ['my-proposals'],
    queryFn: async () => {
      const res = await api.get('/proposals/mine');
      return res.data;
    },
    enabled: user?.role === 'Freelancer'
  });

  const existingProposal = myProposals?.find((p: any) => p.jobId === id && p.status === 0); // 0 = Submitted

  // Delete Job mutation
  const deleteJobMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/jobs/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      navigate('/');
    }
  });

  // Submit Proposal mutation
  const submitProposalMutation = useMutation({
    mutationFn: async (newProposal: any) => {
      const res = await api.post('/proposals', newProposal);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-proposals'] });
      queryClient.invalidateQueries({ queryKey: ['job', id] });
      setCoverLetter('');
      setBidAmount('');
      setDeliveryDate('');
    },
    onError: (err: any) => {
      setSubmitError(err.response?.data?.detail || 'Failed to submit proposal.');
    }
  });

  // Update Proposal mutation
  const updateProposalMutation = useMutation({
    mutationFn: async ({ proposalId, payload }: { proposalId: string; payload: any }) => {
      const res = await api.put(`/proposals/${proposalId}`, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-proposals'] });
      setEditingProposalId(null);
    },
    onError: (err: any) => {
      setSubmitError(err.response?.data?.detail || 'Failed to update proposal.');
    }
  });

  // Withdraw Proposal mutation
  const withdrawProposalMutation = useMutation({
    mutationFn: async (proposalId: string) => {
      await api.post(`/proposals/${proposalId}/withdraw`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-proposals'] });
      queryClient.invalidateQueries({ queryKey: ['job', id] });
    }
  });

  // Accept Proposal mutation
  const acceptProposalMutation = useMutation({
    mutationFn: async (proposalId: string) => {
      await api.post(`/proposals/${proposalId}/accept`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job', id] });
      queryClient.invalidateQueries({ queryKey: ['job-proposals', id] });
    },
    onError: (err: any) => {
      alert(err.response?.data?.detail || 'Failed to accept proposal.');
    }
  });

  // Decline Proposal mutation
  const declineProposalMutation = useMutation({
    mutationFn: async (proposalId: string) => {
      await api.post(`/proposals/${proposalId}/decline`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-proposals', id] });
    },
    onError: (err: any) => {
      alert(err.response?.data?.detail || 'Failed to decline proposal.');
    }
  });

  const downloadFile = async (filePath: string) => {
    try {
      const response = await api.get(`/files/${filePath}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filePath.split('_').pop() || 'attachment');
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to download attachment. You must be authenticated.');
    }
  };

  const handleProposalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    if (!id) return;

    submitProposalMutation.mutate({
      jobId: id,
      coverLetter,
      bidAmount: parseFloat(bidAmount),
      deliveryDate: new Date(deliveryDate).toISOString()
    });
  };

  const handleProposalUpdate = (e: React.FormEvent, proposalId: string) => {
    e.preventDefault();
    setSubmitError(null);
    updateProposalMutation.mutate({
      proposalId,
      payload: {
        coverLetter,
        bidAmount: parseFloat(bidAmount),
        deliveryDate: new Date(deliveryDate).toISOString()
      }
    });
  };

  const startEdit = (proposal: any) => {
    setEditingProposalId(proposal.id);
    setCoverLetter(proposal.coverLetter);
    setBidAmount(proposal.bidAmount.toString());
    // Format date for datetime-local input (YYYY-MM-DDTHH:MM)
    const d = new Date(proposal.deliveryDate);
    const formatted = d.toISOString().substring(0, 16);
    setDeliveryDate(formatted);
  };

  if (loadingJob) {
    return (
      <div className="flex justify-center items-center py-20 text-purple-500">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (jobError || !job) {
    return (
      <div className="max-w-3xl mx-auto my-12 text-center py-12 text-red-400 border border-slate-800 rounded-2xl bg-slate-900/50">
        Job not found.
      </div>
    );
  }

  return (
    <div className="max-w-4xl w-full mx-auto px-4 py-8 space-y-8">
      {/* Job Details Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl space-y-6">
        <div className="flex flex-wrap justify-between items-start gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="bg-purple-950/80 border border-purple-900 text-purple-400 text-xs px-2.5 py-1 rounded-full font-semibold">
                {job.category}
              </span>
              <span className="text-slate-500 text-sm">
                Posted on {new Date(job.createdAt).toLocaleDateString()}
              </span>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight my-0">{job.title}</h1>
            <p className="text-slate-400 text-sm">Client: {job.clientName}</p>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 min-w-[200px]">
            <span className="text-slate-450 block text-xs font-semibold uppercase tracking-wide">
              Budget ({job.budgetType === 0 ? 'Fixed' : 'Hourly'})
            </span>
            {user ? (
              <ConvertedAmount amount={job.budgetAmount} from={job.budgetCurrency} to={user.preferredCurrency} />
            ) : (
              <span className="text-xl font-bold text-white">
                {job.budgetAmount.toFixed(2)} {job.budgetCurrency}
              </span>
            )}
          </div>
        </div>

        <div className="border-t border-slate-800 pt-6">
          <h3 className="text-lg font-bold text-slate-200 mb-3">Job Description</h3>
          <p className="text-slate-300 leading-relaxed whitespace-pre-line">{job.description}</p>
        </div>

        {job.attachmentPath && (
          <div className="border-t border-slate-800 pt-6 flex justify-between items-center bg-slate-950/50 p-4 rounded-xl">
            <span className="text-sm font-semibold text-slate-300">Attached File</span>
            <button
              onClick={() => downloadFile(job.attachmentPath)}
              className="bg-purple-600/10 hover:bg-purple-600/20 text-purple-400 font-semibold py-2 px-4 rounded-lg border border-purple-500/20 transition-all text-sm"
            >
              Download Attachment
            </button>
          </div>
        )}

        {(user?.role === 'Admin' || job.clientId === user?.id) && (
          <div className="border-t border-slate-800 pt-6 flex gap-3">
            <Link
              to={`/jobs/${job.id}/edit`}
              className="bg-slate-850 hover:bg-slate-800 border border-slate-800 text-white font-bold py-2.5 px-5 rounded-xl text-sm transition-colors"
            >
              Edit Job
            </Link>
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to delete this job?')) {
                  deleteJobMutation.mutate();
                }
              }}
              className="bg-red-950/40 hover:bg-red-950/80 border border-red-900/50 text-red-400 font-bold py-2.5 px-5 rounded-xl text-sm transition-colors"
            >
              Delete Job
            </button>
          </div>
        )}
      </div>

      {/* Freelancer Proposals Form / Detail Section */}
      {user?.role === 'Freelancer' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl">
          {existingProposal ? (
            <div>
              {editingProposalId === existingProposal.id ? (
                /* Edit Proposal Form */
                <form onSubmit={(e) => handleProposalUpdate(e, existingProposal.id)} className="space-y-6">
                  <h3 className="text-xl font-bold text-white">Edit Your Proposal</h3>
                  {submitError && <div className="p-3 bg-red-950/50 text-red-400 rounded-lg text-sm">{submitError}</div>}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-350 mb-2">Bid Amount ({job.budgetCurrency})</label>
                      <input
                        type="number"
                        required
                        step="0.01"
                        value={bidAmount}
                        onChange={(e) => setBidAmount(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-350 mb-2">Estimated Delivery Date</label>
                      <input
                        type="datetime-local"
                        required
                        value={deliveryDate}
                        onChange={(e) => setDeliveryDate(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-350 mb-2">Cover Letter</label>
                    <textarea
                      required
                      rows={5}
                      value={coverLetter}
                      onChange={(e) => setCoverLetter(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                      placeholder="Why are you the perfect fit for this job?"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={updateProposalMutation.isPending}
                      className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-2.5 px-5 rounded-xl text-sm transition-colors"
                    >
                      Save Changes
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingProposalId(null)}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2.5 px-5 rounded-xl text-sm transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                /* Proposal View Mode */
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                    <h3 className="text-xl font-bold text-white">Your Submitted Proposal</h3>
                    <span className="bg-purple-950 text-purple-400 border border-purple-900 text-xs px-3 py-1 rounded-full font-semibold">
                      Active Bid
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm bg-slate-950 p-4 rounded-xl border border-slate-800">
                    <div>
                      <span className="text-slate-500 block">Bid Amount</span>
                      <span className="text-white font-semibold">{existingProposal.bidAmount.toFixed(2)} {job.budgetCurrency}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Delivery Date</span>
                      <span className="text-white font-semibold">{new Date(existingProposal.deliveryDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500 text-sm block mb-1">Cover Letter</span>
                    <p className="text-slate-350 whitespace-pre-line text-sm bg-slate-950/30 p-4 rounded-xl border border-slate-850">{existingProposal.coverLetter}</p>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => startEdit(existingProposal)}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2 px-4 rounded-xl text-sm transition-colors"
                    >
                      Edit Bid
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm('Are you sure you want to withdraw this proposal?')) {
                          withdrawProposalMutation.mutate(existingProposal.id);
                        }
                      }}
                      className="bg-red-950/40 hover:bg-red-950/80 border border-red-900/50 text-red-400 font-bold py-2 px-4 rounded-xl text-sm transition-colors"
                    >
                      Withdraw Bid
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Proposal Submission Form */
            <form onSubmit={handleProposalSubmit} className="space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <h3 className="text-xl font-bold text-white">Submit a Proposal</h3>
                <p className="text-slate-500 text-xs mt-1">Specify your bid amount and delivery estimation</p>
              </div>

              {submitError && (
                <div className="p-4 bg-red-950/50 border border-red-900 rounded-lg text-red-400 text-sm">
                  {submitError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Bid Amount ({job.budgetCurrency})</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
                    placeholder="500.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Estimated Delivery Date</label>
                  <input
                    type="datetime-local"
                    required
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Cover Letter</label>
                <textarea
                  required
                  rows={6}
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
                  placeholder="Tell the client why you're a great fit for this project..."
                />
              </div>

              <button
                type="submit"
                disabled={submitProposalMutation.isPending}
                className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg shadow-purple-500/10 disabled:opacity-50"
              >
                {submitProposalMutation.isPending ? 'Submitting...' : 'Submit Proposal'}
              </button>
            </form>
          )}
        </div>
      )}

      {/* Client / Admin Proposal Listing */}
      {(user?.role === 'Admin' || job.clientId === user?.id) && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h3 className="text-xl font-bold text-white">Received Bids</h3>
            <p className="text-slate-500 text-xs mt-1">Review bids submitted by freelancers</p>
          </div>

          {loadingProposals ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
            </div>
          ) : !proposals || proposals.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm">
              No proposals have been submitted for this job yet.
            </div>
          ) : (
            <div className="space-y-4">
              {proposals.map((proposal: any) => (
                <div
                  key={proposal.id}
                  className="bg-slate-950 border border-slate-850 rounded-xl p-6 space-y-4"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h4 className="font-bold text-white text-md">{proposal.freelancerName}</h4>
                      <span className="text-xs text-slate-500">
                        Submitted {new Date(proposal.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="block font-bold text-purple-400 text-lg">
                        {proposal.bidAmount.toFixed(2)} {job.budgetCurrency}
                      </span>
                      <span className="text-xs text-slate-500">
                        Delivery by {new Date(proposal.deliveryDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <p className="text-slate-350 text-sm whitespace-pre-line bg-slate-900/30 p-4 rounded-lg border border-slate-800">
                    {proposal.coverLetter}
                  </p>

                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500 font-semibold uppercase">
                      Status:{' '}
                      <span
                        className={
                          proposal.status === 0
                            ? 'text-purple-400'
                            : proposal.status === 1
                            ? 'text-yellow-500'
                            : 'text-slate-600'
                        }
                      >
                        {proposal.status === 0
                          ? 'Submitted'
                          : proposal.status === 1
                          ? 'Withdrawn'
                          : proposal.status === 2
                          ? 'Accepted'
                          : 'Declined'}
                      </span>
                    </span>
                    <div className="flex items-center gap-3">
                      {job.clientId === user?.id && proposal.status === 0 && job.status === 0 && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              if (window.confirm('Accept this proposal? All other submitted bids will be auto-declined, and the job status will change to In Progress.')) {
                                acceptProposalMutation.mutate(proposal.id);
                              }
                            }}
                            disabled={acceptProposalMutation.isPending}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-1.5 px-3.5 rounded-lg text-xs transition-colors"
                          >
                            Accept Bid
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm('Decline this proposal?')) {
                                declineProposalMutation.mutate(proposal.id);
                              }
                            }}
                            disabled={declineProposalMutation.isPending}
                            className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-bold py-1.5 px-3.5 rounded-lg text-xs transition-colors"
                          >
                            Decline
                          </button>
                        </div>
                      )}
                      {user?.role === 'Admin' && (
                        <button
                          onClick={async () => {
                            if (window.confirm('Delete this proposal permanently?')) {
                              await api.delete(`/proposals/${proposal.id}`);
                              queryClient.invalidateQueries({ queryKey: ['job-proposals', id] });
                            }
                          }}
                          className="text-red-400 hover:text-red-300 text-xs font-semibold"
                        >
                          Delete Bid
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
