import { useState, useEffect } from 'react';
import { Check, Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

interface Repository {
  id: number | string; // GitHub/GitLab uses numbers, Bitbucket uses UUIDs
  name: string;
  full_name?: string; // GitHub, Bitbucket
  path_with_namespace?: string; // GitLab
  description: string;
  default_branch?: string;
  private: boolean; // GitHub
  is_private?: boolean; // Bitbucket
  visibility?: string; // GitLab
  html_url?: string; // GitHub
  web_url?: string; // GitLab
  links?: { // Bitbucket
    html?: {
      href: string;
    }[];
  };
  owner?: {
    login?: string; // GitHub
    username?: string; // Bitbucket
    avatar_url?: string; // GitHub
    name?: string; // GitLab
  };
  namespace?: { // GitLab
    name: string;
  };
}

interface RepositorySelectorProps {
  onSelect: (repository: {
    name: string;
    repositoryUrl: string;
    repositoryProvider: 'github' | 'gitlab' | 'bitbucket';
    repositoryId: string;
    defaultBranch: string;
  }) => void;
  isSubmitting?: boolean;
}

export default function RepositorySelector({ onSelect, isSubmitting = false }: RepositorySelectorProps) {
  const [provider, setProvider] = useState<'github' | 'gitlab' | 'bitbucket'>('github');
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [verifyingAccess, setVerifyingAccess] = useState(false);
  const [accessVerified, setAccessVerified] = useState(false);
  const [defaultBranch, setDefaultBranch] = useState('');

  // Fetch repositories when provider changes
  useEffect(() => {
    const fetchRepositories = async () => {
      setLoading(true);
      setError(null);
      setSelectedRepo(null);
      setAccessVerified(false);
      
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Authentication required');
        }
        
        const response = await fetch(`/api/repositories/${provider}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || `Failed to fetch ${provider} repositories`);
        }
        
        const data = await response.json();
        setRepositories(data);
      } catch (err: any) {
        setError(err.message);
        setRepositories([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchRepositories();
  }, [provider]);

  // Filter repositories based on search query
  const filteredRepositories = repositories.filter(repo => {
    const fullName = repo.full_name || repo.path_with_namespace || repo.name;
    return fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
           (repo.description && repo.description.toLowerCase().includes(searchQuery.toLowerCase()));
  });

  // Handle repository selection
  const handleSelectRepository = async (repo: Repository) => {
    setSelectedRepo(repo);
    setAccessVerified(false);
    setVerifyingAccess(true);
    
    try {
      const repositoryUrl = getRepositoryUrl(repo);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await fetch('/api/repositories/verify-access', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          provider,
          repositoryUrl
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to verify repository access');
      }
      
      const { hasAccess, defaultBranch: branch } = await response.json();
      
      if (!hasAccess) {
        throw new Error('You do not have sufficient permissions for this repository');
      }
      
      setDefaultBranch(branch || 'main');
      setAccessVerified(true);
    } catch (err: any) {
      setError(err.message);
      setAccessVerified(false);
    } finally {
      setVerifyingAccess(false);
    }
  };

  // Get repository URL based on provider
  const getRepositoryUrl = (repo: Repository): string => {
    if (provider === 'github') {
      return repo.html_url || `https://github.com/${repo.full_name}`;
    } else if (provider === 'gitlab') {
      return repo.web_url || `https://gitlab.com/${repo.path_with_namespace}`;
    } else if (provider === 'bitbucket') {
      return repo.links?.html?.[0]?.href || `https://bitbucket.org/${repo.full_name}`;
    }
    return '';
  };

  // Get repository ID based on provider
  const getRepositoryId = (repo: Repository): string => {
    return repo.id.toString();
  };

  // Get repository visibility badge
  const getVisibilityBadge = (repo: Repository) => {
    let isPrivate = false;
    
    if (provider === 'github') {
      isPrivate = repo.private;
    } else if (provider === 'gitlab') {
      isPrivate = repo.visibility !== 'public';
    } else if (provider === 'bitbucket') {
      isPrivate = !!repo.is_private;
    }
    
    return (
      <Badge variant={isPrivate ? "outline" : "secondary"}>
        {isPrivate ? 'Private' : 'Public'}
      </Badge>
    );
  };

  // Handle final selection
  const handleFinalSelection = () => {
    if (!selectedRepo) return;
    
    onSelect({
      name: selectedRepo.name,
      repositoryUrl: getRepositoryUrl(selectedRepo),
      repositoryProvider: provider,
      repositoryId: getRepositoryId(selectedRepo),
      defaultBranch: defaultBranch || 'main'
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Select Repository</CardTitle>
        <CardDescription>
          Choose a repository to connect to FlowForge
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Git Provider Selection */}
        <div className="space-y-2">
          <Label>Git Provider</Label>
          <RadioGroup 
            value={provider} 
            onValueChange={(value) => setProvider(value as 'github' | 'gitlab' | 'bitbucket')}
            className="flex flex-row space-x-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="github" id="github" />
              <Label htmlFor="github">GitHub</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="gitlab" id="gitlab" />
              <Label htmlFor="gitlab">GitLab</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="bitbucket" id="bitbucket" />
              <Label htmlFor="bitbucket">Bitbucket</Label>
            </div>
          </RadioGroup>
        </div>
        
        {/* Error Message */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {/* Search Input */}
        <div className="flex w-full items-center space-x-2">
          <Input
            placeholder="Search repositories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            disabled={loading}
          />
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              setProvider(provider); // Trigger refetch
            }}
            disabled={loading}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          </Button>
        </div>
        
        {/* Repository List */}
        <div className="rounded-md border">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : repositories.length === 0 ? (
            <div className="flex flex-col justify-center items-center h-64 text-muted-foreground">
              <AlertCircle className="h-8 w-8 mb-2" />
              <p>No repositories found</p>
              <p className="text-sm">
                {error ? 'Please try again or connect your account' : 'Connect your account or create a repository'}
              </p>
            </div>
          ) : (
            <ScrollArea className="h-64 w-full">
              <div className="p-4 space-y-2">
                {filteredRepositories.map((repo) => {
                  const isSelected = selectedRepo?.id === repo.id;
                  return (
                    <div
                      key={repo.id.toString()}
                      className={`p-3 rounded-md border cursor-pointer transition-colors ${
                        isSelected ? 'border-primary bg-muted' : 'hover:bg-muted'
                      }`}
                      onClick={() => handleSelectRepository(repo)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">{repo.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {repo.full_name || repo.path_with_namespace}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getVisibilityBadge(repo)}
                          {isSelected && (
                            <Check className="h-5 w-5 text-primary" />
                          )}
                        </div>
                      </div>
                      {repo.description && (
                        <p className="text-sm mt-1 text-muted-foreground line-clamp-2">
                          {repo.description}
                        </p>
                      )}
                    </div>
                  );
                })}
                {filteredRepositories.length === 0 && (
                  <div className="flex justify-center items-center h-32 text-muted-foreground">
                    <p>No matching repositories found</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </div>
        
        {/* Selected Repository */}
        {selectedRepo && (
          <div className="rounded-md border p-4">
            <div className="flex justify-between items-center">
              <h3 className="font-medium">Selected Repository</h3>
              {verifyingAccess ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Verifying access...</span>
                </div>
              ) : accessVerified ? (
                <div className="flex items-center space-x-2 text-green-600">
                  <Check className="h-4 w-4" />
                  <span className="text-sm">Access verified</span>
                </div>
              ) : null}
            </div>
            <div className="mt-2">
              <p className="font-medium">{selectedRepo.name}</p>
              <p className="text-sm text-muted-foreground">
                {getRepositoryUrl(selectedRepo)}
              </p>
              {accessVerified && (
                <div className="mt-2">
                  <Label htmlFor="defaultBranch">Default Branch</Label>
                  <Input
                    id="defaultBranch"
                    value={defaultBranch}
                    onChange={(e) => setDefaultBranch(e.target.value)}
                    className="mt-1"
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleFinalSelection} 
          disabled={!accessVerified || isSubmitting}
          className="w-full"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Setting up repository...
            </>
          ) : (
            'Connect Repository'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
