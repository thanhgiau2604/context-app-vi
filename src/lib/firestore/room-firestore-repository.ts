import { db } from "@/lib/firebase-app-init";
import {
  doc,
  setDoc,
  updateDoc,
  getDoc,
  getDocs,
  onSnapshot,
  collection,
  query,
  where,
  orderBy,
  limit,
  writeBatch,
  serverTimestamp,
} from "firebase/firestore";
import { ROOM_ID } from "./single-room-id-constant";
import type { Room, Player, Round } from "@/types/game-firestore-types";

// ── Single-room helpers ────────────────────────────────────────────────────

// Creates rooms/main if it doesn't already exist.
// Safe to call on every admin panel mount.
export async function ensureSingleRoom(adminUid: string): Promise<void> {
  const ref = doc(db, "rooms", ROOM_ID);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      roomId: ROOM_ID,
      adminUid,
      status: "idle",
      playerCount: 0,
      createdAt: serverTimestamp(),
    });
  }
}

// Opens the session so players can join and see the lobby.
export async function openSession(): Promise<void> {
  await updateDoc(doc(db, "rooms", ROOM_ID), { status: "waiting" });
}

// Starts the game: picks the oldest ready round, sets it as current, transitions to playing.
// Throws if no ready round exists in the library.
export async function startGameSession(): Promise<void> {
  const q = query(
    collection(db, "rooms", ROOM_ID, "rounds"),
    where("status", "==", "ready"),
    orderBy("createdAt", "asc"),
    limit(1),
  );
  const snap = await getDocs(q);
  if (snap.empty) throw new Error("Không có game nào trong kho. Tạo game trước.");

  const firstRound = snap.docs[0];
  const batch = writeBatch(db);
  batch.update(doc(db, "rooms", ROOM_ID), {
    status: "playing",
    currentRoundId: firstRound.id,
  });
  batch.update(firstRound.ref, { status: "playing" });
  await batch.commit();
}

// Marks current round completed then starts the next ready round.
// Returns true if a next round was found, false if library exhausted (caller should end session).
export async function advanceToNextRound(currentRoundId: string): Promise<boolean> {
  const q = query(
    collection(db, "rooms", ROOM_ID, "rounds"),
    where("status", "==", "ready"),
    orderBy("createdAt", "asc"),
    limit(1),
  );
  const [, nextSnap] = await Promise.all([
    updateDoc(doc(db, "rooms", ROOM_ID, "rounds", currentRoundId), { status: "completed" }),
    getDocs(q),
  ]);

  if (nextSnap.empty) return false;

  const nextRound = nextSnap.docs[0];
  const batch = writeBatch(db);
  batch.update(doc(db, "rooms", ROOM_ID), { currentRoundId: nextRound.id });
  batch.update(nextRound.ref, { status: "playing" });
  await batch.commit();
  return true;
}

// Ends the session: marks current round completed and sets room to ended.
export async function endSession(currentRoundId: string): Promise<void> {
  const batch = writeBatch(db);
  batch.update(doc(db, "rooms", ROOM_ID, "rounds", currentRoundId), { status: "completed" });
  batch.update(doc(db, "rooms", ROOM_ID), { status: "ended", currentRoundId: null });
  await batch.commit();
}

// Resets session back to idle so a new session can be started.
export async function resetSession(): Promise<void> {
  await updateDoc(doc(db, "rooms", ROOM_ID), {
    status: "idle",
    currentRoundId: null,
    playerCount: 0,
  });
}

// ── Generic room helpers ───────────────────────────────────────────────────

export async function getRoom(roomId: string): Promise<Room | null> {
  const snap = await getDoc(doc(db, "rooms", roomId));
  return snap.exists() ? (snap.data() as Room) : null;
}

export async function updateRoomStatus(roomId: string, status: Room["status"]) {
  await updateDoc(doc(db, "rooms", roomId), { status });
}

export function subscribeToRoom(roomId: string, callback: (room: Room | null) => void) {
  return onSnapshot(doc(db, "rooms", roomId), (snap) => {
    callback(snap.exists() ? (snap.data() as Room) : null);
  });
}

export function subscribeToPlayers(roomId: string, callback: (players: Player[]) => void) {
  return onSnapshot(collection(db, "rooms", roomId, "players"), (snap) => {
    callback(snap.docs.map((d) => d.data() as Player));
  });
}

// Real-time game library: all rounds sorted oldest first.
// Admin uses this to display the game library and track which games are ready/playing/completed.
export function subscribeToGameLibrary(roomId: string, callback: (rounds: Round[]) => void) {
  const q = query(collection(db, "rooms", roomId, "rounds"), orderBy("createdAt", "asc"));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ ...d.data(), roundId: d.id }) as Round));
  });
}
