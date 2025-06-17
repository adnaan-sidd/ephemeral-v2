import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Trash2, Settings, ExternalLink, RefreshCw, 
  AlertCircle, Loader2, GitBranch, Eye, EyeOff 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import RepositorySelector from './RepositorySelector';
import { Alert, AlertDescription } from '../../ui/alert';

interface Project {
  id: string;
  name: string;
  description: string;
  repositoryUrl: string;
  repositoryProvider: 'github' | 'gitlab' | 'bitbucket';
  repositoryId: string;
  defaultBranch: string;
  createdAt: string;
  updatedAt: string;
}

export default function ProjectsList() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [selectedRepository, setSelectedRepository] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, [token]);

  const fetchProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/projects', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch projects');
      }

      const data = await response.json();
      setProjects(data);
    } catch (err: any) {
      setError(err.message);
      toast({
        variant: "destructive",
        title: "Error fetching projects",
        description: err.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async () => {
    if (!newProjectName.trim() || !selectedRepository) {
      toast({
        variant: "destructive",
        title: "Missing information",
        description: "Please provide a project name and select a repository"
      });
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: newProjectName,
          description: newProjectDescription,
          repositoryUrl: selectedRepository.repositoryUrl,
          repositoryProvider: selectedRepository.repositoryProvider,
          repositoryId: selectedRepository.repositoryId,
          defaultBranch: selectedRepository.defaultBranch
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create project');
      }

      const newProject = await response.json();
      setProjects([...projects, newProject]);
      setCreateDialogOpen(false);
      setNewProjectName('');
      setNewProjectDescription('');
      setSelectedRepository(null);
      
      toast({
        title: "Project created",
        description: `${newProjectName} has been successfully created`
      });
      
      // Navigate to project detail page
      navigate(`/dashboard/projects/${newProject.id}`);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error creating project",
        description: err.message
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!deleteConfirmId || deleteConfirmName !== projects.find(p => p.id === deleteConfirmId)?.name) {
      toast({
        variant: "destructive",
        title: "Confirmation failed",
        description: "Please type the project name exactly to confirm deletion"
      });
      return;
    }

    setDeleteLoading(true);
    try {
      const response = await fetch(`/api/projects/${deleteConfirmId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete project');
      }

      setProjects(projects.filter(p => p.id !== deleteConfirmId));
      setDeleteDialogOpen(false);
      setDeleteConfirmId(null);
      setDeleteConfirmName('');
      
      toast({
        title: "Project deleted",
        description: "The project has been permanently deleted"
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error deleting project",
        description: err.message
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'github':
        return '🐙';
      case 'gitlab':
        return '🦊';
      case 'bitbucket':
        return '🪣';
      default:
        return '📁';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Projects</h2>
          <p className="text-muted-foreground">
            Manage your CI/CD projects and repositories
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="icon"
            onClick={fetchProjects}
            disabled={loading}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          </Button>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Project
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>
                <DialogDescription>
                  Set up a new CI/CD project by connecting to a Git repository
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Project Name</Label>
                  <Input
                    id="name"
                    placeholder="My Awesome Project"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description (optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="A brief description of your project"
                    value={newProjectDescription}
                    onChange={(e) => setNewProjectDescription(e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="grid gap-2 pt-4">
                  <RepositorySelector 
                    onSelect={setSelectedRepository}
                    isSubmitting={submitting}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setCreateDialogOpen(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateProject}
                  disabled={!newProjectName.trim() || !selectedRepository || submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Project'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col justify-center items-center h-64 border rounded-lg bg-muted/50 p-6">
          <h3 className="font-semibold text-xl mb-2">No projects yet</h3>
          <p className="text-muted-foreground text-center mb-6">
            Create your first project to start building and deploying your applications
          </p>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Your First Project
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <Card key={project.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{project.name}</CardTitle>
                    <CardDescription className="flex items-center mt-1">
                      <span className="mr-1">{getProviderIcon(project.repositoryProvider)}</span> 
                      {project.repositoryProvider.charAt(0).toUpperCase() + project.repositoryProvider.slice(1)}
                    </CardDescription>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setDeleteConfirmId(project.id);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => navigate(`/dashboard/projects/${project.id}/settings`)}
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="flex items-center text-xs text-muted-foreground mb-2">
                  <GitBranch className="h-3 w-3 mr-1" />
                  {project.defaultBranch}
                </div>
                {project.description ? (
                  <p className="text-sm line-clamp-2">{project.description}</p>
                ) : (
                  <p className="text-sm text-muted-foreground italic">No description provided</p>
                )}
              </CardContent>
              <CardFooter className="flex justify-between pt-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.open(project.repositoryUrl, '_blank')}
                  className="text-xs"
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Repository
                </Button>
                <Button 
                  size="sm"
                  onClick={() => navigate(`/dashboard/projects/${project.id}`)}
                  className="text-xs"
                >
                  View Details
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive">Delete Project</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the project, its builds, logs, and all associated data.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="mb-4 font-semibold">
              Please type <span className="text-destructive">
                {deleteConfirmId && projects.find(p => p.id === deleteConfirmId)?.name}
              </span> to confirm deletion:
            </p>
            <Input
              value={deleteConfirmName}
              onChange={(e) => setDeleteConfirmName(e.target.value)}
              placeholder="Type project name here"
            />
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setDeleteDialogOpen(false);
                setDeleteConfirmId(null);
                setDeleteConfirmName('');
              }}
              disabled={deleteLoading}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteProject}
              disabled={
                !deleteConfirmId || 
                deleteConfirmName !== projects.find(p => p.id === deleteConfirmId)?.name ||
                deleteLoading
              }
            >
              {deleteLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Project'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
