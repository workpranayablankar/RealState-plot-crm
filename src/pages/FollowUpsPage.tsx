import { AppLayout } from "@/components/AppLayout";
import { CalendarClock } from "lucide-react";

export default function FollowUpsPage() {
  return (
    <AppLayout>
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <CalendarClock className="h-12 w-12 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold text-foreground">Follow Ups</h1>
        <p className="text-muted-foreground mt-2">Follow-up scheduling and tracking coming soon.</p>
      </div>
    </AppLayout>
  );
}
