import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from "@/components/dashboard/layout/DashboardLayout";
import DashboardOverview from "@/pages/dashboard/DashboardOverview";
import ProjectsList from "@/components/dashboard/projects/ProjectsList";
import ProjectDetail from "@/components/dashboard/projects/ProjectDetail";
import ProjectSettings from "@/components/dashboard/projects/ProjectSettings";
import BuildDetail from "@/components/dashboard/builds/BuildDetail";
import ProjectBuilds from "@/components/dashboard/projects/ProjectBuilds";
import ProfilePage from "@/pages/dashboard/profile";

export default function Dashboard() {
  return (
    <DashboardLayout>
      <Routes>
        <Route path="/" element={<DashboardOverview />} />
        <Route path="/projects" element={<ProjectsList />} />
        <Route path="/projects/:projectId" element={<ProjectDetail />} />
        <Route path="/projects/:projectId/settings" element={<ProjectSettings />} />
        <Route path="/projects/:projectId/builds" element={<ProjectBuilds />} />
        <Route path="/projects/:projectId/builds/:buildId" element={<BuildDetail />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </DashboardLayout>
  );
}
