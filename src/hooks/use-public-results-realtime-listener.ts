import { db } from "@/lib/firebase-app-init";
import { collection, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import type { PublicRoundResult } from "@/types/game-firestore-types";

// publicResults live under rounds/{roundId}/publicResults (no rooms wrapper)
export function subscribeToPublicResults(
  roundId: string,
  callback: (results: PublicRoundResult[]) => void,
) {
  return onSnapshot(collection(db, "rounds", roundId, "publicResults"), (snap) =>
    callback(snap.docs.map((d) => d.data() as PublicRoundResult)),
  );
}

export function usePublicResultsRealtime(roundId: string | null) {
  const [results, setResults] = useState<PublicRoundResult[]>([]);
  useEffect(() => {
    if (!roundId) return;
    return subscribeToPublicResults(roundId, setResults);
  }, [roundId]);
  return results;
}
