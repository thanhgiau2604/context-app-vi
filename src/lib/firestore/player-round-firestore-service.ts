import { db } from "@/lib/firebase-app-init";
import { doc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import type { PlayerRound } from "@/types/game-firestore-types";

export async function initPlayerRound(roomId: string, roundId: string, uid: string) {
  await setDoc(doc(db, "rooms", roomId, "rounds", roundId, "playerRounds", uid), {
    uid,
    status: "playing",
    startedAt: serverTimestamp(),
    guessCount: 0,
    bestRank: null,
    usedHints: 0,
    hintPenalty: 0,
    roundScore: 0,
  } satisfies Omit<PlayerRound, "startedAt"> & { startedAt: unknown });
}

export async function updatePlayerRoundAfterGuess(
  roomId: string,
  roundId: string,
  uid: string,
  update: { guessCount: number; bestRank: number | null },
) {
  await updateDoc(doc(db, "rooms", roomId, "rounds", roundId, "playerRounds", uid), update);
}

export async function updatePlayerRoundAfterHint(
  roomId: string,
  roundId: string,
  uid: string,
  update: { usedHints: number; hintPenalty: number },
) {
  await updateDoc(doc(db, "rooms", roomId, "rounds", roundId, "playerRounds", uid), update);
}
