import DashboardLayout from "@/components/dashboard/layout/DashboardLayout";
import { motion } from "framer-motion";
import { Bell, Settings as SettingsIcon, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

export default function NotificationsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col space-y-2"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
              <p className="text-slate-600 dark:text-slate-400">
                Manage your notification preferences and view recent alerts.
              </p>
            </div>
            <Button variant="outline" className="flex items-center gap-2">
              <SettingsIcon className="h-4 w-4" />
              Settings
            </Button>
          </div>
        </motion.div>

        {/* Notification Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <CardHeader>
              <CardTitle>Email Notifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Build Completion</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Get notified when builds complete
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Build Failures</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Get notified when builds fail
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Deployment Status</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Get notified about deployments
                  </p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <CardHeader>
              <CardTitle>Push Notifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Real-time Updates</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Receive browser notifications
                  </p>
                </div>
                <Switch />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Security Alerts</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Important security notifications
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Notifications */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-blue-500" />
                Recent Notifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start space-x-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="font-medium">Build completed successfully</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      my-awesome-app#142 on main branch completed in 2m 15s
                    </p>
                    <p className="text-xs text-slate-500 mt-1">2 hours ago</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="font-medium">Build failed</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      api-service#89 failed during test phase
                    </p>
                    <p className="text-xs text-slate-500 mt-1">4 hours ago</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="font-medium">Deployment successful</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      my-awesome-app deployed to production
                    </p>
                    <p className="text-xs text-slate-500 mt-1">6 hours ago</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
