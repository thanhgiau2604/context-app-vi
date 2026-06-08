import { useEffect, useState } from 'react'
import type { User } from 'firebase/auth'
import { isAuthenticatedAdmin, subscribeToAdminAuthState } from '@/lib/firebase-email-password-auth-service'
import { AdminLoginPage } from './admin-login-page'

type Props = { children: React.ReactNode }

// Wraps all /admin routes — renders login page if not authenticated as non-anonymous user
export function AdminAuthGuard({ children }: Props) {
  const [user, setUser] = useState<User | null | 'loading'>('loading')

  useEffect(() => {
    return subscribeToAdminAuthState(setUser)
  }, [])

  if (user === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="animate-pulse text-muted-foreground text-sm">Đang kiểm tra xác thực…</p>
      </div>
    )
  }

  if (!isAuthenticatedAdmin(user)) return <AdminLoginPage />

  return <>{children}</>
}
