import { create } from 'zustand';

// Define types for our project
export interface Project {
  id: string;
  name: string;
  description: string;
  repository: string;
  branch: string;
  provider: 'github' | 'gitlab' | 'bitbucket';
  status: 'active' | 'inactive';
  lastBuild?: {
    id: string;
    status: 'success' | 'running' | 'failed' | 'queued' | 'canceled';
    startedAt: Date;
    finishedAt: Date | null;
  };
}

// Define types for the project store
interface ProjectsState {
  projects: Project[];
  isLoading: boolean;
  error: string | null;
  // Actions
  setProjects: (projects: Project[]) => void;
  addProject: (project: Project) => void;
  updateProject: (id: string, projectData: Partial<Project>) => void;
  removeProject: (id: string) => void;
  updateProjectLastBuild: (projectId: string, buildData: Project['lastBuild']) => void;
  // Loading state
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
}

// Create the store
export const useProjectsStore = create<ProjectsState>((set) => ({
  projects: [],
  isLoading: false,
  error: null,
  
  // Set all projects
  setProjects: (projects) => set({ projects }),
  
  // Add a project
  addProject: (project) => set((state) => ({
    projects: [project, ...state.projects]
  })),
  
  // Update a project
  updateProject: (id, projectData) => set((state) => ({
    projects: state.projects.map(project => 
      project.id === id ? { ...project, ...projectData } : project
    )
  })),
  
  // Remove a project
  removeProject: (id) => set((state) => ({
    projects: state.projects.filter(project => project.id !== id)
  })),
  
  // Update project's last build
  updateProjectLastBuild: (projectId, buildData) => set((state) => ({
    projects: state.projects.map(project => 
      project.id === projectId 
        ? { ...project, lastBuild: buildData } 
        : project
    )
  })),
  
  // Set loading state
  setLoading: (isLoading) => set({ isLoading }),
  
  // Set error state
  setError: (error) => set({ error })
}));
