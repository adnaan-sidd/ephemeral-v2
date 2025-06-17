import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Plus, X, GitHub, GitlabLogo, FileCode } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface CreateProjectProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProjectCreated: () => void;
}

export default function CreateProjectDialog({ 
  open, 
  onOpenChange,
  onProjectCreated
}: CreateProjectProps) {
  const { token } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('github');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form states
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [repoUrl, setRepoUrl] = useState('');
  const [repoName, setRepoName] = useState('');
  const [repoOwner, setRepoOwner] = useState('');
  const [branch, setBranch] = useState('main');
  const [buildCommand, setBuildCommand] = useState('npm run build');
  const [testCommand, setTestCommand] = useState('npm test');
  const [buildType, setBuildType] = useState('node');
  
  // GitHub repository options
  const [githubRepos, setGithubRepos] = useState<any[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [githubConnected, setGithubConnected] = useState<boolean | null>(null);
  
  const resetForm = () => {
    setProjectName('');
    setProjectDescription('');
    setRepoUrl('');
    setRepoName('');
    setRepoOwner('');
    setBranch('main');
    setBuildCommand('npm run build');
    setTestCommand('npm test');
    setBuildType('node');
    setError(null);
    setGithubConnected(null);
    setGithubRepos([]);
  };
  
  const fetchGithubRepos = async () => {
    if (!token) return;
    
    setLoadingRepos(true);
    try {
      const response = await fetch('/api/github/repos', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.status === 404) {
        // User hasn't connected GitHub account
        setGithubConnected(false);
        setError('GitHub account not connected. Please connect your GitHub account or use a custom repository URL.');
        setActiveTab('custom'); // Switch to custom tab
        setGithubRepos([]);
        return;
      }
      
      if (!response.ok) {
        throw new Error('Failed to fetch repositories');
      }
      
      const data = await response.json();
      setGithubRepos(data);
      setGithubConnected(true);
    } catch (err: any) {
      setError(err.message);
      toast({
        variant: "destructive",
        title: "Error fetching repositories",
        description: err.message
      });
    } finally {
      setLoadingRepos(false);
    }
  };
  
  const handleGithubRepoSelect = (repoFullName: string) => {
    if (!repoFullName) return;
    
    const [owner, name] = repoFullName.split('/');
    setRepoOwner(owner);
    setRepoName(name);
    setProjectName(name);
    setRepoUrl(`https://github.com/${owner}/${name}`);
  };
  
  const validateForm = () => {
    if (!projectName.trim()) {
      setError('Project name is required');
      return false;
    }
    
    if (activeTab === 'github') {
      if (githubConnected === false) {
        setError('Please connect your GitHub account or use the Custom Repository tab');
        return false;
      }
      if (githubConnected === true && (!repoName || !repoOwner)) {
        setError('Please select a GitHub repository');
        return false;
      }
    }
    
    if (activeTab === 'custom' && !repoUrl.trim()) {
      setError('Repository URL is required');
      return false;
    }
    
    if (!branch.trim()) {
      setError('Branch name is required');
      return false;
    }
    
    return true;
  };
  
  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setSubmitting(true);
    setError(null);
    
    try {
      let finalRepoOwner = repoOwner;
      let finalRepoName = repoName;
      let finalRepoId = '';
      
      // Parse repository info for custom URLs
      if (activeTab === 'custom' && repoUrl) {
        const parsed = parseRepositoryUrl(repoUrl);
        finalRepoOwner = parsed.owner;
        finalRepoName = parsed.name;
        finalRepoId = parsed.id;
      } else if (activeTab === 'github') {
        finalRepoId = `${repoOwner}/${repoName}`;
      }
      
      const projectData = {
        name: projectName,
        description: projectDescription,
        repositoryUrl: repoUrl,
        repositoryProvider: activeTab === 'github' ? 'github' : 'custom',
        repositoryId: finalRepoId,
        defaultBranch: branch,
        buildCommand,
        testCommand,
        buildType
      };
      
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(projectData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create project');
      }
      
      const newProject = await response.json();
      
      // Success notification
      toast({
        title: "Project created successfully",
        description: `Project "${projectName}" has been created.`
      });
      
      // Reset form and close dialog
      resetForm();
      onOpenChange(false);
      
      // Notify parent component
      onProjectCreated();
      
      // Navigate to the new project
      navigate(`/dashboard/projects/${newProject.id}`);
      
    } catch (err: any) {
      setError(err.message);
      toast({
        variant: "destructive",
        title: "Error creating project",
        description: err.message
      });
    } finally {
      setSubmitting(false);
    }
  };
  
  const parseRepositoryUrl = (url: string) => {
    try {
      // Parse GitHub URLs like https://github.com/owner/repo
      const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
      if (match) {
        return {
          provider: 'github',
          owner: match[1],
          name: match[2].replace('.git', ''),
          id: `${match[1]}/${match[2].replace('.git', '')}`
        };
      }
      
      // For other URLs, extract what we can
      const urlParts = url.split('/');
      const repoName = urlParts[urlParts.length - 1].replace('.git', '');
      const owner = urlParts[urlParts.length - 2] || 'unknown';
      
      return {
        provider: 'custom',
        owner,
        name: repoName,
        id: `${owner}/${repoName}`
      };
    } catch {
      return {
        provider: 'custom',
        owner: 'unknown',
        name: 'unknown',
        id: 'unknown/unknown'
      };
    }
  };
  
  // Check GitHub connection status when dialog opens
  useEffect(() => {
    if (open && activeTab === 'github' && githubConnected === null) {
      fetchGithubRepos();
    }
  }, [open, activeTab]);
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Create New Project</DialogTitle>
          <DialogDescription>
            Set up a new CI/CD pipeline for your code repository.
          </DialogDescription>
        </DialogHeader>
        
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <div className="grid gap-6 py-4">
          <div className="grid gap-2">
            <Label htmlFor="project-name">Project Name</Label>
            <Input
              id="project-name"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="My Awesome Project"
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="project-description">Description (Optional)</Label>
            <Textarea
              id="project-description"
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              placeholder="A brief description of your project"
              rows={2}
            />
          </div>
          
          <Tabs defaultValue="github" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="github">
                <GitHub className="h-4 w-4 mr-2" />
                GitHub Repository
              </TabsTrigger>
              <TabsTrigger value="custom">
                <FileCode className="h-4 w-4 mr-2" />
                Custom Repository
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="github" className="pt-4">
              {githubConnected === false ? (
                <div className="grid gap-4">
                  <Alert>
                    <GitHub className="h-4 w-4" />
                    <AlertDescription>
                      Connect your GitHub account to browse and select repositories directly.
                    </AlertDescription>
                  </Alert>
                  <div className="flex flex-col gap-2">
                    <Button 
                      onClick={() => window.location.href = '/api/auth/github'}
                      className="w-full"
                    >
                      <GitHub className="h-4 w-4 mr-2" />
                      Connect GitHub Account
                    </Button>
                    <p className="text-xs text-muted-foreground text-center">
                      Or use the "Custom Repository" tab to enter a repository URL manually.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label>Select GitHub Repository</Label>
                    <div className="flex gap-2">
                      <Select
                        value={repoOwner && repoName ? `${repoOwner}/${repoName}` : ""}
                        onValueChange={handleGithubRepoSelect}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a repository" />
                        </SelectTrigger>
                        <SelectContent>
                          {githubRepos.map((repo) => (
                            <SelectItem key={repo.id} value={repo.full_name}>
                              {repo.full_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={fetchGithubRepos}
                        disabled={loadingRepos}
                      >
                        {loadingRepos ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Don't see your repository? Click the + button to fetch your repositories.
                    </p>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="branch">Default Branch</Label>
                    <Input
                      id="branch"
                      value={branch}
                      onChange={(e) => setBranch(e.target.value)}
                      placeholder="main"
                    />
                  </div>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="custom" className="pt-4">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="repo-url">Repository URL</Label>
                  <Input
                    id="repo-url"
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                    placeholder="https://github.com/username/repo"
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="branch-custom">Default Branch</Label>
                  <Input
                    id="branch-custom"
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    placeholder="main"
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
          
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="build-type">Build Environment</Label>
              <Select
                value={buildType}
                onValueChange={(value) => {
                  setBuildType(value);
                  
                  // Set default commands based on environment
                  if (value === 'node') {
                    setBuildCommand('npm run build');
                    setTestCommand('npm test');
                  } else if (value === 'python') {
                    setBuildCommand('pip install -r requirements.txt');
                    setTestCommand('pytest');
                  } else if (value === 'docker') {
                    setBuildCommand('docker build -t my-app .');
                    setTestCommand('docker run my-app-tests');
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select build environment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="node">Node.js</SelectItem>
                  <SelectItem value="python">Python</SelectItem>
                  <SelectItem value="docker">Docker</SelectItem>
                  <SelectItem value="java">Java</SelectItem>
                  <SelectItem value="go">Go</SelectItem>
                  <SelectItem value="ruby">Ruby</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="build-command">Build Command</Label>
              <Input
                id="build-command"
                value={buildCommand}
                onChange={(e) => setBuildCommand(e.target.value)}
                placeholder="npm run build"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="test-command">Test Command</Label>
              <Input
                id="test-command"
                value={testCommand}
                onChange={(e) => setTestCommand(e.target.value)}
                placeholder="npm test"
              />
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Create Project
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
