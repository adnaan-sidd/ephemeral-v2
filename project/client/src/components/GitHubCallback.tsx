import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AlertCircle, Info, ExternalLink } from 'lucide-react';

export default function GitHubCallback() {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(true);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [showFallbackOption, setShowFallbackOption] = useState(false);

  const addDebugInfo = (info: string) => {
    setDebugInfo(prev => [...prev, `${new Date().toISOString().substring(11, 19)}: ${info}`]);
  };

  useEffect(() => {
    const handleCallback = async () => {
      try {
        addDebugInfo('Starting GitHub callback processing');
        
        // Check if we're in a loop or timeout
        const authStartTime = localStorage.getItem('github_auth_started');
        if (authStartTime) {
          const startTime = parseInt(authStartTime, 10);
          const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
          addDebugInfo(`Auth flow started ${elapsedSeconds} seconds ago`);
          
          // If more than 5 minutes, something is wrong
          if (elapsedSeconds > 300) {
            addDebugInfo('Auth flow timeout detected, cleaning up');
            localStorage.removeItem('github_auth_started');
          }
        }
        
        // Get the authorization code from URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        const urlError = urlParams.get('error');

        if (urlError) {
          addDebugInfo(`GitHub OAuth error: ${urlError}`);
          console.error('GitHub OAuth error:', urlError);
          setError('GitHub authentication failed: ' + urlError);
          setProcessing(false);
          setShowFallbackOption(true);
          return;
        }

        if (!code) {
          addDebugInfo('No authorization code received');
          console.error('No authorization code received');
          setError('No authorization code received from GitHub');
          setProcessing(false);
          return;
        }

        addDebugInfo(`Received authorization code (${code.substring(0, 8)}...)`);
        console.log('✅ Received authorization code, sending to backend');

        // Check if token already exists in localStorage (might have been set by the server callback page)
        const existingToken = localStorage.getItem('auth_token');
        if (existingToken) {
          addDebugInfo('Found existing token in localStorage');
          try {
            // Try to refresh user with the existing token
            await refreshUser();
            addDebugInfo('Successfully refreshed user with existing token');
            navigate('/dashboard');
            return;
          } catch (e) {
            addDebugInfo('Failed to use existing token, will try API call');
            // Continue with the normal flow if token refresh fails
          }
        }

        // Send the code to our backend
        addDebugInfo('Making API call to backend');
        let response;
        try {
          response = await fetch('/api/auth/github/callback', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ code, state }),
          });
        } catch (fetchError: any) {
          addDebugInfo(`Fetch error: ${fetchError.message}`);
          console.error('Fetch error:', fetchError);
          setShowFallbackOption(true);
          throw fetchError;
        }

        addDebugInfo(`API response status: ${response.status}`);
        if (!response.ok) {
          let errorText;
          try {
            errorText = await response.text();
          } catch (e) {
            errorText = 'Could not read response text';
          }
          
          addDebugInfo(`Error response: ${errorText}`);
          console.error('Authentication request failed:', response.status, errorText);
          setShowFallbackOption(true);
          
          setError(`GitHub authentication failed (${response.status}): ${errorText || 'Unknown error'}`);
          setProcessing(false);
          return;
        }

        try {
          const data = await response.json();
          addDebugInfo(`API response parsed, success: ${data.success}`);
          
          if (data.success) {
            addDebugInfo('Authentication successful, storing token');
            console.log('✅ Authentication successful, storing token');
            // Store the JWT token
            localStorage.setItem('auth_token', data.token);
            await refreshUser(); // Refresh user data
            
            // Redirect to dashboard
            addDebugInfo('Redirecting to dashboard');
            navigate('/dashboard');
          } else {
            addDebugInfo(`Authentication failed: ${data.error}`);
            console.error('Authentication failed:', data.error);
            setError(`GitHub authentication failed: ${data.error || 'Unknown error'}`);
            setProcessing(false);
            setShowFallbackOption(true);
          }
        } catch (jsonError) {
          addDebugInfo(`Failed to parse JSON: ${jsonError}`);
          console.error('Failed to parse JSON response:', jsonError);
          setError('Failed to process authentication response from server');
          setProcessing(false);
          setShowFallbackOption(true);
        }
      } catch (error: any) {
        addDebugInfo(`Exception: ${error.message}`);
        console.error('Callback handling failed:', error);
        setError(`Authentication process failed: ${error.message || 'Unknown error'}`);
        setProcessing(false);
        setShowFallbackOption(true);
      }
    };

    handleCallback();
  }, [navigate, refreshUser]);

  const tryDirectServerAuth = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    
    if (code) {
      addDebugInfo('Trying direct server authentication');
      window.location.href = `/auth/github/callback/enhanced?code=${code}&state=${state || ''}`;
    } else {
      addDebugInfo('Cannot try direct auth - no code available');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        {processing ? (
          <>
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Completing GitHub Authentication...
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Please wait while we finish setting up your account.
            </p>
            {debugInfo.length > 0 && (
              <div className="mt-6 text-left text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                <div className="flex items-center mb-2">
                  <Info className="h-4 w-4 mr-1" />
                  <span>Debug Information</span>
                </div>
                <pre className="whitespace-pre-wrap overflow-auto max-h-60">
                  {debugInfo.join('\n')}
                </pre>
              </div>
            )}
          </>
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-lg text-left">
            <div className="flex items-start">
              <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400 mr-3 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-800 dark:text-red-300 text-lg">Authentication Failed</h3>
                <p className="text-red-700 dark:text-red-300 mt-2">{error}</p>
                
                {showFallbackOption && (
                  <div className="mt-4">
                    <button 
                      onClick={tryDirectServerAuth}
                      className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors mb-4"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" /> 
                      Try Alternative Authentication Method
                    </button>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      If you're having trouble with the standard authentication, 
                      this will try a direct server-side approach.
                    </p>
                  </div>
                )}
                
                {debugInfo.length > 0 && (
                  <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                    <div className="flex items-center mb-2">
                      <Info className="h-4 w-4 mr-1" />
                      <span>Debug Information</span>
                    </div>
                    <pre className="whitespace-pre-wrap overflow-auto max-h-60">
                      {debugInfo.join('\n')}
                    </pre>
                  </div>
                )}
                
                <button 
                  onClick={() => navigate('/')}
                  className="mt-4 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Return to Homepage
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
