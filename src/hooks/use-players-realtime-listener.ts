import { subscribeToPlayers } from "@/lib/firestore/top-level-player-firestore-repository";
import { useEffect, useState } from "react";
import type { Player } from "@/types/game-firestore-types";

// Subscribes to top-level players collection (no longer nested under rooms).
export function usePlayersListener() {
  const [players, setPlayers] = useState<Player[]>([]);
  useEffect(() => {
    return subscribeToPlayers(setPlayers);
  }, []);
  return players;
}
