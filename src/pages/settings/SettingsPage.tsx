import { NavLink, Outlet, useLocation } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import {
  Users,
  Shield,
  ListOrdered,
  Megaphone,
  Map,
  GitBranch,
  Plug,
  Bell,
  FileSpreadsheet,
  Wrench,
} from "lucide-react";

const settingsLinks = [
  { to: "/settings/users", label: "User Management", icon: Users },
  { to: "/settings/roles", label: "Roles & Permissions", icon: Shield },
  { to: "/settings/lead-statuses", label: "Lead Status Setup", icon: ListOrdered },
  { to: "/settings/lead-sources", label: "Lead Sources", icon: Megaphone },
  { to: "/settings/plots", label: "Property / Plot Mgmt", icon: Map },
  { to: "/settings/assignment", label: "Lead Assignment Rules", icon: GitBranch },
  { to: "/settings/integrations", label: "Integrations", icon: Plug },
  { to: "/settings/notifications", label: "Notifications", icon: Bell },
  { to: "/settings/import-export", label: "Import / Export Data", icon: FileSpreadsheet },
  { to: "/settings/preferences", label: "System Preferences", icon: Wrench },
];

export default function SettingsPage() {
  const location = useLocation();
  const isRoot = location.pathname === "/settings";

  return (
    <AppLayout>
      <div className="flex gap-6">
        {/* Settings sidebar */}
        <aside className="w-56 shrink-0 space-y-1">
          <h2 className="mb-3 text-lg font-bold text-foreground">Settings</h2>
          {settingsLinks.map((link) => {
            const isActive = location.pathname === link.to;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <link.icon className="h-4 w-4 shrink-0" />
                {link.label}
              </NavLink>
            );
          })}
        </aside>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {isRoot ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Wrench className="h-12 w-12 text-muted-foreground mb-4" />
              <h1 className="text-2xl font-bold text-foreground">Settings</h1>
              <p className="text-muted-foreground mt-2">Select a section from the menu to configure your CRM.</p>
            </div>
          ) : (
            <Outlet />
          )}
        </div>
      </div>
    </AppLayout>
  );
}
