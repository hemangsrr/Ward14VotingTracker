import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AdminRoute } from '@/components/AdminRoute';
import { AdminOrOverviewRoute } from '@/components/AdminOrOverviewRoute';
import { Layout } from '@/components/Layout';
import { LoginPage } from '@/pages/LoginPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { VotersPage } from '@/pages/VotersPage';
import { VoterDetailPage } from '@/pages/VoterDetailPage';
import { VolunteersPage } from '@/pages/VolunteersPage';
import { VolunteerVotersPage } from '@/pages/VolunteerVotersPage';
import { DataEntryPage } from '@/pages/DataEntryPage';

function App() {
  return (
    <Router>
      <AuthProvider>
        <LanguageProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />

            {/* Admin and Overview routes */}
            <Route
              path="/dashboard"
              element={
                <AdminOrOverviewRoute>
                  <Layout>
                    <DashboardPage />
                  </Layout>
                </AdminOrOverviewRoute>
              }
            />
            <Route
              path="/data-entry"
              element={
                <AdminRoute>
                  <Layout>
                    <DataEntryPage />
                  </Layout>
                </AdminRoute>
              }
            />
            <Route
              path="/volunteers"
              element={
                <AdminOrOverviewRoute>
                  <Layout>
                    <VolunteersPage />
                  </Layout>
                </AdminOrOverviewRoute>
              }
            />
            <Route
              path="/volunteers/:id/voters"
              element={
                <AdminOrOverviewRoute>
                  <Layout>
                    <VolunteerVotersPage />
                  </Layout>
                </AdminOrOverviewRoute>
              }
            />

            {/* Admin-only routes */}

            {/* Protected routes (all authenticated users) */}
            <Route
              path="/voters"
              element={
                <ProtectedRoute>
                  <Layout>
                    <VotersPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/voters/:id"
              element={
                <ProtectedRoute>
                  <Layout>
                    <VoterDetailPage />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Default redirect - role-based */}
            <Route path="/" element={<Navigate to="/voters" replace />} />
            <Route path="*" element={<Navigate to="/voters" replace />} />
          </Routes>
        </LanguageProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
