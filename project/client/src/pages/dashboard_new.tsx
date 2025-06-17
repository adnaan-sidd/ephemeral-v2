import DashboardLayout from "@/components/dashboard/layout/DashboardLayout";
import DashboardOverview from "@/pages/dashboard/DashboardOverview";

export default function Dashboard() {
  return (
    <DashboardLayout>
      <DashboardOverview />
    </DashboardLayout>
  );
}
