import { db } from "@/lib/firebase-app-init";
import {
  doc,
  onSnapshot,
  collection,
  serverTimestamp,
  increment,
  runTransaction,
} from "firebase/firestore";
import { MAX_PLAYERS } from "@/lib/config/game-limits-config";

// Thrown when the room is already at MAX_PLAYERS — caller shows a friendly message.
export class RoomFullError extends Error {
  constructor() {
    super(`Phòng đã đủ ${MAX_PLAYERS} người chơi.`);
    this.name = "RoomFullError";
  }
}

// Players are top-level: players/{uid} (no longer nested under rooms).
// Transaction enforces the 10-player cap atomically (spec §15.6) — guards against join races.
// New players increment playerCount; re-joins/refreshes don't double-count.
export async function joinGame(uid: string, name: string): Promise<void> {
  const playerRef = doc(db, "players", uid);
  const stateRef = doc(db, "gameState", "main");

  await runTransaction(db, async (tx) => {
    const playerSnap = await tx.get(playerRef);
    if (playerSnap.exists()) {
      // Returning player: refresh activity, don't touch playerCount.
      tx.update(playerRef, { isActive: true, lastSeenAt: serverTimestamp() });
      return;
    }

    const stateSnap = await tx.get(stateRef);
    const count = (stateSnap.data()?.playerCount as number | undefined) ?? 0;
    if (count >= MAX_PLAYERS) throw new RoomFullError();

    tx.set(playerRef, {
      uid,
      name,
      joinedAt: serverTimestamp(),
      isActive: true,
      totalScore: 0,
      lastSeenAt: serverTimestamp(),
    });
    tx.update(stateRef, { playerCount: increment(1) });
  });
}

export function subscribeToPlayers(
  callback: (players: import("@/types/game-firestore-types").Player[]) => void,
) {
  return onSnapshot(collection(db, "players"), (snap) => {
    callback(snap.docs.map((d) => d.data() as import("@/types/game-firestore-types").Player));
  });
}
