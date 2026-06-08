// Selects ~19 representative terms from relatedTerms spread across the rank spectrum
// so dynamic hints can always find a nearby term regardless of player's bestRank
const HINT_POOL_RANKS = [2, 3, 5, 7, 10, 15, 20, 30, 40, 50, 70, 100, 150, 200, 300, 400, 500, 700, 1000]

type RelatedTerm = { term: string; rank: number }

export function buildHintPool(relatedTerms: RelatedTerm[]): RelatedTerm[] {
  const termsByRank = new Map(relatedTerms.map((t) => [t.rank, t]))
  const pool: RelatedTerm[] = []

  for (const targetRank of HINT_POOL_RANKS) {
    let closest: RelatedTerm | null = null
    let minDiff = Infinity
    for (const [rank, term] of termsByRank) {
      const diff = Math.abs(rank - targetRank)
      if (diff < minDiff) {
        minDiff = diff
        closest = term
      }
    }
    if (closest) pool.push(closest)
  }

  return pool
}
