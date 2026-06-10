import { normalizeVietnamese } from "@/lib/utils/normalize-vietnamese-text";
import { hashTerm } from "@/lib/utils/sha256-term-hash";
import type { LocalGuess, RoundTerm } from "@/types/game-firestore-types";

export type GuessResult = {
  rank: number | null;
  type: "keyword" | "related" | null;
  notFound: boolean;
  localGuess: LocalGuess;
};

// Pure local lookup — no Firestore reads per guess.
// terms[] and keywordHash are loaded once when the round starts (see use-round-data-loader hook).
export async function submitGuess(
  input: string,
  roundTerms: RoundTerm[],
  keywordHash: string,
  roundSalt: string,
): Promise<GuessResult> {
  const normalized = normalizeVietnamese(input);
  const baseGuess: LocalGuess = {
    text: input,
    normalizedText: normalized,
    rank: null,
    createdAt: Date.now(),
  };

  if (!normalized) return { rank: null, type: null, notFound: false, localGuess: baseGuess };

  // 1. Check against related terms array (rank 2+)
  const match = roundTerms.find((t) => t.normalized === normalized);
  if (match) {
    return {
      rank: match.rank,
      type: "related",
      notFound: false,
      localGuess: { ...baseGuess, rank: match.rank },
    };
  }

  // 2. Check if it's the keyword via hash comparison (keyword not in terms[])
  const guessHash = await hashTerm(roundSalt, normalized);
  if (guessHash === keywordHash) {
    return {
      rank: 1,
      type: "keyword",
      notFound: false,
      localGuess: { ...baseGuess, rank: 1 },
    };
  }

  // 3. Word not in the 500-word corpus — show as "quá xa"
  return {
    rank: null,
    type: null,
    notFound: true,
    localGuess: { ...baseGuess, notFound: true },
  };
}
