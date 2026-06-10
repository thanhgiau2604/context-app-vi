import { db } from "@/lib/firebase-app-init";
import {
  doc,
  setDoc,
  serverTimestamp,
  getDocs,
  collection,
  orderBy,
  query,
} from "firebase/firestore";
import type { HistoryGame } from "@/types/game-firestore-types";

// Records a completed round into historyGames/{roundId}.
// Call after endCurrentRound — requires admin to read keyword from private/secret first.
export async function recordHistoryGame(params: Omit<HistoryGame, "completedAt">): Promise<void> {
  await setDoc(doc(db, "historyGames", params.roundId), {
    ...params,
    completedAt: serverTimestamp(),
  });
}

export async function getHistoryGames(): Promise<HistoryGame[]> {
  const q = query(collection(db, "historyGames"), orderBy("completedAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as HistoryGame);
}
