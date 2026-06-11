import { useEffect, useState } from "react";
import { subscribeToGameLibrary } from "@/lib/firestore/game-state-singleton-firestore-repository";
import { subscribeToPublicResults } from "@/hooks/use-public-results-realtime-listener";
import type { PublicRoundResult, Round } from "@/types/game-firestore-types";

// Picks the most recently completed round (latest endedAt; falls back to highest roundNumber).
function latestCompletedRoundId(rounds: Round[]): string | null {
  const completed = rounds.filter((r) => r.status === "completed");
  if (completed.length === 0) return null;
  const best = completed.reduce((a, b) => {
    const am = a.endedAt?.toMillis?.() ?? a.roundNumber;
    const bm = b.endedAt?.toMillis?.() ?? b.roundNumber;
    return bm > am ? b : a;
  });
  return best.roundId;
}

// Returns a uid → PublicRoundResult map for the last completed round, used to enrich the
// podium with each player's round stats (guess count, duration, round score).
export function useLatestCompletedRoundResults(): Map<string, PublicRoundResult> {
  const [roundId, setRoundId] = useState<string | null>(null);
  const [byUid, setByUid] = useState<Map<string, PublicRoundResult>>(new Map());

  useEffect(
    () => subscribeToGameLibrary((rounds) => setRoundId(latestCompletedRoundId(rounds))),
    [],
  );

  useEffect(() => {
    if (!roundId) {
      setByUid(new Map());
      return;
    }
    return subscribeToPublicResults(roundId, (results) =>
      setByUid(new Map(results.map((r) => [r.uid, r]))),
    );
  }, [roundId]);

  return byUid;
}
