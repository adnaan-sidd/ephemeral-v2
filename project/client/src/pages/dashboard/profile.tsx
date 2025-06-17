import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import GitIntegrations from "@/components/dashboard/common/GitIntegrations";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Mail, Building, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function ProfilePage() {
  const { user, refreshUser, loginWithGithub } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState(user?.name || '');
  const [company, setCompany] = useState(user?.company || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  
  // Get user integrations
  const [integrations, setIntegrations] = useState({
    github: { connected: !!user?.githubUsername, username: user?.githubUsername || '' },
    gitlab: { connected: false, username: '' },
    bitbucket: { connected: false, username: '' }
  });
  
  useEffect(() => {
    // Load integrations data
    const fetchIntegrations = async () => {
      try {
        const response = await fetch('/api/user/integrations', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setIntegrations({
            github: { 
              connected: !!data.github, 
              username: data.github?.providerUsername || user?.githubUsername || '' 
            },
            gitlab: { 
              connected: !!data.gitlab, 
              username: data.gitlab?.providerUsername || '' 
            },
            bitbucket: { 
              connected: !!data.bitbucket, 
              username: data.bitbucket?.providerUsername || '' 
            }
          });
        }
      } catch (error) {
        console.error("Failed to fetch integrations:", error);
      }
    };
    
    fetchIntegrations();
  }, [user]);
  
  useEffect(() => {
    // Check if profile form has changes
    setHasChanges(
      name !== (user?.name || '') || 
      company !== (user?.company || '')
    );
  }, [name, company, user]);
  
  const handleProfileUpdate = async () => {
    setIsUpdating(true);
    
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          name,
          company
        })
      });
      
      if (response.ok) {
        await refreshUser();
        toast({
          title: "Profile Updated",
          description: "Your profile has been updated successfully."
        });
        setHasChanges(false);
      } else {
        const data = await response.json();
        throw new Error(data.message || "Failed to update profile");
      }
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update profile. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };
  
  const handleConnectGithub = async () => {
    await loginWithGithub();
  };
  
  const handleConnectGitlab = async () => {
    // Implement GitLab OAuth flow
    toast({
      title: "Coming Soon",
      description: "GitLab integration will be available soon."
    });
  };
  
  const handleConnectBitbucket = async () => {
    // Implement Bitbucket OAuth flow
    toast({
      title: "Coming Soon",
      description: "Bitbucket integration will be available soon."
    });
  };
  
  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };
  
  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">Account Settings</h1>
      
      <div className="grid gap-6">
        <div className="flex items-start gap-6">
          <Avatar className="h-20 w-20">
            <AvatarImage src={user?.avatarUrl} alt={user?.name || user?.email} />
            <AvatarFallback className="text-xl">{getInitials(user?.name || '')}</AvatarFallback>
          </Avatar>
          
          <div>
            <h2 className="text-2xl font-semibold">{user?.name || 'User'}</h2>
            <p className="text-muted-foreground">{user?.email}</p>
            <p className="text-sm mt-1">
              Plan: <span className="font-medium">{user?.plan || 'Free'}</span>
            </p>
          </div>
        </div>
        
        <Tabs defaultValue="profile" className="mt-6">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="integrations">Git Integrations</TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Update your account information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="flex items-center rounded-md border px-3 py-2 text-sm text-muted-foreground">
                    <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
                    {user?.email}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Your email address cannot be changed
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="name" 
                      value={name} 
                      onChange={e => setName(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="company">Company</Label>
                  <div className="relative">
                    <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="company" 
                      value={company} 
                      onChange={e => setCompany(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <Button 
                  onClick={handleProfileUpdate} 
                  disabled={isUpdating || !hasChanges}
                  className="mt-4"
                >
                  {isUpdating ? 'Updating...' : 'Update Profile'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="integrations">
            <GitIntegrations 
              githubConnected={integrations.github.connected}
              githubUsername={integrations.github.username}
              gitlabConnected={integrations.gitlab.connected}
              gitlabUsername={integrations.gitlab.username}
              bitbucketConnected={integrations.bitbucket.connected}
              bitbucketUsername={integrations.bitbucket.username}
              onGithubConnect={handleConnectGithub}
              onGitlabConnect={handleConnectGitlab}
              onBitbucketConnect={handleConnectBitbucket}
            />
            
            {!integrations.github.connected && (
              <Alert className="mt-6">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Git Provider Required</AlertTitle>
                <AlertDescription>
                  You need to connect at least one Git provider to create CI/CD pipelines.
                  We recommend connecting GitHub for the best experience.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
