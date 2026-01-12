import React from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { registerSchema } from '../../utils/validationSchemas';
import { RegisterCredentials } from '../../types/auth.types';
import Input from '../ui/Input';
import Button from '../ui/Button';

interface RegisterFormProps {
  onSubmit: (data: RegisterCredentials) => void;
  isLoading: boolean;
  error?: string;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onSubmit, isLoading, error }) => {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid },
  } = useForm<RegisterCredentials>({
    resolver: yupResolver(registerSchema),
    mode: 'onChange',
  });

  const handleFormSubmit = (data: RegisterCredentials) => {
    console.log('Submitting registration data:', data);
    onSubmit(data);
  };

  const password = watch('password');

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div>
        <Input
          label="Username"
          type="text"
          {...register('username')}
          error={errors.username?.message}
          placeholder="Choose a username (min 3 characters)"
          autoComplete="username"
        />
      </div>
      
      <div>
        <Input
          label="Email"
          type="email"
          {...register('email')}
          error={errors.email?.message}
          placeholder="Enter your email"
          autoComplete="email"
        />
      </div>
      
      <div>
        <Input
          label="Password"
          type="password"
          {...register('password')}
          error={errors.password?.message}
          placeholder="Create a password (min 3 characters)"
          autoComplete="new-password"
        />
        {password && (
          <div className="mt-1">
            <div className={`h-1 w-1/4 rounded-full ${password.length >= 3 ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <p className="text-xs text-gray-500 mt-1">
              {password.length < 3 ? 'Minimum 3 characters required' : '✓ Password length OK'}
            </p>
          </div>
        )}
      </div>
      
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
      
      <Button
        type="submit"
        isLoading={isLoading}
        className="w-full"
        disabled={!isValid || isLoading}
      >
        {isLoading ? 'Creating Account...' : 'Create Account'}
      </Button>
      
      <div className="text-center text-sm text-gray-600">
        <p>
          Already have an account?{' '}
          <a href="/login" className="text-blue-600 hover:text-blue-500 font-medium">
            Sign in
          </a>
        </p>
      </div>
    </form>
  );
};

export default RegisterForm;