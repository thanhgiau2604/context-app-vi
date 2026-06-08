import { db } from '@/lib/firebase-app-init'
import { doc, getDoc } from 'firebase/firestore'
import type { TermIndexDoc } from '@/types/game-firestore-types'

// Single-doc get by hash — players cannot list the full collection (security rules block list)
export async function lookupTermHash(
  roomId: string,
  roundId: string,
  hash: string
): Promise<TermIndexDoc | null> {
  const snap = await getDoc(doc(db, 'rooms', roomId, 'rounds', roundId, 'termIndex', hash))
  return snap.exists() ? (snap.data() as TermIndexDoc) : null
}
