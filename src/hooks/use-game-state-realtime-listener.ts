import { subscribeToGameState } from "@/lib/firestore/game-state-singleton-firestore-repository";
import { useEffect, useState } from "react";
import type { GameState } from "@/types/game-firestore-types";

export function useGameStateListener() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  useEffect(() => {
    return subscribeToGameState(setGameState);
  }, []);
  return gameState;
}
