import { signInAnonymously, onAuthStateChanged, type User } from 'firebase/auth'
import { auth } from './firebase-app-init'

export async function ensureAnonymousUser(): Promise<User> {
  if (auth.currentUser) return auth.currentUser
  const result = await signInAnonymously(auth)
  return result.user
}

export function subscribeToAuthState(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback)
}
