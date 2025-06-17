import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Github, GitlabIcon, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface GitIntegrationCardProps {
  provider: 'github' | 'gitlab' | 'bitbucket';
  isConnected: boolean;
  username?: string;
  onConnect: () => Promise<void>;
  onDisconnect?: () => Promise<void>;
}

export function GitIntegrationCard({ 
  provider, 
  isConnected, 
  username, 
  onConnect, 
  onDisconnect 
}: GitIntegrationCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  const handleConnect = async () => {
    setIsLoading(true);
    try {
      await onConnect();
      // The onConnect function will handle the redirect
    } catch (error: any) {
      toast({
        title: "Connection failed",
        description: error.message || `Failed to connect with ${provider}. Please try again.`,
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };
  
  const handleDisconnect = async () => {
    if (!onDisconnect) return;
    
    setIsLoading(true);
    try {
      await onDisconnect();
      toast({
        title: "Disconnected",
        description: `Successfully disconnected from ${provider}.`,
      });
    } catch (error: any) {
      toast({
        title: "Disconnection failed",
        description: error.message || `Failed to disconnect from ${provider}. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const getProviderIcon = () => {
    switch (provider) {
      case 'github':
        return <Github className="h-5 w-5" />;
      case 'gitlab':
        return <GitlabIcon className="h-5 w-5" />;
      case 'bitbucket':
        // Using generic icon for Bitbucket since there's no built-in Lucide icon
        return <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M0.35,0.35c-0.4,0.4-0.4,1.3,0,1.7l0,0l10.3,10.3l-10.3,10.3c-0.4,0.4-0.4,1.3,0,1.7c0.4,0.4,1.3,0.4,1.7,0l11.3-11.3c0.4-0.4,0.4-1.3,0-1.7L2.05,0.35C1.65-0.05,0.75-0.05,0.35,0.35z"/>
        </svg>;
    }
  };
  
  const getProviderName = () => {
    return provider.charAt(0).toUpperCase() + provider.slice(1);
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getProviderIcon()}
          {getProviderName()}
        </CardTitle>
        <CardDescription>
          {isConnected 
            ? `Connected to ${getProviderName()} as ${username}` 
            : `Connect your ${getProviderName()} account to access repositories and enable CI/CD pipelines`
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isConnected ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Connected Account</AlertTitle>
            <AlertDescription>
              Your FlowForge account is connected to {getProviderName()} as <strong>{username}</strong>.
              {provider === 'github' && (
                <p className="mt-2 text-sm text-muted-foreground">
                  You can now access your GitHub repositories and set up CI/CD pipelines.
                </p>
              )}
            </AlertDescription>
          </Alert>
        ) : (
          <div className="text-sm text-muted-foreground">
            <p>
              Connecting your {getProviderName()} account allows FlowForge to:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Access your repositories</li>
              <li>Set up webhooks for automated builds</li>
              <li>Clone repositories for building and testing</li>
              <li>Post commit status updates</li>
            </ul>
          </div>
        )}
      </CardContent>
      <CardFooter>
        {isConnected ? (
          <Button 
            variant="outline" 
            onClick={handleDisconnect} 
            disabled={isLoading || !onDisconnect}
            className="w-full"
          >
            {isLoading ? 'Processing...' : 'Disconnect'}
          </Button>
        ) : (
          <Button 
            onClick={handleConnect} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Connecting...' : `Connect ${getProviderName()}`}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

export default function GitIntegrations({
  githubConnected = false,
  githubUsername = '',
  gitlabConnected = false,
  gitlabUsername = '',
  bitbucketConnected = false,
  bitbucketUsername = '',
  onGithubConnect,
  onGitlabConnect,
  onBitbucketConnect,
  onGithubDisconnect,
  onGitlabDisconnect,
  onBitbucketDisconnect,
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-1">Git Provider Integrations</h2>
        <p className="text-sm text-muted-foreground">
          Connect your Git provider accounts to enable repository access and CI/CD pipelines
        </p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <GitIntegrationCard
          provider="github"
          isConnected={githubConnected}
          username={githubUsername}
          onConnect={onGithubConnect}
          onDisconnect={onGithubDisconnect}
        />
        
        <GitIntegrationCard
          provider="gitlab"
          isConnected={gitlabConnected}
          username={gitlabUsername}
          onConnect={onGitlabConnect}
          onDisconnect={onGitlabDisconnect}
        />
        
        <GitIntegrationCard
          provider="bitbucket"
          isConnected={bitbucketConnected}
          username={bitbucketUsername}
          onConnect={onBitbucketConnect}
          onDisconnect={onBitbucketDisconnect}
        />
      </div>
    </div>
  );
}
