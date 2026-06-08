import { db } from "@/lib/firebase-app-init";
import { doc, writeBatch, serverTimestamp, increment } from "firebase/firestore";
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
  });

  // Atomic batch: all 3 writes succeed or none do (prevents partial score credit)
  const batch = writeBatch(db);

  batch.update(
    doc(db, "rooms", params.roomId, "rounds", params.roundId, "playerRounds", params.uid),
    {
      status: params.status,
      finishedAt: serverTimestamp(),
      roundScore,
    },
  );

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
