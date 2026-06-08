import { subscribeToPlayers } from "@/lib/firestore/room-firestore-repository";
import { useEffect, useState } from "react";
import type { Player } from "@/types/game-firestore-types";

export function usePlayersListener(roomId: string | null) {
  const [players, setPlayers] = useState<Player[]>([]);
  useEffect(() => {
    if (!roomId) return;
    return subscribeToPlayers(roomId, setPlayers);
  }, [roomId]);
  return players;
}
