import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If no roles specified, allow all authenticated users
  if (allowedRoles.length === 0) {
    return children;
  }

  // Check if user's role is in the allowed roles
  if (!allowedRoles.includes(user?.role)) {
    return (
      <div style={{ 
        padding: '2rem', 
        textAlign: 'center',
        background: '#fee2e2',
        borderRadius: '0.5rem',
        margin: '2rem'
      }}>
        <h2 style={{ color: '#991b1b', marginBottom: '1rem' }}>🚫 Access Denied</h2>
        <p style={{ color: '#7f1d1d' }}>
          You don't have permission to access this page.
        </p>
        <p style={{ color: '#7f1d1d', marginTop: '0.5rem' }}>
          This module is restricted to {allowedRoles.join(', ')} users only.
        </p>
        <button 
          onClick={() => window.history.back()}
          style={{
            marginTop: '1.5rem',
            padding: '0.75rem 1.5rem',
            background: '#dc2626',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          Go Back
        </button>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
