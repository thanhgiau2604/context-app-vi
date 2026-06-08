import { useState } from "react";
import { Loader2, LogIn } from "lucide-react";
import { toast } from "sonner";
import { signInAdmin } from "@/lib/firebase-email-password-auth-service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

export function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await signInAdmin(email.trim(), password);
      // Auth state change triggers AdminAuthGuard to show dashboard
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      const msg =
        code === "auth/invalid-credential"
          ? "Email hoặc mật khẩu không đúng."
          : code === "auth/too-many-requests"
            ? "Quá nhiều lần thử. Vui lòng thử lại sau."
            : "Đăng nhập thất bại.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-xs">
        <CardHeader className="text-center">
          <CardTitle className="text-gradient-brand">Admin</CardTitle>
          <p className="text-xs text-muted-foreground">Đăng nhập để quản lý game</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="admin-email">Email</Label>
              <Input
                id="admin-email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="admin-password">Mật khẩu</Label>
              <Input
                id="admin-password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={loading || !email || !password}>
              {loading ? (
                <Loader2 size={16} className="mr-2 animate-spin" />
              ) : (
                <LogIn size={16} className="mr-2" />
              )}
              Đăng nhập
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
