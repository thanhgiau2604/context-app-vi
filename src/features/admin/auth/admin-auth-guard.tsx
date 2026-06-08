import { useEffect, useState } from "react";
import type { User } from "firebase/auth";
import {
  isAuthenticatedAdmin,
  subscribeToAdminAuthState,
} from "@/lib/firebase-email-password-auth-service";
import { AdminPageNavBar } from "@/features/admin/layout/admin-page-nav-bar";
import { AdminLoginPage } from "./admin-login-page";

type Props = { children: React.ReactNode };

// Wraps all /admin routes — shows nav bar + login page if not email-authenticated
export function AdminAuthGuard({ children }: Props) {
  const [user, setUser] = useState<User | null | "loading">("loading");

  useEffect(() => {
    return subscribeToAdminAuthState(setUser);
  }, []);

  if (user === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="animate-pulse text-muted-foreground text-sm">Đang kiểm tra xác thực…</p>
      </div>
    );
  }

  if (!isAuthenticatedAdmin(user)) return <AdminLoginPage />;

  return (
    <div className="flex min-h-screen flex-col">
      <AdminPageNavBar />
      <div className="flex flex-1 items-center justify-center p-6">{children}</div>
    </div>
  );
}
