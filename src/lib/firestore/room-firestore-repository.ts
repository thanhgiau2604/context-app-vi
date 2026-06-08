import { db } from '@/lib/firebase-app-init'
import { doc, setDoc, updateDoc, getDoc, onSnapshot, collection, serverTimestamp } from 'firebase/firestore'
import type { Room, Player } from '@/types/game-firestore-types'
import { nanoid } from 'nanoid'

export async function createRoom(adminUid: string): Promise<string> {
  const roomId = nanoid(8).toUpperCase()
  const roomRef = doc(db, 'rooms', roomId)
  await setDoc(roomRef, {
    roomId,
    adminUid,
    status: 'lobby',
    playerCount: 0,
    createdAt: serverTimestamp(),
  })
  return roomId
}

export async function getRoom(roomId: string): Promise<Room | null> {
  const snap = await getDoc(doc(db, 'rooms', roomId))
  return snap.exists() ? (snap.data() as Room) : null
}

export async function updateRoomStatus(roomId: string, status: Room['status']) {
  await updateDoc(doc(db, 'rooms', roomId), { status })
}

export function subscribeToRoom(roomId: string, callback: (room: Room | null) => void) {
  return onSnapshot(doc(db, 'rooms', roomId), (snap) => {
    callback(snap.exists() ? (snap.data() as Room) : null)
  })
}

export function subscribeToPlayers(roomId: string, callback: (players: Player[]) => void) {
  return onSnapshot(collection(db, 'rooms', roomId, 'players'), (snap) => {
    callback(snap.docs.map((d) => d.data() as Player))
  })
}
