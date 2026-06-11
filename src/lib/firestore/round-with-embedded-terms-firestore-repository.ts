import { db } from "@/lib/firebase-app-init";
import {
  doc,
  writeBatch,
  serverTimestamp,
  updateDoc,
  getDoc,
  getDocs,
  collection,
} from "firebase/firestore";
import { nanoid } from "nanoid";
import type { Round, RoundSecret, RoundTerm } from "@/types/game-firestore-types";

type CreateRoundPayload = {
  adminUid: string;
  roundSalt: string;
  keywordHash: string;
  terms: RoundTerm[]; // 500 related terms (rank 2+), stored for client-side lookup
  keyword: string;
  normalizedKeyword: string;
};

// Creates round doc (with embedded terms) + private/secret subcollection in a batch.
// Round starts as "draft" — caller must call updateRoundStatus("ready") after.
export async function createRound(payload: CreateRoundPayload): Promise<string> {
  const roundId = nanoid(10);
  const existing = await getDocs(collection(db, "rounds"));
  const roundNumber = existing.size + 1;

  const batch = writeBatch(db);

  batch.set(doc(db, "rounds", roundId), {
    roundId,
    status: "draft",
    roundNumber,
    roundSalt: payload.roundSalt,
    keywordHash: payload.keywordHash,
    termCount: payload.terms.length,
    terms: payload.terms,
    createdBy: payload.adminUid,
    createdAt: serverTimestamp(),
  } satisfies Omit<Round, "createdAt"> & { createdAt: unknown });

  batch.set(doc(db, "rounds", roundId, "private", "secret"), {
    keyword: payload.keyword,
    normalizedKeyword: payload.normalizedKeyword,
  } satisfies RoundSecret);

  await batch.commit();
  return roundId;
}

export async function updateRoundStatus(roundId: string, status: Round["status"]): Promise<void> {
  await updateDoc(doc(db, "rounds", roundId), { status });
}

// Queues deletes for a round's per-player progress subcollections (playerRounds,
// publicResults, liveProgress) onto the given batch. Run when (re)starting a round so a
// replayed round begins clean — otherwise stale "finished" publicResults make the
// auto-end hook end the round instantly. Keeps private/secret (keyword) + the round doc.
export async function queueWipeRoundProgress(
  batch: ReturnType<typeof writeBatch>,
  roundId: string,
): Promise<void> {
  const subcollections = ["playerRounds", "publicResults", "liveProgress"];
  for (const sub of subcollections) {
    const snap = await getDocs(collection(db, "rounds", roundId, sub));
    snap.forEach((d) => batch.delete(d.ref));
  }
}

// Permanently deletes a round: round doc + private/secret + all per-player progress
// subcollections (playerRounds, publicResults, liveProgress). Irreversible.
export async function deleteRound(roundId: string): Promise<void> {
  const batch = writeBatch(db);
  await queueWipeRoundProgress(batch, roundId);
  batch.delete(doc(db, "rounds", roundId, "private", "secret"));
  batch.delete(doc(db, "rounds", roundId));
  await batch.commit();
}

// Returns terms + keywordHash + roundSalt needed for client-side guess lookup.
export async function getRoundData(
  roundId: string,
): Promise<{ terms: RoundTerm[]; keywordHash: string; roundSalt: string } | null> {
  const snap = await getDoc(doc(db, "rounds", roundId));
  if (!snap.exists()) return null;
  const data = snap.data() as Round;
  return { terms: data.terms, keywordHash: data.keywordHash, roundSalt: data.roundSalt };
}

// Reads keyword from private/secret — accessible after player finishes or round is completed.
export async function getRoundKeyword(roundId: string): Promise<string | null> {
  const snap = await getDoc(doc(db, "rounds", roundId, "private", "secret"));
  return snap.exists() ? (snap.data() as { keyword: string }).keyword : null;
}
