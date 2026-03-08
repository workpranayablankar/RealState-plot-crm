import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Dashboard from "./pages/Dashboard";
import LeadsPage from "./pages/LeadsPage";
import AgentsPage from "./pages/AgentsPage";
import ReportsPage from "./pages/ReportsPage";
import AddLeadPage from "./pages/AddLeadPage";
import PlotsPage from "./pages/PlotsPage";
import FollowUpsPage from "./pages/FollowUpsPage";
import ActivitiesPage from "./pages/ActivitiesPage";
import NotificationsPage from "./pages/NotificationsPage";
import SettingsPage from "./pages/settings/SettingsPage";
import UserManagementPage from "./pages/settings/UserManagementPage";
import RolesPermissionsPage from "./pages/settings/RolesPermissionsPage";
import LeadStatusSetupPage from "./pages/settings/LeadStatusSetupPage";
import SettingsPlaceholder from "./pages/settings/SettingsPlaceholder";
import LoginPage from "./pages/LoginPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) {
  const { session, role, loading } = useAuth();
  if (loading) return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading...</div>;
  if (!session) return <Navigate to="/login" />;
  if (adminOnly && role !== "admin") return <Navigate to="/" />;
  return <>{children}</>;
}

function AppRoutes() {
  const { session, loading } = useAuth();
  if (loading) return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading...</div>;

  return (
    <Routes>
      <Route path="/login" element={session ? <Navigate to="/" /> : <LoginPage />} />
      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/leads" element={<ProtectedRoute><LeadsPage /></ProtectedRoute>} />
      <Route path="/add-lead" element={<ProtectedRoute adminOnly><AddLeadPage /></ProtectedRoute>} />
      <Route path="/follow-ups" element={<ProtectedRoute><FollowUpsPage /></ProtectedRoute>} />
      <Route path="/agents" element={<ProtectedRoute adminOnly><AgentsPage /></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute adminOnly><ReportsPage /></ProtectedRoute>} />
      <Route path="/plots" element={<ProtectedRoute><PlotsPage /></ProtectedRoute>} />
      <Route path="/activities" element={<ProtectedRoute><ActivitiesPage /></ProtectedRoute>} />
      <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute adminOnly><SettingsPage /></ProtectedRoute>}>
        <Route path="users" element={<UserManagementPage />} />
        <Route path="roles" element={<RolesPermissionsPage />} />
        <Route path="lead-statuses" element={<LeadStatusSetupPage />} />
        <Route path="lead-sources" element={<SettingsPlaceholder />} />
        <Route path="plots" element={<SettingsPlaceholder />} />
        <Route path="assignment" element={<SettingsPlaceholder />} />
        <Route path="integrations" element={<SettingsPlaceholder />} />
        <Route path="notifications" element={<SettingsPlaceholder />} />
        <Route path="import-export" element={<SettingsPlaceholder />} />
        <Route path="preferences" element={<SettingsPlaceholder />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
