import { useState, useEffect } from 'react';
import { 
  Plus, Trash2, Eye, EyeOff, Loader2, 
  AlertCircle, Save, RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';

interface EnvironmentVariable {
  id: string;
  key: string;
  value: string;
  isSecret: boolean;
  projectId: string;
  createdAt: string;
  updatedAt: string;
}

interface EnvironmentVariablesProps {
  projectId: string;
}

export default function EnvironmentVariables({ projectId }: EnvironmentVariablesProps) {
  const { token } = useAuth();
  const [variables, setVariables] = useState<EnvironmentVariable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newVarKey, setNewVarKey] = useState('');
  const [newVarValue, setNewVarValue] = useState('');
  const [newVarIsSecret, setNewVarIsSecret] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteVarId, setDeleteVarId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetchEnvironmentVariables();
  }, [projectId, token]);

  const fetchEnvironmentVariables = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/projects/${projectId}/env-vars`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch environment variables');
      }

      const data = await response.json();
      setVariables(data);
    } catch (err: any) {
      setError(err.message);
      toast({
        variant: "destructive",
        title: "Error fetching environment variables",
        description: err.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateVariable = async () => {
    if (!newVarKey.trim() || !newVarValue.trim()) {
      toast({
        variant: "destructive",
        title: "Missing information",
        description: "Please provide both key and value for the environment variable"
      });
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/env-vars`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          key: newVarKey,
          value: newVarValue,
          isSecret: newVarIsSecret
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create environment variable');
      }

      const newVariable = await response.json();
      setVariables([...variables, newVariable]);
      setCreateDialogOpen(false);
      setNewVarKey('');
      setNewVarValue('');
      setNewVarIsSecret(true);
      
      toast({
        title: "Environment variable created",
        description: `${newVarKey} has been successfully added`
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error creating environment variable",
        description: err.message
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteVariable = async () => {
    if (!deleteVarId) {
      return;
    }

    setDeleteLoading(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/env-vars/${deleteVarId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete environment variable');
      }

      setVariables(variables.filter(v => v.id !== deleteVarId));
      setDeleteDialogOpen(false);
      setDeleteVarId(null);
      
      toast({
        title: "Environment variable deleted",
        description: "The environment variable has been removed"
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error deleting environment variable",
        description: err.message
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  const toggleSecretVisibility = (id: string) => {
    setShowSecrets((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Environment Variables</CardTitle>
          <CardDescription>
            Manage environment variables for your project builds
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="icon"
            onClick={fetchEnvironmentVariables}
            disabled={loading}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          </Button>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Variable
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add Environment Variable</DialogTitle>
                <DialogDescription>
                  Add a new environment variable for your project builds
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="key">Key</Label>
                  <Input
                    id="key"
                    placeholder="API_KEY"
                    value={newVarKey}
                    onChange={(e) => setNewVarKey(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="value">Value</Label>
                  <Input
                    id="value"
                    placeholder="your-secret-value"
                    value={newVarValue}
                    onChange={(e) => setNewVarValue(e.target.value)}
                    type={newVarIsSecret ? "password" : "text"}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="isSecret"
                    checked={newVarIsSecret}
                    onCheckedChange={setNewVarIsSecret}
                  />
                  <Label htmlFor="isSecret">Treat as secret (will be masked in logs)</Label>
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
                  onClick={handleCreateVariable}
                  disabled={!newVarKey.trim() || !newVarValue.trim() || submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Variable
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="flex justify-center items-center h-32">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : variables.length === 0 ? (
          <div className="flex flex-col justify-center items-center h-32 border rounded-lg bg-muted/50 p-6">
            <p className="text-muted-foreground text-center mb-4">
              No environment variables defined yet
            </p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Variable
            </Button>
          </div>
        ) : (
          <div className="rounded-md border">
            <div className="grid grid-cols-12 bg-muted p-3 text-sm font-medium">
              <div className="col-span-3">Key</div>
              <div className="col-span-7">Value</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>
            {variables.map((variable) => (
              <div key={variable.id} className="grid grid-cols-12 p-3 text-sm border-t">
                <div className="col-span-3 flex items-center font-mono">
                  {variable.key}
                </div>
                <div className="col-span-7 font-mono flex items-center">
                  {variable.isSecret ? (
                    showSecrets[variable.id] ? (
                      variable.value
                    ) : (
                      '••••••••'
                    )
                  ) : (
                    variable.value
                  )}
                </div>
                <div className="col-span-2 flex justify-end gap-1">
                  {variable.isSecret && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleSecretVisibility(variable.id)}
                    >
                      {showSecrets[variable.id] ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setDeleteVarId(variable.id);
                      setDeleteDialogOpen(true);
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive">Delete Environment Variable</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this environment variable? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setDeleteDialogOpen(false);
                setDeleteVarId(null);
              }}
              disabled={deleteLoading}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteVariable}
              disabled={!deleteVarId || deleteLoading}
            >
              {deleteLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Variable'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
