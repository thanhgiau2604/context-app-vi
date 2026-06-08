import { ArrowLeft, LayoutDashboard } from "lucide-react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

// Top nav bar shown on all admin pages — provides breadcrumb + back navigation
// between /admin (dashboard) and /admin/settings (Gemini settings)
export function AdminPageNavBar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isSettings = pathname === "/admin/settings";

  return (
    <div className="flex items-center gap-2 border-b border-border/40 bg-background/60 px-4 py-3 backdrop-blur-sm">
      {isSettings ? (
        <Button variant="ghost" size="sm" asChild>
          <Link to="/admin">
            <ArrowLeft size={15} className="mr-1" />
            Dashboard
          </Link>
        </Button>
      ) : (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <LayoutDashboard size={15} />
          <span className="font-medium text-foreground">Admin</span>
        </div>
      )}
    </div>
  );
}
