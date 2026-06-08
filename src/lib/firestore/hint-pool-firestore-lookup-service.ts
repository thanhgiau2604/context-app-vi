import { db } from '@/lib/firebase-app-init'
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore'
import type { HintPoolEntry } from '@/types/game-firestore-types'

// Returns hintPool entry with highest rank still ≤ targetRank
// Docs keyed by zero-padded rank ("0010", "0100") so lexicographic order = numeric order
export async function getHintForTargetRank(
  roomId: string,
  roundId: string,
  targetRank: number
): Promise<HintPoolEntry | null> {
  const poolRef = collection(db, 'rooms', roomId, 'rounds', roundId, 'hintPool')
  const q = query(poolRef, where('rank', '<=', targetRank), orderBy('rank', 'desc'), limit(1))
  const snap = await getDocs(q)
  if (snap.empty) return null
  return snap.docs[0].data() as HintPoolEntry
}
