import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  // Actions
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      error: null,
      
      setUser: (user) => set({ user }),
      
      setToken: (token) => set({ token }),
      
      login: async (email, password) => {
        set({ isLoading: true, error: null });
        
        try {
          // This is a placeholder for actual API call
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Simulate successful login with mock data
          const user: User = {
            id: 'user-1',
            email,
            name: email.split('@')[0]
          };
          
          const token = 'mock-jwt-token';
          
          set({ user, token, isLoading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to login', 
            isLoading: false 
          });
        }
      },
      
      register: async (email, password, name) => {
        set({ isLoading: true, error: null });
        
        try {
          // This is a placeholder for actual API call
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Simulate successful registration with mock data
          const user: User = {
            id: 'user-' + Date.now(),
            email,
            name: name || email.split('@')[0]
          };
          
          const token = 'mock-jwt-token';
          
          set({ user, token, isLoading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to register', 
            isLoading: false 
          });
        }
      },
      
      logout: () => {
        set({ user: null, token: null });
      },
      
      setLoading: (isLoading) => set({ isLoading }),
      
      setError: (error) => set({ error })
    }),
    {
      name: 'flowforge-auth',
      partialize: (state) => ({ 
        user: state.user, 
        token: state.token 
      })
    }
  )
);
