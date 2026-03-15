import { useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { useIsMobile } from "@/hooks/use-mobile";
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
  ChevronDown,
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
  const isMobile = useIsMobile();
  const isRoot = location.pathname === "/settings";
  const [menuOpen, setMenuOpen] = useState(false);

  const activeLink = settingsLinks.find((l) => location.pathname === l.to);

  return (
    <AppLayout>
      <div className="flex flex-col md:flex-row gap-4 md:gap-6">
        {/* Settings sidebar / mobile toggle */}
        {isMobile ? (
          <div className="space-y-1">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex w-full items-center justify-between rounded-lg border border-border bg-card px-4 py-3 text-sm font-semibold text-foreground"
            >
              <span className="flex items-center gap-2">
                {activeLink ? (
                  <>
                    <activeLink.icon className="h-4 w-4" />
                    {activeLink.label}
                  </>
                ) : (
                  <>
                    <Wrench className="h-4 w-4" />
                    Settings Menu
                  </>
                )}
              </span>
              <ChevronDown className={`h-4 w-4 transition-transform ${menuOpen ? "rotate-180" : ""}`} />
            </button>
            {menuOpen && (
              <div className="rounded-lg border border-border bg-card overflow-hidden">
                {settingsLinks.map((link) => {
                  const isActive = location.pathname === link.to;
                  return (
                    <NavLink
                      key={link.to}
                      to={link.to}
                      onClick={() => setMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors border-b border-border last:border-b-0 ${
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
              </div>
            )}
          </div>
        ) : (
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
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          {isRoot ? (
            <div className="flex flex-col items-center justify-center py-12 md:py-20 text-center">
              <Wrench className="h-10 w-10 md:h-12 md:w-12 text-muted-foreground mb-4" />
              <h1 className="text-xl md:text-2xl font-bold text-foreground">Settings</h1>
              <p className="text-muted-foreground mt-2 text-sm">Select a section from the menu to configure your CRM.</p>
            </div>
          ) : (
            <Outlet />
          )}
        </div>
      </div>
    </AppLayout>
  );
}
