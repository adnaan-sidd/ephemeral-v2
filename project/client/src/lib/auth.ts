import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiRequest } from './queryClient';

interface User {
  id: string;
  email: string;
  plan: string;
  company?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, plan: string, company?: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User | null) => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      login: async (email: string, password: string) => {
        const response = await apiRequest('POST', '/api/auth/login', { email, password });
        const data = await response.json();
        
        set({ user: data.user, token: data.token });
      },
      register: async (email: string, password: string, plan: string, company?: string) => {
        const response = await apiRequest('POST', '/api/auth/register', { 
          email, 
          password, 
          plan,
          company 
        });
        const data = await response.json();
        
        set({ user: data.user, token: data.token });
      },
      logout: () => {
        set({ user: null, token: null });
      },
      setUser: (user: User | null) => {
        set({ user });
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);

// Axios interceptor to add auth token
export const getAuthHeader = () => {
  const token = useAuth.getState().token;
  return token ? { Authorization: `Bearer ${token}` } : {};
};
