import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Loader2, AlertCircle, Save, 
  RefreshCw, Trash2, GitBranch
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '../../../hooks/use-toast';
import { useAuth } from '../../../context/AuthContext';

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

interface ProjectSettings {
  id: string;
  projectId: string;
  autoDeployEnabled: boolean;
  buildTimeoutMinutes: number;
  retainBuildsDay: number;
  webhookUrl: string;
  notificationSettings: {
    emailEnabled: boolean;
    slackWebhookUrl?: string;
    discordWebhookUrl?: string;
    notifyOnSuccess: boolean;
    notifyOnFailure: boolean;
  };
}

export default function ProjectSettings() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [settings, setSettings] = useState<ProjectSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [defaultBranch, setDefaultBranch] = useState('');
  const [autoDeployEnabled, setAutoDeployEnabled] = useState(true);
  const [buildTimeoutMinutes, setBuildTimeoutMinutes] = useState(30);
  const [retainBuildsDay, setRetainBuildsDay] = useState(30);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [slackWebhookUrl, setSlackWebhookUrl] = useState('');
  const [discordWebhookUrl, setDiscordWebhookUrl] = useState('');
  const [notifyOnSuccess, setNotifyOnSuccess] = useState(false);
  const [notifyOnFailure, setNotifyOnFailure] = useState(true);
  
  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    if (projectId) {
      fetchProject();
      fetchProjectSettings();
    }
  }, [projectId, token]);

  useEffect(() => {
    if (project) {
      setName(project.name);
      setDescription(project.description || '');
      setDefaultBranch(project.defaultBranch);
    }
  }, [project]);

  useEffect(() => {
    if (settings) {
      setAutoDeployEnabled(settings.autoDeployEnabled);
      setBuildTimeoutMinutes(settings.buildTimeoutMinutes);
      setRetainBuildsDay(settings.retainBuildsDay);
      
      const notificationSettings = settings.notificationSettings;
      setEmailEnabled(notificationSettings.emailEnabled);
      setSlackWebhookUrl(notificationSettings.slackWebhookUrl || '');
      setDiscordWebhookUrl(notificationSettings.discordWebhookUrl || '');
      setNotifyOnSuccess(notificationSettings.notifyOnSuccess);
      setNotifyOnFailure(notificationSettings.notifyOnFailure);
    }
  }, [settings]);

  const fetchProject = async () => {
    try {
      if (!projectId) {
        throw new Error('Project ID is required');
      }

      const response = await fetch(`/api/projects/${projectId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch project');
      }

      const data = await response.json();
      setProject(data);
    } catch (err: any) {
      setError(err.message);
      toast({
        variant: "destructive",
        title: "Error fetching project",
        description: err.message
      });
    }
  };

  const fetchProjectSettings = async () => {
    try {
      if (!projectId) {
        throw new Error('Project ID is required');
      }

      const response = await fetch(`/api/projects/${projectId}/settings`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch project settings');
      }

      const data = await response.json();
      setSettings(data);
    } catch (err: any) {
      setError(err.message);
      toast({
        variant: "destructive",
        title: "Error fetching project settings",
        description: err.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProject = async () => {
    setSaving(true);
    try {
      if (!projectId) {
        throw new Error('Project ID is required');
      }

      // Update project details
      const projectResponse = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name,
          description,
          defaultBranch
        })
      });

      if (!projectResponse.ok) {
        const errorData = await projectResponse.json();
        throw new Error(errorData.message || 'Failed to update project');
      }

      // Update project settings
      const settingsResponse = await fetch(`/api/projects/${projectId}/settings`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          autoDeployEnabled,
          buildTimeoutMinutes,
          retainBuildsDay,
          notificationSettings: {
            emailEnabled,
            slackWebhookUrl,
            discordWebhookUrl,
            notifyOnSuccess,
            notifyOnFailure
          }
        })
      });

      if (!settingsResponse.ok) {
        const errorData = await settingsResponse.json();
        throw new Error(errorData.message || 'Failed to update project settings');
      }

      const updatedProject = await projectResponse.json();
      const updatedSettings = await settingsResponse.json();
      
      setProject(updatedProject);
      setSettings(updatedSettings);
      
      toast({
        title: "Settings saved",
        description: "Project settings have been updated successfully"
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error saving settings",
        description: err.message
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!project || deleteConfirmName !== project.name) {
      toast({
        variant: "destructive",
        title: "Confirmation failed",
        description: "Please type the project name exactly to confirm deletion"
      });
      return;
    }

    setDeleteLoading(true);
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete project');
      }

      setDeleteDialogOpen(false);
      
      toast({
        title: "Project deleted",
        description: "The project has been permanently deleted"
      });
      
      // Navigate back to projects list
      navigate('/dashboard/projects');
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!project || !settings) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Project or settings not found</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with back button and actions */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => navigate(`/dashboard/projects/${projectId}`)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">{project.name} Settings</h2>
            <p className="text-muted-foreground">
              Configure your project settings and notifications
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="destructive" 
            onClick={() => setDeleteDialogOpen(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Project
          </Button>
          <Button 
            onClick={handleSaveProject} 
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Project Details Card */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Project Details</CardTitle>
            <CardDescription>
              Basic information about your project
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Project Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="defaultBranch" className="flex items-center">
                <GitBranch className="h-4 w-4 mr-1" />
                Default Branch
              </Label>
              <Input
                id="defaultBranch"
                value={defaultBranch}
                onChange={(e) => setDefaultBranch(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Repository Info Card */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Repository Information</CardTitle>
            <CardDescription>
              Details about the connected repository
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Repository Provider</Label>
              <Input
                value={project.repositoryProvider.charAt(0).toUpperCase() + project.repositoryProvider.slice(1)}
                disabled
              />
            </div>
            <div className="space-y-2">
              <Label>Repository URL</Label>
              <div className="flex gap-2">
                <Input
                  value={project.repositoryUrl}
                  disabled
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => window.open(project.repositoryUrl, '_blank')}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Webhook URL</Label>
              <div className="flex gap-2">
                <Input
                  value={settings.webhookUrl}
                  disabled
                  className="flex-1 font-mono text-xs"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    navigator.clipboard.writeText(settings.webhookUrl);
                    toast({
                      title: "Copied to clipboard",
                      description: "Webhook URL copied to clipboard"
                    });
                  }}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Build Settings Card */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Build Settings</CardTitle>
            <CardDescription>
              Configure how builds are triggered and executed
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="autoDeploy">Automatic Deployment</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically deploy when changes are pushed to the default branch
                </p>
              </div>
              <Switch
                id="autoDeploy"
                checked={autoDeployEnabled}
                onCheckedChange={setAutoDeployEnabled}
              />
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label htmlFor="buildTimeout">Build Timeout (minutes)</Label>
                <span className="text-sm">{buildTimeoutMinutes} min</span>
              </div>
              <Slider
                id="buildTimeout"
                min={5}
                max={120}
                step={5}
                value={[buildTimeoutMinutes]}
                onValueChange={(value) => setBuildTimeoutMinutes(value[0])}
              />
              <p className="text-xs text-muted-foreground">
                Maximum time a build can run before being terminated
              </p>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label htmlFor="retainBuilds">Retain Builds (days)</Label>
                <span className="text-sm">{retainBuildsDay} days</span>
              </div>
              <Slider
                id="retainBuilds"
                min={7}
                max={90}
                step={1}
                value={[retainBuildsDay]}
                onValueChange={(value) => setRetainBuildsDay(value[0])}
              />
              <p className="text-xs text-muted-foreground">
                How long to keep build history and logs
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings Card */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Notification Settings</CardTitle>
            <CardDescription>
              Configure build notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="emailNotify">Email Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Send email notifications for build events
                </p>
              </div>
              <Switch
                id="emailNotify"
                checked={emailEnabled}
                onCheckedChange={setEmailEnabled}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="slackWebhook">Slack Webhook URL (optional)</Label>
              <Input
                id="slackWebhook"
                value={slackWebhookUrl}
                onChange={(e) => setSlackWebhookUrl(e.target.value)}
                placeholder="https://hooks.slack.com/services/..."
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="discordWebhook">Discord Webhook URL (optional)</Label>
              <Input
                id="discordWebhook"
                value={discordWebhookUrl}
                onChange={(e) => setDiscordWebhookUrl(e.target.value)}
                placeholder="https://discord.com/api/webhooks/..."
              />
            </div>
            
            <div className="space-y-4 pt-2">
              <Label>Notification Triggers</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="notifySuccess"
                    checked={notifyOnSuccess}
                    onCheckedChange={setNotifyOnSuccess}
                  />
                  <Label htmlFor="notifySuccess">Successful builds</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="notifyFailure"
                    checked={notifyOnFailure}
                    onCheckedChange={setNotifyOnFailure}
                  />
                  <Label htmlFor="notifyFailure">Failed builds</Label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

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
              Please type <span className="text-destructive">{project.name}</span> to confirm deletion:
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
                setDeleteConfirmName('');
              }}
              disabled={deleteLoading}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteProject}
              disabled={deleteConfirmName !== project.name || deleteLoading}
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
