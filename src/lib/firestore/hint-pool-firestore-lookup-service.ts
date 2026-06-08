import { db } from "@/lib/firebase-app-init";
import { doc, getDoc } from "firebase/firestore";
import { HINT_POOL_RANKS } from "@/lib/utils/hint-pool-spread-builder";
import type { HintPoolEntry } from "@/types/game-firestore-types";

// Returns hintPool entry for the highest HINT_POOL_RANKS slot still ≤ targetRank.
// Uses getDoc (not getDocs/list) — Firestore rules block list on hintPool but allow get.
// Doc keys are zero-padded targetRank values (e.g., "0100") written by writeHintPool.
export async function getHintForTargetRank(
  roomId: string,
  roundId: string,
  targetRank: number,
): Promise<HintPoolEntry | null> {
  // Descending candidates from known pool slots ≤ targetRank
  const candidates = HINT_POOL_RANKS.filter((r) => r <= targetRank).reverse();

  for (const poolRank of candidates) {
    const ref = doc(
      db,
      "rooms",
      roomId,
      "rounds",
      roundId,
      "hintPool",
      String(poolRank).padStart(4, "0"),
    );
    const snap = await getDoc(ref);
    if (snap.exists()) return snap.data() as HintPoolEntry;
  }

  return null;
}
