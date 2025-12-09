import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AdminRoute } from '@/components/AdminRoute';
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

            {/* Admin-only routes */}
            <Route
              path="/dashboard"
              element={
                <AdminRoute>
                  <Layout>
                    <DashboardPage />
                  </Layout>
                </AdminRoute>
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
                <AdminRoute>
                  <Layout>
                    <VolunteersPage />
                  </Layout>
                </AdminRoute>
              }
            />
            <Route
              path="/volunteers/:id/voters"
              element={
                <AdminRoute>
                  <Layout>
                    <VolunteerVotersPage />
                  </Layout>
                </AdminRoute>
              }
            />

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
