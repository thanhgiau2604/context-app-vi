import { db } from "@/lib/firebase-app-init";
import { doc, writeBatch, serverTimestamp, increment, Timestamp } from "firebase/firestore";
import { calculateRoundScore } from "@/lib/utils/round-score-calculator";
import type { PublicRoundResult } from "@/types/game-firestore-types";

type FinishRoundParams = {
  roomId: string;
  roundId: string;
  uid: string;
  name: string;
  status: "solved" | "surrendered";
  bestRank: number | null;
  guessCount: number;
  usedHints: number;
  hintPenalty: number;
  startedAtMs: number;
  finishOrder: number;
  // True if player reached rank ≤ 50 within the first 60s — grants small bonus for surrendered players
  firstNearMissWithin60s?: boolean;
};

export async function finishPlayerRound(params: FinishRoundParams): Promise<number> {
  const durationMs = Date.now() - params.startedAtMs;
  const durationSec = durationMs / 1000;

  const roundScore = calculateRoundScore({
    status: params.status,
    bestRank: params.bestRank,
    durationSec,
    guessCount: params.guessCount,
    usedHints: params.usedHints,
    firstNearMissWithin60s: params.firstNearMissWithin60s,
  });

  // Atomic batch: all 3 writes succeed or none do (prevents partial score credit)
  const batch = writeBatch(db);

  // Use set (not update) — playerRounds doc is created here for the first time
  batch.set(doc(db, "rooms", params.roomId, "rounds", params.roundId, "playerRounds", params.uid), {
    uid: params.uid,
    status: params.status,
    startedAt: Timestamp.fromMillis(params.startedAtMs),
    finishedAt: serverTimestamp(),
    guessCount: params.guessCount,
    bestRank: params.bestRank,
    usedHints: params.usedHints,
    hintPenalty: params.hintPenalty,
    roundScore,
  });

  const publicResult: Omit<PublicRoundResult, "createdAt"> & { createdAt: unknown } = {
    uid: params.uid,
    name: params.name,
    status: params.status,
    finishOrder: params.finishOrder,
    guessCount: params.guessCount,
    bestRank: params.bestRank,
    durationMs,
    usedHints: params.usedHints,
    roundScore,
    createdAt: serverTimestamp(),
  };
  batch.set(
    doc(db, "rooms", params.roomId, "rounds", params.roundId, "publicResults", params.uid),
    publicResult,
  );

  batch.update(doc(db, "rooms", params.roomId, "players", params.uid), {
    totalScore: increment(roundScore),
  });

  await batch.commit();
  return roundScore;
}
