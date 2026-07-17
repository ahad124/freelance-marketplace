import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './views/Login';
import { Register } from './views/Register';
import { JobList } from './views/JobList';
import { JobDetails } from './views/JobDetails';
import { JobForm } from './views/JobForm';
import { AdminDashboard } from './views/AdminDashboard';
import { Dashboard } from './views/Dashboard';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5, // 5 minutes
    }
  }
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-slate-950 text-white">
            <Navbar />
            <main className="flex flex-col items-center">
              <Routes>
                {/* Public routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Semi-public: job list visible to all, but budget conversion needs auth */}
                <Route path="/" element={<JobList />} />
                <Route path="/jobs/:id" element={<JobDetails />} />

                {/* Protected: All authenticated users */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />

                {/* Protected: Client only */}
                <Route
                  path="/jobs/new"
                  element={
                    <ProtectedRoute allowedRoles={['Client', 'Admin']}>
                      <JobForm />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/jobs/:id/edit"
                  element={
                    <ProtectedRoute allowedRoles={['Client', 'Admin']}>
                      <JobForm />
                    </ProtectedRoute>
                  }
                />

                {/* Protected: Admin only */}
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute allowedRoles={['Admin']}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* Catch-all redirect */}
                <Route path="*" element={<JobList />} />
              </Routes>
            </main>
          </div>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
