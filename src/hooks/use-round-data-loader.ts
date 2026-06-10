import { useEffect, useState } from "react";
import { getRoundData } from "@/lib/firestore/round-with-embedded-terms-firestore-repository";
import { useGameStore } from "@/stores/game-session-store";

// Loads round terms + keywordHash + roundSalt from Firestore once per roundId.
// Stores them in Zustand for local guess lookup (no per-guess Firestore reads).
export function useRoundDataLoader(roundId: string | null) {
  const { setRoundData } = useGameStore();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!roundId) return;
    setLoading(true);
    getRoundData(roundId)
      .then((data) => {
        if (data) setRoundData(data.terms, data.keywordHash, data.roundSalt);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [roundId, setRoundData]);

  return { loading };
}
