import { AdminAuthGuard } from "@/features/admin/auth/admin-auth-guard";
import { AdminPanelPage } from "@/features/admin/panel/admin-panel-page";
import { AdminGeminiSettingsPage } from "@/features/admin/settings/admin-gemini-settings-page";

// All /admin routes are wrapped in AdminAuthGuard — shows login page if not authenticated
export const adminRoutes = [
  {
    path: "/admin",
    element: (
      <AdminAuthGuard>
        <AdminPanelPage />
      </AdminAuthGuard>
    ),
  },
  {
    path: "/admin/settings",
    element: (
      <AdminAuthGuard>
        <AdminGeminiSettingsPage />
      </AdminAuthGuard>
    ),
  },
];
