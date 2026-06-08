import { normalizeVietnamese } from "@/lib/utils/normalize-vietnamese-text";
import { hashTerm } from "@/lib/utils/sha256-term-hash";
import { lookupTermHash } from "@/lib/firestore/term-index-hash-lookup-service";
import type { LocalGuess } from "@/types/game-firestore-types";

export type GuessResult = {
  rank: number | null;
  type: "keyword" | "related" | null;
  notFound: boolean;
  localGuess: LocalGuess;
};

export async function submitGuess(
  input: string,
  roundSalt: string,
  roomId: string,
  roundId: string,
): Promise<GuessResult> {
  const normalized = normalizeVietnamese(input);
  const baseGuess: LocalGuess = {
    text: input,
    normalizedText: normalized,
    rank: null,
    createdAt: Date.now(),
  };

  if (!normalized) return { rank: null, type: null, notFound: false, localGuess: baseGuess };

  const hash = await hashTerm(roundSalt, normalized);
  const result = await lookupTermHash(roomId, roundId, hash);

  return {
    rank: result?.rank ?? null,
    type: result?.type ?? null,
    notFound: result === null,
    localGuess: { ...baseGuess, rank: result?.rank ?? null },
  };
}
