import { db } from "@/lib/firebase-app-init";
import { doc, setDoc, writeBatch, serverTimestamp, updateDoc, getDoc } from "firebase/firestore";
import { nanoid } from "nanoid";
import type { HintPoolBuiltEntry } from "@/lib/utils/hint-pool-spread-builder";
import type { Round, TermIndexDoc, HintPoolEntry, RoundSecret } from "@/types/game-firestore-types";

export async function createRound(roomId: string, createdBy: string): Promise<string> {
  const roundId = nanoid(10);
  const roundSalt = nanoid(16);
  await setDoc(doc(db, "rooms", roomId, "rounds", roundId), {
    roundId,
    status: "draft",
    roundNumber: 1,
    roundSalt,
    termCount: 0,
    createdBy,
    createdAt: serverTimestamp(),
  });
  return roundId;
}

export async function getRoundSalt(roomId: string, roundId: string): Promise<string> {
  const snap = await getDoc(doc(db, "rooms", roomId, "rounds", roundId));
  if (!snap.exists()) throw new Error("Round not found");
  return snap.data().roundSalt as string;
}

// Splits 1000+ termIndex entries into batches of 499 (Firestore batch limit = 500 ops)
export async function writeTermIndex(
  roomId: string,
  roundId: string,
  entries: Array<{ hash: string; rank: number; type: "keyword" | "related" }>,
) {
  const chunks = chunkArray(entries, 499);
  for (const chunk of chunks) {
    const batch = writeBatch(db);
    for (const entry of chunk) {
      const ref = doc(db, "rooms", roomId, "rounds", roundId, "termIndex", entry.hash);
      batch.set(ref, { rank: entry.rank, type: entry.type } satisfies TermIndexDoc);
    }
    await batch.commit();
  }
}

// Accepts HintPoolBuiltEntry[] from buildHintPool — keys by targetRank (not actual rank)
// so getHintForTargetRank can use getDoc with known HINT_POOL_RANKS keys (list is blocked by rules)
export async function writeHintPool(
  roomId: string,
  roundId: string,
  entries: HintPoolBuiltEntry[],
) {
  const batch = writeBatch(db);
  for (const entry of entries) {
    // Key = zero-padded targetRank slot; doc stores actual { rank, term }
    const rankKey = String(entry.targetRank).padStart(4, "0");
    const ref = doc(db, "rooms", roomId, "rounds", roundId, "hintPool", rankKey);
    batch.set(ref, { rank: entry.rank, term: entry.term } satisfies HintPoolEntry);
  }
  await batch.commit();
}

export async function writeRoundSecret(roomId: string, roundId: string, secret: RoundSecret) {
  await setDoc(doc(db, "rooms", roomId, "rounds", roundId, "private", "secret"), secret);
}

export async function updateRoundStatus(roomId: string, roundId: string, status: Round["status"]) {
  await updateDoc(doc(db, "rooms", roomId, "rounds", roundId), { status });
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
  return chunks;
}
