import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  plan: string;
  company?: string;
  githubUsername?: string;
  githubId?: string;
  avatarUrl?: string;
  name?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  loginWithGithub: () => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user is already logged in on page load
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        setLoading(true);
        const storedToken = localStorage.getItem('auth_token');
        if (!storedToken) {
          setLoading(false);
          return;
        }

        setToken(storedToken);
        console.log('✅ Found token in localStorage, verifying with backend...');
        
        try {
          const response = await fetch('/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${storedToken}`,
            },
          });

          if (response.ok) {
            const userData = await response.json();
            console.log('✅ Successfully verified token and retrieved user data');
            setUser(userData);
          } else {
            console.error('❌ Invalid token, removing from localStorage');
            // Invalid token, remove it
            localStorage.removeItem('auth_token');
            setToken(null);
          }
        } catch (error) {
          console.error('❌ Error checking authentication status:', error);
          localStorage.removeItem('auth_token');
          setToken(null);
        }
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const refreshUser = async () => {
    const storedToken = localStorage.getItem('auth_token');
    if (!storedToken) {
      console.log('❌ No token found in localStorage during refreshUser');
      return;
    }

    try {
      console.log('🔄 Refreshing user data...');
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${storedToken}`,
        },
      });

      if (response.ok) {
        const userData = await response.json();
        console.log('✅ Successfully refreshed user data:', userData.email);
        setUser(userData);
        setToken(storedToken);
      } else {
        console.error('❌ Failed to refresh user, status:', response.status);
        // Invalid token, remove it
        localStorage.removeItem('auth_token');
        setUser(null);
        setToken(null);
      }
    } catch (error) {
      console.error('❌ Error refreshing user:', error);
      localStorage.removeItem('auth_token');
      setUser(null);
      setToken(null);
    }
  };

  const loginWithGithub = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Clear any existing tokens to prevent issues
      localStorage.removeItem('auth_token');
      
      // Get GitHub OAuth URL from backend
      console.log('🔄 Requesting GitHub OAuth URL from backend...');
      const response = await fetch('/api/auth/github', {
        headers: { 'Cache-Control': 'no-cache' }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText };
        }
        console.error('❌ Failed to get GitHub auth URL:', errorData);
        throw new Error(errorData.error || 'Failed to initiate GitHub login');
      }
      
      const data = await response.json();
      
      if (data.authUrl) {
        console.log('✅ Received GitHub OAuth URL, redirecting...', 
          data.authUrl.substring(0, 60) + '...');
        
        // Store a timestamp to detect if the flow gets stuck
        localStorage.setItem('github_auth_started', Date.now().toString());
        
        // Redirect to GitHub OAuth
        window.location.href = data.authUrl;
      } else {
        console.error('❌ No authUrl in response:', data);
        throw new Error('Failed to initiate GitHub login: No authentication URL provided');
      }
    } catch (error: any) {
      console.error('❌ GitHub login failed:', error);
      setError(error.message || 'GitHub login failed. Please try again.');
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Call backend logout endpoint
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout request failed:', error);
    } finally {
      // Always clear local state and token
      localStorage.removeItem('auth_token');
      setUser(null);
      setToken(null);
    }
  };

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }
      
      localStorage.setItem('auth_token', data.token);
      setToken(data.token);
      setUser(data.user);
    } catch (error: any) {
      console.error('Login failed:', error);
      setError(error.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }
      
      localStorage.setItem('auth_token', data.token);
      setToken(data.token);
      setUser(data.user);
    } catch (error: any) {
      console.error('Registration failed:', error);
      setError(error.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!user,
        user,
        token,
        loading,
        error,
        login,
        register,
        loginWithGithub,
        logout,
        refreshUser,
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
