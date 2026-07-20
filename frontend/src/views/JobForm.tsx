import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/api';

export const JobForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditMode = !!id;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Web Development');
  const [budgetType, setBudgetType] = useState('0');
  const [budgetAmount, setBudgetAmount] = useState('');
  const [budgetCurrency, setBudgetCurrency] = useState('USD');
  const [attachmentPath, setAttachmentPath] = useState<string | null>(null);
  const [status, setStatus] = useState('0');

  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: job, isLoading: loadingJob } = useQuery({
    queryKey: ['job', id],
    queryFn: async () => {
      const res = await api.get(`/jobs/${id}`);
      return res.data;
    },
    enabled: isEditMode
  });

  useEffect(() => {
    if (isEditMode && job) {
      setTitle(job.title);
      setDescription(job.description);
      setCategory(job.category);
      setBudgetType(job.budgetType.toString());
      setBudgetAmount(job.budgetAmount.toString());
      setBudgetCurrency(job.budgetCurrency);
      setAttachmentPath(job.attachmentPath);
      setStatus(job.status.toString());
    }
  }, [isEditMode, job]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setUploading(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/files', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setAttachmentPath(response.data.fileId);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to upload attachment.');
    } finally {
      setUploading(false);
    }
  };

  const createJobMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post('/jobs', payload);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      navigate(`/jobs/${data.id}`);
    },
    onError: (err: any) => {
      setError(err.response?.data?.detail || 'Failed to post job.');
    }
  });

  const updateJobMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.put(`/jobs/${id}`, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job', id] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      navigate(`/jobs/${id}`);
    },
    onError: (err: any) => {
      setError(err.response?.data?.detail || 'Failed to save changes.');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const payload = {
      title,
      description,
      category,
      budgetType: parseInt(budgetType),
      budgetAmount: parseFloat(budgetAmount),
      budgetCurrency,
      attachmentPath,
      status: parseInt(status)
    };

    if (isEditMode) {
      updateJobMutation.mutate(payload);
    } else {
      createJobMutation.mutate(payload);
    }
  };

  if (isEditMode && loadingJob) {
    return (
      <div className="flex justify-center items-center py-24">
        <div className="w-10 h-10 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
      </div>
    );
  }

  const submitting = createJobMutation.isPending || updateJobMutation.isPending || uploading;

  return (
    <div className="container-app max-w-2xl py-8">
      <div className="card p-8 animate-fade-up">
        <div className="border-b border-line pb-5 mb-6">
          <span className="eyebrow">{isEditMode ? 'Edit' : 'New posting'}</span>
          <h2 className="mt-2 text-3xl font-extrabold">
            {isEditMode ? 'Edit job posting' : 'Post a new job'}
          </h2>
          <p className="mt-1 text-sm text-muted">Fill out the details to request proposals from freelancers.</p>
        </div>

        {error && (
          <div className="mb-6 p-3.5 bg-rose-950/40 border border-rose-900/60 rounded-xl text-rose-300 text-sm animate-scale-in">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="label">Project title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input"
              placeholder="e.g. Build a Shopify landing page"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="input">
                <option value="Web Development">Web Development</option>
                <option value="Mobile Development">Mobile Development</option>
                <option value="Design">Design</option>
                <option value="Writing">Writing</option>
                <option value="Marketing">Marketing</option>
              </select>
            </div>

            {isEditMode && (
              <div>
                <label className="label">Project status</label>
                <select value={status} onChange={(e) => setStatus(e.target.value)} className="input">
                  <option value="0">Open</option>
                  <option value="1">In Progress</option>
                  <option value="2">Closed</option>
                </select>
              </div>
            )}
          </div>

          <div>
            <label className="label">Description</label>
            <textarea
              required
              rows={6}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input"
              placeholder="Provide a detailed scope of work, requirements, and deliverables…"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 glass p-4 rounded-2xl">
            <div>
              <label className="label">Budget type</label>
              <select value={budgetType} onChange={(e) => setBudgetType(e.target.value)} className="input">
                <option value="0">Fixed Price</option>
                <option value="1">Hourly Rate</option>
              </select>
            </div>
            <div>
              <label className="label">Amount</label>
              <input type="number" required min="1" step="0.01" value={budgetAmount} onChange={(e) => setBudgetAmount(e.target.value)} className="input" placeholder="500.00" />
            </div>
            <div>
              <label className="label">Currency</label>
              <select value={budgetCurrency} onChange={(e) => setBudgetCurrency(e.target.value)} className="input">
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="CAD">CAD ($)</option>
                <option value="AUD">AUD ($)</option>
              </select>
            </div>
          </div>

          <div className="glass p-4 rounded-2xl space-y-3">
            <label className="label mb-0">File attachment (optional)</label>
            <input
              type="file"
              onChange={handleFileUpload}
              className="block w-full text-sm text-muted file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-brand-500/15 file:text-brand-300 hover:file:bg-brand-500/25 file:cursor-pointer file:transition-colors"
            />
            {uploading && (
              <p className="text-xs text-brand-300 flex items-center gap-2">
                <span className="w-3 h-3 border-2 border-brand-400/40 border-t-brand-400 rounded-full animate-spin" />
                Uploading file…
              </p>
            )}
            {attachmentPath && !uploading && (
              <p className="text-xs text-emerald-300 flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Attachment uploaded (ID: {attachmentPath.substring(0, 8)}…)
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? 'Saving…' : isEditMode ? 'Save changes' : 'Post Job'}
            </button>
            <button type="button" onClick={() => navigate(isEditMode ? `/jobs/${id}` : '/')} className="btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
