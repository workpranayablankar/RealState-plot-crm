import { AppLayout } from "@/components/AppLayout";
import { Activity } from "lucide-react";

export default function ActivitiesPage() {
  return (
    <AppLayout>
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Activity className="h-12 w-12 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold text-foreground">Activities</h1>
        <p className="text-muted-foreground mt-2">Activity log and timeline coming soon.</p>
      </div>
    </AppLayout>
  );
}
