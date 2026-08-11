import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles = [], allowedPermissions = [] }) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If no roles specified, allow all authenticated users
  if (allowedRoles.length === 0) {
    return children;
  }

  // Check if user has explicit permission override
  const hasPermissionOverride = allowedPermissions.length > 0 && 
    user?.permissions && 
    allowedPermissions.some(p => user.permissions.includes(p));

  // Check if user's role is in the allowed roles
  const hasRole = allowedRoles.length === 0 || allowedRoles.includes(user?.role);

  if (!hasRole && !hasPermissionOverride) {
    return (
      <div className="p-8 text-center bg-red-50 rounded-lg m-8">
        <h2 className="text-red-800 mb-4">🚫 Access Denied</h2>
        <p className="text-red-900">
          You don't have permission to access this page.
        </p>
        <p className="text-red-900 mt-2">
          This module is restricted to {allowedRoles.join(', ')} users only.
        </p>
        <button
          onClick={() => window.history.back()}
          className="mt-6 px-6 py-3 bg-red-600 text-white border-none rounded-lg cursor-pointer font-semibold hover:bg-red-700"
        >
          Go Back
        </button>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
