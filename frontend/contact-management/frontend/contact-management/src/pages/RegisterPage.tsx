import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { register, clearError } from '../store/slices/authSlice';
import RegisterForm from '../components/auth/RegisterForm';
import { RegisterCredentials } from '../types/auth.types';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((state) => state.auth); // Removed isAuthenticated

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const handleRegister = async (userData: RegisterCredentials) => {
    try {
      await dispatch(register(userData)).unwrap(); // Removed result variable
      toast.success('Registration successful!');
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.message || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Create your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Or{' '}
          <a 
            href="/login" 
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            sign in to existing account
          </a>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <RegisterForm onSubmit={handleRegister} isLoading={loading} />
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;