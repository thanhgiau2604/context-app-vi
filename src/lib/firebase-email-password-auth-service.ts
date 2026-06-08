import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import { auth } from "./firebase-app-init";

// Sign in with email/password — used exclusively for admin access
export async function signInAdmin(email: string, password: string): Promise<User> {
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user;
}

export async function signOutAdmin(): Promise<void> {
  await firebaseSignOut(auth);
}

// Returns true if user is logged in AND is not anonymous (i.e. email/password admin)
export function isAuthenticatedAdmin(user: User | null): boolean {
  return user !== null && !user.isAnonymous;
}

export function subscribeToAdminAuthState(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}
