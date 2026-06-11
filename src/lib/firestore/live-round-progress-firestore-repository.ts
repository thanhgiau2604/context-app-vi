import { useEffect, useState } from "react";
import { db } from "@/lib/firebase-app-init";
import { doc, setDoc, collection, onSnapshot, serverTimestamp } from "firebase/firestore";

// Live per-player progress during a round. Spec §9: guess WORDS stay local (private),
// but a player's current best rank IS shared so others see live progress on the board.
export type LiveProgress = {
  uid: string;
  name: string;
  bestRank: number;
  // Projected round points so far (integer). Spec §9: a number, no guess word leaked.
  liveScore: number;
};

// Writes only when bestRank improves (caller-gated) so writes stay bounded per round.
export async function publishLiveProgress(
  roundId: string,
  uid: string,
  name: string,
  bestRank: number,
  liveScore: number,
): Promise<void> {
  await setDoc(
    doc(db, "rounds", roundId, "liveProgress", uid),
    { uid, name, bestRank, liveScore, updatedAt: serverTimestamp() },
    { merge: true },
  );
}

export function subscribeToLiveProgress(
  roundId: string,
  callback: (progress: LiveProgress[]) => void,
) {
  return onSnapshot(collection(db, "rounds", roundId, "liveProgress"), (snap) =>
    callback(snap.docs.map((d) => d.data() as LiveProgress)),
  );
}

export function useLiveRoundProgress(roundId: string | null): LiveProgress[] {
  const [progress, setProgress] = useState<LiveProgress[]>([]);
  useEffect(() => {
    if (!roundId) return;
    return subscribeToLiveProgress(roundId, setProgress);
  }, [roundId]);
  return progress;
}
