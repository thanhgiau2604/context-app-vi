import { db } from "@/lib/firebase-app-init";
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  onSnapshot,
  collection,
  serverTimestamp,
  increment,
} from "firebase/firestore";

// Players are top-level: players/{uid} (no longer nested under rooms)
// Only increments playerCount for NEW players — re-joins/refreshes don't double-count.
export async function joinGame(uid: string, name: string): Promise<void> {
  const playerRef = doc(db, "players", uid);
  const existing = await getDoc(playerRef);

  if (!existing.exists()) {
    // New player: create doc + register in playerCount
    await setDoc(playerRef, {
      uid,
      name,
      joinedAt: serverTimestamp(),
      isActive: true,
      totalScore: 0,
      lastSeenAt: serverTimestamp(),
    });
    await updateDoc(doc(db, "gameState", "main"), { playerCount: increment(1) });
  } else {
    // Returning player: just refresh activity fields, don't touch playerCount
    await updateDoc(playerRef, {
      isActive: true,
      lastSeenAt: serverTimestamp(),
    });
  }
}

export function subscribeToPlayers(
  callback: (players: import("@/types/game-firestore-types").Player[]) => void,
) {
  return onSnapshot(collection(db, "players"), (snap) => {
    callback(snap.docs.map((d) => d.data() as import("@/types/game-firestore-types").Player));
  });
}
