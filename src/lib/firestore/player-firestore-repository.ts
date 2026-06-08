import { db } from '@/lib/firebase-app-init'
import { doc, setDoc, updateDoc, serverTimestamp, increment } from 'firebase/firestore'

export async function joinRoom(roomId: string, uid: string, name: string): Promise<void> {
  await setDoc(doc(db, 'rooms', roomId, 'players', uid), {
    uid,
    name,
    joinedAt: serverTimestamp(),
    isActive: true,
    totalScore: 0,
    lastSeenAt: serverTimestamp(),
  })
}

export async function updatePlayerTotalScore(roomId: string, uid: string, addScore: number) {
  await updateDoc(doc(db, 'rooms', roomId, 'players', uid), {
    totalScore: increment(addScore),
    lastSeenAt: serverTimestamp(),
  })
}
