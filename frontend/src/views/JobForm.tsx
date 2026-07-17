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
  const [budgetType, setBudgetType] = useState('0'); // 0 = Fixed, 1 = Hourly
  const [budgetAmount, setBudgetAmount] = useState('');
  const [budgetCurrency, setBudgetCurrency] = useState('USD');
  const [attachmentPath, setAttachmentPath] = useState<string | null>(null);
  const [status, setStatus] = useState('0'); // 0 = Open, 1 = InProgress, 2 = Closed

  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch job details for edit mode
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

  // File upload handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setUploading(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/files', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setAttachmentPath(response.data.fileId);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to upload attachment.');
    } finally {
      setUploading(false);
    }
  };

  // Create Job mutation
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

  // Update Job mutation
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
      <div className="flex justify-center items-center py-20 text-purple-500">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl w-full mx-auto px-4 py-8">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl backdrop-blur-md">
        <div className="border-b border-slate-800 pb-4 mb-6">
          <h2 className="text-3xl font-extrabold text-white tracking-tight my-0">
            {isEditMode ? 'Edit Job Posting' : 'Post a New Job'}
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Fill out the details to request proposals from freelancers
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-950/50 border border-red-900 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-350 mb-2">Project Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-purple-500"
              placeholder="e.g. Build a Shopify landing page"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-350 mb-2">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500"
              >
                <option value="Web Development">Web Development</option>
                <option value="Mobile Development">Mobile Development</option>
                <option value="Design">Design</option>
                <option value="Writing">Writing</option>
                <option value="Marketing">Marketing</option>
              </select>
            </div>

            {isEditMode && (
              <div>
                <label className="block text-sm font-semibold text-slate-350 mb-2">Project Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="0">Open</option>
                  <option value="1">In Progress</option>
                  <option value="2">Closed</option>
                </select>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-350 mb-2">Description</label>
            <textarea
              required
              rows={6}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-purple-500"
              placeholder="Provide a detailed scope of work, requirements, and deliverables..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-950/40 p-4 rounded-xl border border-slate-850">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-450 mb-2">Budget Type</label>
              <select
                value={budgetType}
                onChange={(e) => setBudgetType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
              >
                <option value="0">Fixed Price</option>
                <option value="1">Hourly Rate</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-450 mb-2">Amount</label>
              <input
                type="number"
                required
                min="1"
                step="0.01"
                value={budgetAmount}
                onChange={(e) => setBudgetAmount(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-purple-500"
                placeholder="500.00"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-450 mb-2">Currency</label>
              <select
                value={budgetCurrency}
                onChange={(e) => setBudgetCurrency(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="CAD">CAD ($)</option>
                <option value="AUD">AUD ($)</option>
              </select>
            </div>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <label className="block text-sm font-semibold text-slate-300">File Attachment (Optional)</label>
            <input
              type="file"
              onChange={handleFileUpload}
              className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-purple-950 file:text-purple-400 hover:file:bg-purple-900 transition-colors file:cursor-pointer"
            />
            {uploading && <p className="text-xs text-purple-400 animate-pulse">Uploading file...</p>}
            {attachmentPath && (
              <p className="text-xs text-green-400 flex items-center gap-1.5">
                ✓ Attachment uploaded successfully! (ID: {attachmentPath.substring(0, 8)}...)
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={createJobMutation.isPending || updateJobMutation.isPending || uploading}
              className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg shadow-purple-500/10 disabled:opacity-50"
            >
              {isEditMode ? 'Save Changes' : 'Post Job'}
            </button>
            <button
              type="button"
              onClick={() => navigate(isEditMode ? `/jobs/${id}` : '/')}
              className="bg-slate-850 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold py-3 px-6 rounded-xl transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
