import { useLocation, NavLink } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  LayoutDashboard,
  Users,
  UserCheck,
  BarChart3,
  Plus,
  Map,
  LogOut,
  CalendarClock,
  Activity,
  Bell,
  Settings,
  Phone,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface MobileNavProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileNav({ open, onOpenChange }: MobileNavProps) {
  const location = useLocation();
  const { role, profile, signOut } = useAuth();

  const links = [
    { to: "/", label: "Dashboard", icon: LayoutDashboard },
    { to: "/leads", label: "Leads", icon: Users },
    ...(role !== "telecaller" ? [{ to: "/add-lead", label: "Add Lead", icon: Plus }] : []),
    { to: "/follow-ups", label: "Follow Ups", icon: CalendarClock },
    ...(role === "telecaller" ? [{ to: "/call-history", label: "Call History", icon: Phone }] : []),
    ...(role === "admin" ? [{ to: "/agents", label: "Agents", icon: UserCheck }] : []),
    { to: "/plots", label: "Plots", icon: Map },
    { to: "/activities", label: "Activities", icon: Activity },
    ...(role === "admin" ? [{ to: "/reports", label: "Reports", icon: BarChart3 }] : []),
    { to: "/notifications", label: "Notifications", icon: Bell },
    ...(role === "admin" ? [{ to: "/settings", label: "Settings", icon: Settings }] : []),
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="border-b border-border px-5 py-4">
          <SheetTitle className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Building2 className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold tracking-tight">RealEstate CRM</span>
          </SheetTitle>
        </SheetHeader>

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
          {links.map((link) => {
            const isActive = location.pathname === link.to || (link.to !== "/" && location.pathname.startsWith(link.to));
            return (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => onOpenChange(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
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
        </nav>

        <div className="border-t border-border p-4">
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
      </SheetContent>
    </Sheet>
  );
}
