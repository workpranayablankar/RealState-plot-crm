import { ReactNode, useState } from "react";
import { AppSidebar } from "./AppSidebar";
import { MobileNav } from "./MobileNav";
import { useIsMobile } from "@/hooks/use-mobile";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AppLayout({ children }: { children: ReactNode }) {
  const isMobile = useIsMobile();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {isMobile ? (
        <>
          <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-border bg-background px-4">
            <Button variant="ghost" size="icon" onClick={() => setMobileOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
            <span className="text-lg font-bold text-foreground tracking-tight">RealEstate CRM</span>
          </header>
          <MobileNav open={mobileOpen} onOpenChange={setMobileOpen} />
          <main className="min-h-[calc(100vh-3.5rem)] p-4">{children}</main>
        </>
      ) : (
        <>
          <AppSidebar />
          <main className="ml-60 min-h-screen p-6">{children}</main>
        </>
      )}
    </div>
  );
}
