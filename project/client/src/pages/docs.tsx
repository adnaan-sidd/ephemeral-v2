import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Rocket, Key, ServerCog, Code, AlertTriangle } from "lucide-react";
import Navigation from "@/components/navigation";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";

export default function Documentation() {
  const [, setLocation] = useLocation();
  const [activeSection, setActiveSection] = useState("quickstart");

  useEffect(() => {
    const handleScroll = () => {
      const sections = ["quickstart", "authentication", "pipelines", "examples"];
      
      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top <= 100 && rect.bottom >= 100) {
            setActiveSection(section);
            break;
          }
        }
      }
    };
    
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      setActiveSection(sectionId);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900 dark:text-white">
      <Navigation />
      
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-slate-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">API Documentation</h1>
            <p className="text-slate-600 dark:text-slate-300">Complete guide to integrating FlowForge into your workflow</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <nav className="space-y-1 sticky top-24">
              <motion.a 
                href="#quickstart" 
                onClick={(e) => {
                  e.preventDefault();
                  scrollToSection("quickstart");
                }}
                className={`${activeSection === "quickstart" ? "bg-primary/5 text-primary" : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-gray-800 hover:text-slate-900 dark:hover:text-white"} group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors`}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <Rocket className={`${activeSection === "quickstart" ? "text-primary" : "text-slate-400 dark:text-slate-500"} mr-3 h-4 w-4`} />
                Quick Start
              </motion.a>
              <motion.a 
                href="#authentication" 
                onClick={(e) => {
                  e.preventDefault();
                  scrollToSection("authentication");
                }}
                className={`${activeSection === "authentication" ? "bg-primary/5 text-primary" : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-gray-800 hover:text-slate-900 dark:hover:text-white"} group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors`}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <Key className={`${activeSection === "authentication" ? "text-primary" : "text-slate-400 dark:text-slate-500"} mr-3 h-4 w-4`} />
                Authentication
              </motion.a>
              <motion.a 
                href="#pipelines" 
                onClick={(e) => {
                  e.preventDefault();
                  scrollToSection("pipelines");
                }}
                className={`${activeSection === "pipelines" ? "bg-primary/5 text-primary" : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-gray-800 hover:text-slate-900 dark:hover:text-white"} group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors`}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <ServerCog className={`${activeSection === "pipelines" ? "text-primary" : "text-slate-400 dark:text-slate-500"} mr-3 h-4 w-4`} />
                Pipelines API
              </motion.a>
              <motion.a 
                href="#examples" 
                onClick={(e) => {
                  e.preventDefault();
                  scrollToSection("examples");
                }}
                className={`${activeSection === "examples" ? "bg-primary/5 text-primary" : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-gray-800 hover:text-slate-900 dark:hover:text-white"} group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors`}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <Code className={`${activeSection === "examples" ? "text-primary" : "text-slate-400 dark:text-slate-500"} mr-3 h-4 w-4`} />
                Examples
              </motion.a>
            </nav>
          </div>

          {/* Documentation Content */}
          <div className="lg:col-span-3">
            <div className="prose prose-slate dark:prose-invert max-w-none">
              {/* Quick Start */}
              <section id="quickstart" className="mb-12">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Quick Start</h2>
                <p className="text-slate-600 dark:text-slate-300 mb-6">Get up and running with FlowForge in under 5 minutes.</p>
                
                <Card className="mb-6 dark:bg-gray-800 dark:border-gray-700">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Step 1: Get Your API Key</h3>
                    <p className="text-slate-600 dark:text-slate-300 mb-4">First, create an account and generate an API key from your dashboard.</p>
                    <motion.div
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      <Button 
                        onClick={() => setLocation('/dashboard')}
                        className="bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                      >
                        Go to Dashboard
                      </Button>
                    </motion.div>
                  </CardContent>
                </Card>

                <Card className="mb-6 dark:bg-gray-800 dark:border-gray-700">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Step 2: Create Your First Pipeline</h3>
                    <div className="bg-slate-900 rounded-lg p-4 overflow-x-auto">
                      <pre className="text-green-400 text-sm">
                        <code>{`curl -X POST https://api.flowforge.dev/v1/pipelines \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "repo_url": "https://github.com/your-username/your-repo",
    "branch": "main",
    "commands": [
      "npm install",
      "npm test",
      "npm run build"
    ]
  }'`}</code>
                      </pre>
                    </div>
                    <motion.div className="mt-4" whileHover={{ scale: 1.01 }}>
                      <Button 
                        variant="outline" 
                        className="text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-gray-700"
                        onClick={() => {
                          navigator.clipboard.writeText(`curl -X POST https://api.flowforge.dev/v1/pipelines \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "repo_url": "https://github.com/your-username/your-repo",
    "branch": "main",
    "commands": [
      "npm install",
      "npm test",
      "npm run build"
    ]
  }'`);
                          alert("Command copied to clipboard!");
                        }}
                      >
                        Copy Command
                      </Button>
                    </motion.div>
                  </CardContent>
                </Card>

                <Card className="mb-6 dark:bg-gray-800 dark:border-gray-700">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Step 3: Check Pipeline Status</h3>
                    <div className="bg-slate-900 rounded-lg p-4 overflow-x-auto">
                      <pre className="text-green-400 text-sm">
                        <code>{`curl -H "Authorization: Bearer YOUR_API_KEY" \\
  https://api.flowforge.dev/v1/pipelines/{pipeline_id}`}</code>
                      </pre>
                    </div>
                    <motion.div className="mt-4" whileHover={{ scale: 1.01 }}>
                      <Button 
                        variant="outline" 
                        className="text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-gray-700"
                        onClick={() => {
                          navigator.clipboard.writeText(`curl -H "Authorization: Bearer YOUR_API_KEY" \\
  https://api.flowforge.dev/v1/pipelines/{pipeline_id}`);
                          alert("Command copied to clipboard!");
                        }}
                      >
                        Copy Command
                      </Button>
                    </motion.div>
                  </CardContent>
                </Card>
              </section>

              {/* Authentication */}
              <section id="authentication" className="mb-12">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Authentication</h2>
                <p className="text-slate-600 dark:text-slate-300 mb-6">FlowForge uses API keys for authentication. Include your API key in the Authorization header.</p>
                
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-4 mb-6">
                  <div className="flex">
                    <AlertTriangle className="text-amber-500 dark:text-amber-400 mt-1 mr-3 h-5 w-5" />
                    <div>
                      <h4 className="text-amber-800 dark:text-amber-300 font-semibold">Keep your API keys secure</h4>
                      <p className="text-amber-700 dark:text-amber-400 text-sm">Never expose your API keys in client-side code or public repositories.</p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900 rounded-lg p-4 overflow-x-auto mb-6">
                  <pre className="text-green-400 text-sm">
                    <code>Authorization: Bearer YOUR_API_KEY</code>
                  </pre>
                </div>
                <motion.div whileHover={{ scale: 1.01 }}>
                  <Button 
                    variant="outline" 
                    className="text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-gray-700"
                    onClick={() => {
                      navigator.clipboard.writeText(`Authorization: Bearer YOUR_API_KEY`);
                      alert("Header copied to clipboard!");
                    }}
                  >
                    Copy Header
                  </Button>
                </motion.div>
              </section>

              {/* Pipelines API */}
              <section id="pipelines" className="mb-12">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Pipelines API</h2>
                <p className="text-slate-600 dark:text-slate-300 mb-6">The core API for creating and managing CI/CD pipelines.</p>

                <div className="space-y-8">
                  {/* POST /v1/pipelines */}
                  <Card className="dark:bg-gray-800 dark:border-gray-700">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-2 mb-3">
                        <Badge variant="default">POST</Badge>
                        <code className="text-sm font-mono">https://api.flowforge.dev/v1/pipelines</code>
                      </div>
                      <p className="text-slate-600 dark:text-slate-300 mb-4">Create and execute a new pipeline.</p>
                      
                      <div className="mb-4">
                        <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Request Body</h4>
                        <div className="bg-slate-900 rounded p-3 overflow-x-auto">
                          <pre className="text-green-400 text-sm">
                            <code>{`{
  "repo_url": "string (required)",
  "branch": "string (default: main)",
  "commands": ["string array (required)"],
  "environment": {
    "NODE_VERSION": "18",
    "CUSTOM_VAR": "value"
  }
}`}</code>
                          </pre>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Response</h4>
                        <div className="bg-slate-900 rounded p-3 overflow-x-auto">
                          <pre className="text-green-400 text-sm">
                            <code>{`{
  "id": "pipeline_123abc",
  "status": "pending",
  "repo_url": "https://github.com/user/repo",
  "branch": "main",
  "created_at": "2024-01-15T10:30:00Z"
}`}</code>
                          </pre>
                        </div>
                      </div>
                      
                      <motion.div className="mt-4" whileHover={{ scale: 1.01 }}>
                        <Button 
                          variant="outline" 
                          className="text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-gray-700"
                          onClick={() => {
                            navigator.clipboard.writeText(`{
  "repo_url": "https://github.com/your-username/your-repo",
  "branch": "main",
  "commands": [
    "npm install",
    "npm test",
    "npm run build"
  ],
  "environment": {
    "NODE_VERSION": "18"
  }
}`);
                            alert("Request body template copied to clipboard!");
                          }}
                        >
                          Copy Request Template
                        </Button>
                      </motion.div>
                    </CardContent>
                  </Card>

                  {/* GET /v1/pipelines/{id} */}
                  <Card className="dark:bg-gray-800 dark:border-gray-700">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-2 mb-3">
                        <Badge variant="secondary">GET</Badge>
                        <code className="text-sm font-mono">https://api.flowforge.dev/v1/pipelines/{`{id}`}</code>
                      </div>
                      <p className="text-slate-600 dark:text-slate-300 mb-4">Get the status and details of a specific pipeline.</p>
                      
                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Response</h4>
                        <div className="bg-slate-900 rounded p-3 overflow-x-auto">
                          <pre className="text-green-400 text-sm">
                            <code>{`{
  "id": "pipeline_123abc",
  "status": "completed", // pending, running, completed, failed
  "repo_url": "https://github.com/user/repo",
  "branch": "main",
  "started_at": "2024-01-15T10:30:00Z",
  "completed_at": "2024-01-15T10:33:24Z",
  "duration": 204 // seconds
}`}</code>
                          </pre>
                        </div>
                      </div>
                      
                      <motion.div className="mt-4" whileHover={{ scale: 1.01 }}>
                        <Button 
                          variant="outline" 
                          className="text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-gray-700"
                          onClick={() => {
                            navigator.clipboard.writeText(`curl -H "Authorization: Bearer YOUR_API_KEY" https://api.flowforge.dev/v1/pipelines/pipeline_123abc`);
                            alert("Example command copied to clipboard!");
                          }}
                        >
                          Copy Example Command
                        </Button>
                      </motion.div>
                    </CardContent>
                  </Card>

                  {/* GET /v1/pipelines/{id}/logs */}
                  <Card className="dark:bg-gray-800 dark:border-gray-700">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-2 mb-3">
                        <Badge variant="secondary">GET</Badge>
                        <code className="text-sm font-mono">https://api.flowforge.dev/v1/pipelines/{`{id}`}/logs</code>
                      </div>
                      <p className="text-slate-600 dark:text-slate-300 mb-4">Get the logs for a specific pipeline.</p>
                      
                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Response</h4>
                        <div className="bg-slate-900 rounded p-3 overflow-x-auto">
                          <pre className="text-green-400 text-sm">
                            <code>{`{
  "id": "pipeline_123abc",
  "logs": "🔧 Setting up ephemeral environment...\\n📦 Cloning repository..."
}`}</code>
                          </pre>
                        </div>
                      </div>
                      
                      <motion.div className="mt-4" whileHover={{ scale: 1.01 }}>
                        <Button 
                          variant="outline" 
                          className="text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-gray-700"
                          onClick={() => {
                            navigator.clipboard.writeText(`curl -H "Authorization: Bearer YOUR_API_KEY" https://api.flowforge.dev/v1/pipelines/pipeline_123abc/logs`);
                            alert("Example command copied to clipboard!");
                          }}
                        >
                          Copy Example Command
                        </Button>
                      </motion.div>
                    </CardContent>
                  </Card>
                </div>
              </section>

              {/* Examples */}
              <section id="examples" className="mb-12">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Examples</h2>
                <p className="text-slate-600 dark:text-slate-300 mb-6">Common use cases and example implementations.</p>

                <Card className="mb-6 dark:bg-gray-800 dark:border-gray-700">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Node.js Project</h3>
                    <div className="bg-slate-900 rounded-lg p-4 overflow-x-auto">
                      <pre className="text-green-400 text-sm">
                        <code>{`curl -X POST https://api.flowforge.dev/v1/pipelines \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "repo_url": "https://github.com/user/my-node-app",
    "branch": "main",
    "commands": [
      "npm ci",
      "npm run test",
      "npm run build",
      "npm run lint"
    ]
  }'`}</code>
                      </pre>
                    </div>
                    <motion.div className="mt-4" whileHover={{ scale: 1.01 }}>
                      <Button 
                        variant="outline" 
                        className="text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-gray-700"
                        onClick={() => {
                          navigator.clipboard.writeText(`curl -X POST https://api.flowforge.dev/v1/pipelines \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "repo_url": "https://github.com/user/my-node-app",
    "branch": "main",
    "commands": [
      "npm ci",
      "npm run test",
      "npm run build",
      "npm run lint"
    ]
  }'`);
                          alert("Node.js example copied to clipboard!");
                        }}
                      >
                        Copy Node.js Example
                      </Button>
                    </motion.div>
                  </CardContent>
                </Card>

                <Card className="mb-6 dark:bg-gray-800 dark:border-gray-700">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Python Project</h3>
                    <div className="bg-slate-900 rounded-lg p-4 overflow-x-auto">
                      <pre className="text-green-400 text-sm">
                        <code>{`curl -X POST https://api.flowforge.dev/v1/pipelines \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "repo_url": "https://github.com/user/my-python-app",
    "branch": "develop",
    "commands": [
      "pip install -r requirements.txt",
      "python -m pytest tests/",
      "python -m black --check .",
      "python -m mypy src/"
    ]
  }'`}</code>
                      </pre>
                    </div>
                    <motion.div className="mt-4" whileHover={{ scale: 1.01 }}>
                      <Button 
                        variant="outline" 
                        className="text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-gray-700"
                        onClick={() => {
                          navigator.clipboard.writeText(`curl -X POST https://api.flowforge.dev/v1/pipelines \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "repo_url": "https://github.com/user/my-python-app",
    "branch": "develop",
    "commands": [
      "pip install -r requirements.txt",
      "python -m pytest tests/",
      "python -m black --check .",
      "python -m mypy src/"
    ]
  }'`);
                          alert("Python example copied to clipboard!");
                        }}
                      >
                        Copy Python Example
                      </Button>
                    </motion.div>
                  </CardContent>
                </Card>

                <Card className="dark:bg-gray-800 dark:border-gray-700">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Docker Build</h3>
                    <div className="bg-slate-900 rounded-lg p-4 overflow-x-auto">
                      <pre className="text-green-400 text-sm">
                        <code>{`curl -X POST https://api.flowforge.dev/v1/pipelines \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "repo_url": "https://github.com/user/my-docker-app",
    "branch": "main",
    "commands": [
      "docker build -t my-app:latest .",
      "docker run --rm my-app:latest npm test"
    ]
  }'`}</code>
                      </pre>
                    </div>
                    <motion.div className="mt-4" whileHover={{ scale: 1.01 }}>
                      <Button 
                        variant="outline" 
                        className="text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-gray-700"
                        onClick={() => {
                          navigator.clipboard.writeText(`curl -X POST https://api.flowforge.dev/v1/pipelines \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "repo_url": "https://github.com/user/my-docker-app",
    "branch": "main",
    "commands": [
      "docker build -t my-app:latest .",
      "docker run --rm my-app:latest npm test"
    ]
  }'`);
                          alert("Docker example copied to clipboard!");
                        }}
                      >
                        Copy Docker Example
                      </Button>
                    </motion.div>
                  </CardContent>
                </Card>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
