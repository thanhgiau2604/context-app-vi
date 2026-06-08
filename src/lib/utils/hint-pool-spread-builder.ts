// Selects ~19 representative terms from relatedTerms spread across the rank spectrum
// so dynamic hints can always find a nearby term regardless of player's bestRank.
// targetRank is used as the Firestore doc key (zero-padded) for O(1) getDoc lookups
// that satisfy security rules (list is blocked, get is allowed).
// Covers rank 2–500 (corpus reduced to 500 related terms)
export const HINT_POOL_RANKS = [
  2, 3, 5, 7, 10, 15, 20, 30, 40, 50, 70, 100, 150, 200, 300, 400, 500,
];

type RelatedTerm = { term: string; rank: number };

export type HintPoolBuiltEntry = {
  term: string;
  rank: number; // actual rank of the term in the corpus
  targetRank: number; // HINT_POOL_RANKS slot — used as Firestore doc key
};

export function buildHintPool(relatedTerms: RelatedTerm[]): HintPoolBuiltEntry[] {
  const termsByRank = new Map(relatedTerms.map((t) => [t.rank, t]));
  const pool: HintPoolBuiltEntry[] = [];

  for (const targetRank of HINT_POOL_RANKS) {
    let closest: RelatedTerm | null = null;
    let minDiff = Infinity;
    for (const [rank, term] of termsByRank) {
      const diff = Math.abs(rank - targetRank);
      if (diff < minDiff) {
        minDiff = diff;
        closest = term;
      }
    }
    if (closest) pool.push({ term: closest.term, rank: closest.rank, targetRank });
  }

  return pool;
}
