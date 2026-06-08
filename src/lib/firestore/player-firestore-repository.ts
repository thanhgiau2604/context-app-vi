import { db } from "@/lib/firebase-app-init";
import { doc, setDoc, updateDoc, serverTimestamp, increment } from "firebase/firestore";

export async function joinRoom(roomId: string, uid: string, name: string): Promise<void> {
  // merge: true preserves totalScore across page refreshes / re-joins
  await setDoc(
    doc(db, "rooms", roomId, "players", uid),
    {
      uid,
      name,
      joinedAt: serverTimestamp(),
      isActive: true,
      totalScore: 0,
      lastSeenAt: serverTimestamp(),
    },
    { merge: true },
  );
  // Increment room playerCount so admin control bar can track active players
  await updateDoc(doc(db, "rooms", roomId), { playerCount: increment(1) });
}
