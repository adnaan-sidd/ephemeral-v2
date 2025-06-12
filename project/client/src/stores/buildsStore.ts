import { create } from 'zustand';

// Define types for our build
export interface Build {
  id: string;
  projectId: string;
  projectName: string;
  status: 'success' | 'failed' | 'running' | 'queued' | 'canceled';
  branch: string;
  commitSha: string;
  commitMessage: string;
  author: string;
  duration: number;
  startedAt: Date;
  finishedAt: Date | null;
}

// Define types for the build store
interface BuildsState {
  builds: Build[];
  isLoading: boolean;
  error: string | null;
  // Actions
  setBuilds: (builds: Build[]) => void;
  addBuild: (build: Build) => void;
  updateBuild: (id: string, buildData: Partial<Build>) => void;
  removeBuild: (id: string) => void;
  // Loading state
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
}

// Create the store
export const useBuildsStore = create<BuildsState>((set) => ({
  builds: [],
  isLoading: false,
  error: null,
  
  // Set all builds
  setBuilds: (builds) => set({ builds }),
  
  // Add a build
  addBuild: (build) => set((state) => ({
    builds: [build, ...state.builds]
  })),
  
  // Update a build
  updateBuild: (id, buildData) => set((state) => ({
    builds: state.builds.map(build => 
      build.id === id ? { ...build, ...buildData } : build
    )
  })),
  
  // Remove a build
  removeBuild: (id) => set((state) => ({
    builds: state.builds.filter(build => build.id !== id)
  })),
  
  // Set loading state
  setLoading: (isLoading) => set({ isLoading }),
  
  // Set error state
  setError: (error) => set({ error })
}));
