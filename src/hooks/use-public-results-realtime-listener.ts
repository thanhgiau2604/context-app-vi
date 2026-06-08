import { db } from '@/lib/firebase-app-init'
import { collection, onSnapshot } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import type { PublicRoundResult } from '@/types/game-firestore-types'

export function subscribeToPublicResults(
  roomId: string,
  roundId: string,
  callback: (results: PublicRoundResult[]) => void
) {
  return onSnapshot(
    collection(db, 'rooms', roomId, 'rounds', roundId, 'publicResults'),
    (snap) => callback(snap.docs.map((d) => d.data() as PublicRoundResult))
  )
}

export function usePublicResultsRealtime(roomId: string | null, roundId: string | null) {
  const [results, setResults] = useState<PublicRoundResult[]>([])
  useEffect(() => {
    if (!roomId || !roundId) return
    return subscribeToPublicResults(roomId, roundId, setResults)
  }, [roomId, roundId])
  return results
}
