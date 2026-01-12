import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { login, clearError } from '../store/slices/authSlice';
import LoginForm from '../components/auth/LoginForm';
import { LoginCredentials } from '../types/auth.types';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((state) => state.auth); // Removed isAuthenticated

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const handleLogin = async (credentials: LoginCredentials) => {
    try {
      await dispatch(login(credentials)).unwrap(); // Removed result variable
      toast.success('Login successful!');
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Sign in to your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Or{' '}
          <a 
            href="/register" 
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            create a new account
          </a>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <LoginForm onSubmit={handleLogin} isLoading={loading} />
          
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Demo Credentials</span>
              </div>
            </div>
            
            <div className="mt-6 grid grid-cols-1 gap-3">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-gray-900 mb-1">Admin</p>
                <p className="text-sm text-gray-600">kiransoundarrajan@gmail.com</p>
                <p className="text-sm text-gray-600">Password: 1234567890</p>
              </div>
            </div>
            
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <a 
                  href="/register" 
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  Sign up
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;