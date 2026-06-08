import { subscribeToRoom } from '@/lib/firestore/room-firestore-repository'
import { useEffect, useState } from 'react'
import type { Room } from '@/types/game-firestore-types'

export function useRoomListener(roomId: string | null) {
  const [room, setRoom] = useState<Room | null>(null)
  useEffect(() => {
    if (!roomId) return
    return subscribeToRoom(roomId, setRoom)
  }, [roomId])
  return room
}
