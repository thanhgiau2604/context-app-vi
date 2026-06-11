import { useEffect, useRef } from "react";
import { subscribeToPlayers } from "@/lib/firestore/top-level-player-firestore-repository";
import { subscribeToPublicResults } from "@/hooks/use-public-results-realtime-listener";
import { endCurrentRound } from "@/lib/firestore/game-state-singleton-firestore-repository";
import type { Player } from "@/types/game-firestore-types";

// Admin-only: auto-end the round once EVERY active player has a public result
// (solved/surrendered) — spec §4.3. Compares live uid SETS from the `players` and
// `publicResults` collections rather than a cached `playerCount` field, which can
// drift from reality (e.g. admin not counted) and end the round on a single solve.
export function useAutoEndRoundWhenAllFinished(roundId: string | null, isAdmin: boolean): void {
  const playersRef = useRef<Player[]>([]);
  const finishedRef = useRef<Set<string>>(new Set());
  const endedRoundRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isAdmin || !roundId) return;
    playersRef.current = [];
    finishedRef.current = new Set();

    function maybeEnd() {
      const active = playersRef.current;
      if (active.length === 0) return;
      const allFinished = active.every((p) => finishedRef.current.has(p.uid));
      if (allFinished && endedRoundRef.current !== roundId) {
        endedRoundRef.current = roundId;
        endCurrentRound(roundId!).catch(console.error);
      }
    }

    const unsubPlayers = subscribeToPlayers((players) => {
      playersRef.current = players;
      maybeEnd();
    });
    const unsubResults = subscribeToPublicResults(roundId, (results) => {
      finishedRef.current = new Set(results.map((r) => r.uid));
      maybeEnd();
    });

    return () => {
      unsubPlayers();
      unsubResults();
    };
  }, [isAdmin, roundId]);
}
