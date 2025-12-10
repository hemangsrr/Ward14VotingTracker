import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export const AdminOrOverviewRoute = ({ children }) => {
  const { user, loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Allow admin and overview users
  if (!isAdmin && user.role !== 'overview') {
    // Volunteers trying to access these pages get redirected to voters
    return <Navigate to="/voters" replace />;
  }

  return children;
};
