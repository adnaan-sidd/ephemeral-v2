import { apiRequest as baseApiRequest } from '../lib/queryClient';

const BASE_URL = '/api';

// Function to make authenticated requests
export async function apiRequest(endpoint: string, options = {}) {
  try {
    const response = await baseApiRequest('GET', endpoint, options);
    
    if (!response.ok) {
      const error = await response.json().catch(() => null);
      throw new Error(error?.message || `API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}

// Mock function to simulate GitHub OAuth flow
export async function initiateGithubOAuth() {
  // In a real app, this would redirect to GitHub's OAuth flow
  // For demo purposes, we'll just simulate success
  return { success: true };
}

// Get user data from auth store
export async function getUserData() {
  // For demo purposes, we'll check local storage which is where our auth state is persisted
  const authData = JSON.parse(localStorage.getItem('auth-storage') || '{}');
  
  if (authData?.state?.user) {
    return {
      id: authData.state.user.id,
      name: authData.state.user.email.split('@')[0], // Create a name from email
      email: authData.state.user.email,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(authData.state.user.email)}&background=random`
    };
  }
  
  return null;
}
