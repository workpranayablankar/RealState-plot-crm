import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard,
  Users,
  UserCheck,
  BarChart3,
  Plus,
  Building2,
  Map,
  LogOut,
  CalendarClock,
  Activity,
  Bell,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function AppSidebar() {
  const location = useLocation();
  const { role, profile, signOut } = useAuth();

  const links = [
    { to: "/", label: "Dashboard", icon: LayoutDashboard },
    { to: "/leads", label: "Leads", icon: Users },
    { to: "/add-lead", label: "Add Lead", icon: Plus },
    { to: "/follow-ups", label: "Follow Ups", icon: CalendarClock },
    ...(role === "admin" ? [{ to: "/agents", label: "Agents", icon: UserCheck }] : []),
    { to: "/plots", label: "Plots", icon: Map },
    { to: "/activities", label: "Activities", icon: Activity },
    ...(role === "admin" ? [{ to: "/reports", label: "Reports", icon: BarChart3 }] : []),
    { to: "/notifications", label: "Notifications", icon: Bell },
    ...(role === "admin" ? [{ to: "/settings", label: "Settings", icon: Settings }] : []),
  ];

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-60 flex-col border-r border-sidebar-border bg-sidebar">
      <div className="flex h-16 items-center gap-2.5 border-b border-sidebar-border px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
          <Building2 className="h-5 w-5 text-primary-foreground" />
        </div>
        <span className="text-lg font-bold text-foreground tracking-tight">RealEstate CRM</span>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        {links.map((link) => {
          const isActive = location.pathname === link.to || (link.to !== "/" && location.pathname.startsWith(link.to));
          return (
            <NavLink
              key={link.to}
              to={link.to}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-[hsl(var(--sidebar-hover))]"
              }`}
            >
              <link.icon className="h-4 w-4 shrink-0" />
              {link.label}
            </NavLink>
          );
        })}
      </nav>
      <div className="border-t border-sidebar-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
              {profile?.full_name?.charAt(0) || "U"}
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{profile?.full_name || "User"}</p>
              <p className="text-xs text-muted-foreground capitalize">{role || "user"}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={signOut}><LogOut className="h-4 w-4" /></Button>
        </div>
      </div>
    </aside>
  );
}
