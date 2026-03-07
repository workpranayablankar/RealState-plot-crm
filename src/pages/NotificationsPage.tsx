import { AppLayout } from "@/components/AppLayout";
import { Bell } from "lucide-react";

export default function NotificationsPage() {
  return (
    <AppLayout>
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Bell className="h-12 w-12 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
        <p className="text-muted-foreground mt-2">Notification center coming soon.</p>
      </div>
    </AppLayout>
  );
}
