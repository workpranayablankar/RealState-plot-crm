import { useLocation } from "react-router-dom";

const labels: Record<string, string> = {
  "/settings/roles": "Roles & Permissions",
  "/settings/lead-statuses": "Lead Status Setup",
  "/settings/lead-sources": "Lead Sources",
  "/settings/plots": "Property / Plot Management",
  "/settings/assignment": "Lead Assignment Rules",
  "/settings/integrations": "Integrations",
  "/settings/notifications": "Notifications",
  "/settings/import-export": "Import / Export Data",
  "/settings/preferences": "System Preferences",
};

export default function SettingsPlaceholder() {
  const location = useLocation();
  const title = labels[location.pathname] || "Settings";

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <h2 className="text-xl font-bold text-foreground">{title}</h2>
      <p className="text-muted-foreground mt-2">This section is coming soon.</p>
    </div>
  );
}
