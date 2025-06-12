import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getUserData } from '../utils/api';
import { useAuth as useZustandAuth } from '../lib/auth';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  loginWithGithub: () => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const zustandAuth = useZustandAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user is already logged in
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const userData = await getUserData();
        setUser(userData);
      } catch (error) {
        console.error('Failed to get user data:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, [zustandAuth.user]);

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    
    try {
      await zustandAuth.login(email, password);
      const userData = await getUserData();
      setUser(userData);
    } catch (error: any) {
      console.error('Login failed:', error);
      setError(error.message || 'Login failed. Please try again.');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const loginWithGithub = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Here we would integrate with our GitHub authentication component
      // For now, we'll just simulate a successful login
      await zustandAuth.login('github-user@example.com', 'github-auth');
      const userData = await getUserData();
      setUser(userData);
    } catch (error: any) {
      console.error('GitHub login failed:', error);
      setError(error.message || 'GitHub login failed. Please try again.');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    setLoading(true);
    setError(null);
    
    try {
      await zustandAuth.register(email, password, 'free');
      const userData = await getUserData();
      setUser(userData);
    } catch (error: any) {
      console.error('Registration failed:', error);
      setError(error.message || 'Registration failed. Please try again.');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    zustandAuth.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!user,
        user,
        loading,
        error,
        login,
        loginWithGithub,
        register,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
