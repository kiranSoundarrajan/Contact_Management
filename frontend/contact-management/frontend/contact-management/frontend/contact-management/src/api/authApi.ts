import axiosInstance from './axiosInstance';
import { LoginCredentials, RegisterCredentials, LoginResponse, RegisterResponse } from '../types/auth.types';

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    const response = await axiosInstance.post('/auth/login', credentials);
    return response.data;
  },

  register: async (userData: RegisterCredentials): Promise<RegisterResponse> => {
    const response = await axiosInstance.post('/auth/register', userData);
    return response.data;
  },

  logout: async (): Promise<void> => {
    await axiosInstance.post('/auth/logout');
  },

  createAdmin: async (secretKey: string) => {
    const response = await axiosInstance.post('/auth/createAdmin', { secretKey });
    return response.data;
  },
};