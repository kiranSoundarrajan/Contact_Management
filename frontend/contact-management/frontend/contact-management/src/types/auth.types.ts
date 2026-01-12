export interface User {
  id: number;
  username: string;
  email: string;
  role: 'user' | 'admin';
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  username: string;
  email: string;
  password: string;
  role?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

export interface LoginResponse {
  success: boolean;
  token: string;
  user: User;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  token: string;
  user: User;
}