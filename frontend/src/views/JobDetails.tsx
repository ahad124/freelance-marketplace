import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { ConvertedAmount } from './JobList';
import api from '../utils/api';

const STATUS_MAP: Record<number, { label: string; cls: string }> = {
  0: { label: 'Submitted', cls: 'badge-brand' },
  1: { label: 'Withdrawn', cls: 'badge-muted' },
  2: { label: 'Accepted', cls: 'badge-success' },
  3: { label: 'Declined', cls: 'badge-danger' },
};

const StatusBadge: React.FC<{ status: number }> = ({ status }) => {
  const s = STATUS_MAP[status] ?? STATUS_MAP[1];
  return <span className={s.cls}>{s.label}</span>;
};

export const JobDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [coverLetter, setCoverLetter] = useState('');
  const [bidAmount, setBidAmount] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [editingProposalId, setEditingProposalId] = useState<string | null>(null);

  const [newMilestoneTitle, setNewMilestoneTitle] = useState('');
  const [newMilestoneAmount, setNewMilestoneAmount] = useState('');
  const [newMilestoneDueDate, setNewMilestoneDueDate] = useState('');

  const { data: myContracts } = useQuery({
    queryKey: ['my-contracts'],
    queryFn: async () => {
      const res = await api.get('/contracts/mine');
      return res.data;
    },
    enabled: !!user
  });

  const contractSummary = myContracts?.find((c: any) => c.jobId === id);
  const contractId = contractSummary?.id;

  const { data: contract } = useQuery({
    queryKey: ['contract', contractId],
    queryFn: async () => {
      const res = await api.get(`/contracts/${contractId}`);
      return res.data;
    },
    enabled: !!contractId
  });

  const fundMilestoneMutation = useMutation({
    mutationFn: async (milestoneId: string) => {
      await api.post(`/milestones/${milestoneId}/fund`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract', contractId] });
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
    },
    onError: (err: any) => {
      alert(err.response?.data?.detail || 'Failed to fund milestone.');
    }
  });

  const submitMilestoneMutation = useMutation({
    mutationFn: async (milestoneId: string) => {
      await api.post(`/milestones/${milestoneId}/submit`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract', contractId] });
    },
    onError: (err: any) => {
      alert(err.response?.data?.detail || 'Failed to submit milestone.');
    }
  });

  const releaseMilestoneMutation = useMutation({
    mutationFn: async (milestoneId: string) => {
      await api.post(`/milestones/${milestoneId}/release`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract', contractId] });
      queryClient.invalidateQueries({ queryKey: ['job', id] });
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
    },
    onError: (err: any) => {
      alert(err.response?.data?.detail || 'Failed to release milestone.');
    }
  });

  const rejectMilestoneMutation = useMutation({
    mutationFn: async (milestoneId: string) => {
      await api.post(`/milestones/${milestoneId}/reject`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract', contractId] });
    },
    onError: (err: any) => {
      alert(err.response?.data?.detail || 'Failed to reject milestone.');
    }
  });

  const addMilestoneMutation = useMutation({
    mutationFn: async (payload: any) => {
      await api.post(`/contracts/${contractId}/milestones`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract', contractId] });
      setNewMilestoneTitle('');
      setNewMilestoneAmount('');
      setNewMilestoneDueDate('');
    },
    onError: (err: any) => {
      alert(err.response?.data?.detail || 'Failed to add milestone.');
    }
  });

  const { data: job, isLoading: loadingJob, error: jobError } = useQuery({
    queryKey: ['job', id],
    queryFn: async () => {
      const res = await api.get(`/jobs/${id}`);
      return res.data;
    }
  });

  const { data: proposals, isLoading: loadingProposals } = useQuery({
    queryKey: ['job-proposals', id],
    queryFn: async () => {
      const res = await api.get(`/jobs/${id}/proposals`);
      return res.data;
    },
    enabled: !!job && (user?.role === 'Admin' || job.clientId === user?.id)
  });

  const { data: myProposals } = useQuery({
    queryKey: ['my-proposals'],
    queryFn: async () => {
      const res = await api.get('/proposals/mine');
      return res.data;
    },
    enabled: user?.role === 'Freelancer'
  });

  const existingProposal = myProposals?.find((p: any) => p.jobId === id && p.status === 0);

  const deleteJobMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/jobs/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      navigate('/');
    }
  });

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

  const withdrawProposalMutation = useMutation({
    mutationFn: async (proposalId: string) => {
      await api.post(`/proposals/${proposalId}/withdraw`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-proposals'] });
      queryClient.invalidateQueries({ queryKey: ['job', id] });
    }
  });

  const acceptProposalMutation = useMutation({
    mutationFn: async (proposalId: string) => {
      await api.post(`/proposals/${proposalId}/accept`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job', id] });
      queryClient.invalidateQueries({ queryKey: ['job-proposals', id] });
      queryClient.invalidateQueries({ queryKey: ['my-contracts'] });
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
    },
    onError: (err: any) => {
      alert(err.response?.data?.detail || 'Failed to accept proposal.');
    }
  });

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
    const d = new Date(proposal.deliveryDate);
    const formatted = d.toISOString().substring(0, 16);
    setDeliveryDate(formatted);
  };

  if (loadingJob) {
    return (
      <div className="flex justify-center items-center py-24">
        <div className="w-10 h-10 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (jobError || !job) {
    return (
      <div className="container-app max-w-3xl py-16">
        <div className="card p-12 text-center text-rose-300">Job not found.</div>
      </div>
    );
  }

  const jobStatusBadge =
    job.status === 0 ? <span className="badge-success">Open</span>
    : job.status === 1 ? <span className="badge-warning">In Progress</span>
    : <span className="badge-muted">Closed</span>;

  return (
    <div className="container-app max-w-4xl py-8 space-y-6">
      {/* Job Details Card */}
      <div className="card p-8 space-y-6 animate-fade-up">
        <div className="flex flex-wrap justify-between items-start gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="badge-brand">{job.category}</span>
              {jobStatusBadge}
              <span className="text-subtle text-sm">Posted {new Date(job.createdAt).toLocaleDateString()}</span>
            </div>
            <h1 className="text-3xl font-extrabold">{job.title}</h1>
            <p className="text-muted text-sm">Client: {job.clientName}</p>
          </div>

          <div className="glass rounded-2xl p-4 min-w-[200px]">
            <span className="block text-[11px] font-semibold uppercase tracking-wide text-subtle">
              Budget · {job.budgetType === 0 ? 'Fixed' : 'Hourly'}
            </span>
            <div className="mt-1 text-lg">
              {user ? (
                <ConvertedAmount amount={job.budgetAmount} from={job.budgetCurrency} to={user.preferredCurrency} />
              ) : (
                <span className="text-xl font-bold text-fg">{job.budgetAmount.toFixed(2)} {job.budgetCurrency}</span>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-line pt-6">
          <h3 className="text-lg font-bold text-fg mb-3">Job description</h3>
          <p className="text-muted leading-relaxed whitespace-pre-line">{job.description}</p>
        </div>

        {job.attachmentPath && (
          <div className="border-t border-line pt-6 flex justify-between items-center glass rounded-xl p-4">
            <span className="text-sm font-semibold text-muted flex items-center gap-2">
              <svg className="w-4 h-4 text-brand-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
              Attached file
            </span>
            <button onClick={() => downloadFile(job.attachmentPath)} className="btn-secondary text-brand-300">
              Download
            </button>
          </div>
        )}

        {(user?.role === 'Admin' || job.clientId === user?.id) && (
          <div className="border-t border-line pt-6 flex gap-3">
            <Link to={`/jobs/${job.id}/edit`} className="btn-secondary">Edit Job</Link>
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to delete this job?')) {
                  deleteJobMutation.mutate();
                }
              }}
              className="btn-danger"
            >
              Delete Job
            </button>
          </div>
        )}
      </div>

      {contract && (
        <ContractPanel
          contract={contract}
          user={user}
          onFund={(mId) => fundMilestoneMutation.mutate(mId)}
          onSubmit={(mId) => submitMilestoneMutation.mutate(mId)}
          onRelease={(mId) => releaseMilestoneMutation.mutate(mId)}
          onReject={(mId) => rejectMilestoneMutation.mutate(mId)}
          onAddMilestone={(title, amount, dueDate) => addMilestoneMutation.mutate({ title, amount, dueDate })}
          newTitle={newMilestoneTitle}
          setNewTitle={setNewMilestoneTitle}
          newAmount={newMilestoneAmount}
          setNewAmount={setNewMilestoneAmount}
          newDueDate={newMilestoneDueDate}
          setNewDueDate={setNewMilestoneDueDate}
          isAdding={addMilestoneMutation.isPending}
        />
      )}

      {/* Freelancer Proposal Section */}
      {user?.role === 'Freelancer' && (
        <div className="card p-8 animate-fade-up">
          {existingProposal ? (
            <div>
              {editingProposalId === existingProposal.id ? (
                <form onSubmit={(e) => handleProposalUpdate(e, existingProposal.id)} className="space-y-5">
                  <h3 className="text-xl font-bold">Edit your proposal</h3>
                  {submitError && <div className="p-3 bg-rose-950/40 text-rose-300 rounded-xl text-sm">{submitError}</div>}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="label">Bid amount ({job.budgetCurrency})</label>
                      <input type="number" required step="0.01" value={bidAmount} onChange={(e) => setBidAmount(e.target.value)} className="input" />
                    </div>
                    <div>
                      <label className="label">Estimated delivery</label>
                      <input type="datetime-local" required value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} className="input" />
                    </div>
                  </div>
                  <div>
                    <label className="label">Cover letter</label>
                    <textarea required rows={5} value={coverLetter} onChange={(e) => setCoverLetter(e.target.value)} className="input" placeholder="Why are you the perfect fit?" />
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" disabled={updateProposalMutation.isPending} className="btn-primary">Save changes</button>
                    <button type="button" onClick={() => setEditingProposalId(null)} className="btn-secondary">Cancel</button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-line pb-4">
                    <h3 className="text-xl font-bold">Your submitted proposal</h3>
                    <span className="badge-brand">Active bid</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm glass p-4 rounded-xl">
                    <div>
                      <span className="text-subtle block text-xs">Bid amount</span>
                      <span className="text-fg font-semibold">{existingProposal.bidAmount.toFixed(2)} {job.budgetCurrency}</span>
                    </div>
                    <div>
                      <span className="text-subtle block text-xs">Delivery date</span>
                      <span className="text-fg font-semibold">{new Date(existingProposal.deliveryDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-subtle text-xs block mb-1.5">Cover letter</span>
                    <p className="text-muted whitespace-pre-line text-sm bg-ink-900/40 p-4 rounded-xl border border-line">{existingProposal.coverLetter}</p>
                  </div>
                  <div className="flex gap-3 pt-1">
                    <button onClick={() => startEdit(existingProposal)} className="btn-secondary">Edit bid</button>
                    <button
                      onClick={() => {
                        if (window.confirm('Are you sure you want to withdraw this proposal?')) {
                          withdrawProposalMutation.mutate(existingProposal.id);
                        }
                      }}
                      className="btn-danger"
                    >
                      Withdraw bid
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleProposalSubmit} className="space-y-5">
              <div className="border-b border-line pb-4">
                <h3 className="text-xl font-bold">Submit a proposal</h3>
                <p className="text-subtle text-xs mt-1">Specify your bid amount and delivery estimate</p>
              </div>

              {submitError && (
                <div className="p-3.5 bg-rose-950/40 border border-rose-900/60 rounded-xl text-rose-300 text-sm">{submitError}</div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Bid amount ({job.budgetCurrency})</label>
                  <input type="number" required step="0.01" value={bidAmount} onChange={(e) => setBidAmount(e.target.value)} className="input" placeholder="500.00" />
                </div>
                <div>
                  <label className="label">Estimated delivery</label>
                  <input type="datetime-local" required value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} className="input" />
                </div>
              </div>

              <div>
                <label className="label">Cover letter</label>
                <textarea required rows={6} value={coverLetter} onChange={(e) => setCoverLetter(e.target.value)} className="input" placeholder="Tell the client why you're a great fit for this project…" />
              </div>

              <button type="submit" disabled={submitProposalMutation.isPending} className="btn-primary">
                {submitProposalMutation.isPending ? 'Submitting…' : 'Submit Proposal'}
              </button>
            </form>
          )}
        </div>
      )}

      {/* Client / Admin Proposal Listing */}
      {(user?.role === 'Admin' || job.clientId === user?.id) && (
        <div className="card p-8 space-y-6 animate-fade-up">
          <div className="border-b border-line pb-4">
            <h3 className="text-xl font-bold">Received bids</h3>
            <p className="text-subtle text-xs mt-1">Review bids submitted by freelancers</p>
          </div>

          {loadingProposals ? (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
            </div>
          ) : !proposals || proposals.length === 0 ? (
            <div className="text-center py-10 text-subtle text-sm">No proposals have been submitted yet.</div>
          ) : (
            <div className="space-y-4 stagger">
              {proposals.map((proposal: any) => (
                <div key={proposal.id} className="glass rounded-2xl p-6 space-y-4">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h4 className="font-bold text-fg">{proposal.freelancerName}</h4>
                      <span className="text-xs text-subtle">Submitted {new Date(proposal.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="text-right">
                      <span className="block font-bold text-brand-300 text-lg">{proposal.bidAmount.toFixed(2)} {job.budgetCurrency}</span>
                      <span className="text-xs text-subtle">Delivery by {new Date(proposal.deliveryDate).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <p className="text-muted text-sm whitespace-pre-line bg-ink-900/40 p-4 rounded-xl border border-line">{proposal.coverLetter}</p>

                  <div className="flex justify-between items-center flex-wrap gap-3">
                    <StatusBadge status={proposal.status} />
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
                            className="btn text-fg bg-emerald-600 hover:bg-emerald-500 py-1.5 px-3.5 text-xs shadow-[0_8px_24px_-10px_rgba(16,185,129,0.6)]"
                          >
                            Accept bid
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm('Decline this proposal?')) {
                                declineProposalMutation.mutate(proposal.id);
                              }
                            }}
                            disabled={declineProposalMutation.isPending}
                            className="btn-secondary py-1.5 px-3.5 text-xs"
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
                          className="text-rose-400 hover:text-rose-300 text-xs font-semibold"
                        >
                          Delete bid
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

const MILESTONE_STATUS_MAP: Record<number, { label: string; cls: string }> = {
  0: { label: 'Unfunded', cls: 'badge-danger' },
  1: { label: 'Escrowed', cls: 'badge-brand' },
  2: { label: 'Submitted', cls: 'badge-warning' },
  3: { label: 'Released', cls: 'badge-success' },
};

const MilestoneStatusBadge: React.FC<{ status: number }> = ({ status }) => {
  const s = MILESTONE_STATUS_MAP[status] ?? MILESTONE_STATUS_MAP[0];
  return <span className={s.cls}>{s.label}</span>;
};

const ContractPanel: React.FC<{
  contract: any;
  user: any;
  onFund: (id: string) => void;
  onSubmit: (id: string) => void;
  onRelease: (id: string) => void;
  onReject: (id: string) => void;
  onAddMilestone: (title: string, amount: number, dueDate: string) => void;
  newTitle: string;
  setNewTitle: (v: string) => void;
  newAmount: string;
  setNewAmount: (v: string) => void;
  newDueDate: string;
  setNewDueDate: (v: string) => void;
  isAdding: boolean;
}> = ({
  contract,
  user,
  onFund,
  onSubmit,
  onRelease,
  onReject,
  onAddMilestone,
  newTitle,
  setNewTitle,
  newAmount,
  setNewAmount,
  newDueDate,
  setNewDueDate,
  isAdding
}) => {
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddMilestone(newTitle, parseFloat(newAmount), new Date(newDueDate).toISOString());
  };

  return (
    <div className="card p-8 space-y-6 animate-fade-up">
      <div className="border-b border-line pb-4 flex justify-between items-center flex-wrap gap-2">
        <div>
          <h3 className="text-xl font-bold">Contract & Milestones</h3>
          <p className="text-subtle text-xs mt-1">
            Status: <span className="font-semibold text-fg">{contract.status === 0 ? 'Active' : contract.status === 1 ? 'Completed' : 'Cancelled'}</span>
          </p>
        </div>
        <div className="text-right">
          <span className="block text-xs text-subtle">Agreed Amount</span>
          <span className="text-lg font-bold text-brand-300">{contract.agreedAmount.toFixed(2)} {contract.currency}</span>
        </div>
      </div>

      <div className="space-y-4">
        {contract.milestones.length === 0 ? (
          <p className="text-center py-6 text-subtle text-sm">No milestones defined yet.</p>
        ) : (
          contract.milestones.map((m: any) => (
            <div key={m.id} className="glass rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1.5 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <MilestoneStatusBadge status={m.status} />
                  <span className="text-xs text-subtle">Due {new Date(m.dueDate).toLocaleDateString()}</span>
                </div>
                <h4 className="font-bold text-fg">{m.title}</h4>
                <p className="text-xs text-muted">Amount: <span className="font-semibold text-fg">{m.amount.toFixed(2)} {contract.currency}</span></p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {user.role === 'Client' && m.status === 0 && contract.status === 0 && (
                  <button onClick={() => onFund(m.id)} className="btn-primary py-1.5 px-3.5 text-xs">
                    Fund Escrow
                  </button>
                )}
                {user.role === 'Freelancer' && m.status === 1 && contract.status === 0 && (
                  <button onClick={() => onSubmit(m.id)} className="btn-primary py-1.5 px-3.5 text-xs">
                    Submit Work
                  </button>
                )}
                {user.role === 'Client' && m.status === 2 && contract.status === 0 && (
                  <div className="flex gap-2">
                    <button onClick={() => onRelease(m.id)} className="btn text-white bg-emerald-600 hover:bg-emerald-500 py-1.5 px-3.5 text-xs">
                      Release Payment
                    </button>
                    <button onClick={() => onReject(m.id)} className="btn-danger py-1.5 px-3.5 text-xs">
                      Request Changes
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {user.role === 'Client' && contract.status === 0 && (
        <form onSubmit={handleAddSubmit} className="border-t border-line pt-6 space-y-4">
          <h4 className="text-sm font-bold uppercase tracking-wider text-muted">Add New Milestone</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="label">Milestone Title</label>
              <input type="text" required value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="input" placeholder="e.g. Phase 1: Database Setup" />
            </div>
            <div>
              <label className="label">Amount ({contract.currency})</label>
              <input type="number" required step="0.01" value={newAmount} onChange={(e) => setNewAmount(e.target.value)} className="input" placeholder="300.00" />
            </div>
            <div>
              <label className="label">Due Date</label>
              <input type="datetime-local" required value={newDueDate} onChange={(e) => setNewDueDate(e.target.value)} className="input" />
            </div>
          </div>
          <button type="submit" disabled={isAdding} className="btn-secondary">
            {isAdding ? 'Adding…' : 'Create Milestone'}
          </button>
        </form>
      )}
    </div>
  );
};
