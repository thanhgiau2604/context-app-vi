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
  deleteField,
} from "firebase/firestore";
import type { GameState, Round } from "@/types/game-firestore-types";

const STATE_DOC = "main";
const STATE_COL = "gameState";

function stateRef() {
  return doc(db, STATE_COL, STATE_DOC);
}

// Creates gameState/main if it doesn't already exist.
// Safe to call on every admin panel mount.
export async function ensureGameState(adminUid: string): Promise<void> {
  const snap = await getDoc(stateRef());
  if (!snap.exists()) {
    await setDoc(stateRef(), {
      adminUid,
      status: "idle",
      playerCount: 0,
      createdAt: serverTimestamp(),
    } satisfies Omit<GameState, "createdAt"> & { createdAt: unknown });
  }
}

// Queues deletes for every player doc onto the given batch (spec §15.2 — totalScore
// must not bleed across sessions). Cap at 500 to stay under Firestore's per-batch op
// limit; live players ≤ MAX_PLAYERS, the cap only matters for stale-doc cleanup.
async function queueWipeAllPlayers(batch: ReturnType<typeof writeBatch>): Promise<void> {
  const playersSnap = await getDocs(query(collection(db, "players"), limit(500)));
  playersSnap.forEach((d) => batch.delete(d.ref));
}

// Opens the session so players can join the lobby.
// Wipes leftover players + resets playerCount; players re-join with a fresh doc (totalScore: 0).
export async function openSession(): Promise<void> {
  const batch = writeBatch(db);
  await queueWipeAllPlayers(batch);
  batch.update(stateRef(), { status: "waiting", playerCount: 0 });
  await batch.commit();
}

// Starts (or resumes) the game: picks the oldest ready round.
// Throws if no ready round exists.
export async function startGameSession(): Promise<void> {
  const q = query(
    collection(db, "rounds"),
    where("status", "==", "ready"),
    orderBy("createdAt", "asc"),
    limit(1),
  );
  const snap = await getDocs(q);
  if (snap.empty) throw new Error("Không có game nào trong kho. Tạo thêm game.");

  const firstRound = snap.docs[0];
  const batch = writeBatch(db);
  batch.update(stateRef(), {
    status: "playing",
    currentRoundId: firstRound.id,
    startedAt: serverTimestamp(),
  });
  batch.update(firstRound.ref, { status: "playing", startedAt: serverTimestamp() });
  await batch.commit();
}

// Ends the current round: marks it completed, records to historyGames, clears currentRoundId.
// Room stays "playing" — between-rounds summary shown until admin starts next round.
export async function endCurrentRound(roundId: string): Promise<void> {
  const batch = writeBatch(db);
  batch.update(doc(db, "rounds", roundId), { status: "completed", endedAt: serverTimestamp() });
  batch.update(stateRef(), { currentRoundId: deleteField() });
  await batch.commit();
}

// Closes the entire session (sets to ended → triggers podium for all clients).
export async function closeSession(): Promise<void> {
  await updateDoc(stateRef(), { status: "ended", endedAt: serverTimestamp() });
}

// Resets session back to idle so a new session can be started.
// Wipes players too (spec §15.2 — totalScore must reset on replay, not bleed across sessions).
export async function resetSession(): Promise<void> {
  const batch = writeBatch(db);
  await queueWipeAllPlayers(batch);
  batch.update(stateRef(), {
    status: "idle",
    currentRoundId: deleteField(),
    playerCount: 0,
  });
  await batch.commit();
}

export async function getGameState(): Promise<GameState | null> {
  const snap = await getDoc(stateRef());
  return snap.exists() ? (snap.data() as GameState) : null;
}

export function subscribeToGameState(callback: (state: GameState | null) => void) {
  return onSnapshot(stateRef(), (snap) => {
    callback(snap.exists() ? (snap.data() as GameState) : null);
  });
}

// Real-time game library: all rounds sorted oldest first.
export function subscribeToGameLibrary(callback: (rounds: Round[]) => void) {
  const q = query(collection(db, "rounds"), orderBy("createdAt", "asc"));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ ...d.data(), roundId: d.id }) as Round));
  });
}
