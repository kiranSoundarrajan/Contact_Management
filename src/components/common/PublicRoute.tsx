import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAppSelector } from '../../store/hooks';

interface PublicRouteProps {
  children: React.ReactNode;
}

const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  // If user is authenticated, redirect to dashboard
  // Otherwise, show the public page (login/register)
  return isAuthenticated ? <Navigate to="/dashboard" /> : <>{children}</>;
};

export default PublicRoute;