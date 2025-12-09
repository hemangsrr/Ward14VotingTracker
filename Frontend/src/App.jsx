import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Layout } from '@/components/Layout';
import { LoginPage } from '@/pages/LoginPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { VotersPage } from '@/pages/VotersPage';
import { VoterDetailPage } from '@/pages/VoterDetailPage';
import { VolunteersPage } from '@/pages/VolunteersPage';
import { VolunteerVotersPage } from '@/pages/VolunteerVotersPage';

function App() {
  return (
    <Router>
      <AuthProvider>
        <LanguageProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />

            {/* Protected routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Layout>
                    <DashboardPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
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
            <Route
              path="/volunteers"
              element={
                <ProtectedRoute>
                  <Layout>
                    <VolunteersPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/volunteers/:id/voters"
              element={
                <ProtectedRoute>
                  <Layout>
                    <VolunteerVotersPage />
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
