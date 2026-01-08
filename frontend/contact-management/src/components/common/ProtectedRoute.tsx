import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAppSelector } from '../../store/hooks';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAdmin = false 
}) => {
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  // User is authenticated
  const isAdmin = user?.role === 'admin';
  
  // If user is admin and trying to access non-admin route (like dashboard)
  // Redirect them to admin contacts page
  if (isAdmin && !requireAdmin) {
    return <Navigate to="/admin/contacts" />;
  }

  // If admin role required but user is not admin
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/dashboard" />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;