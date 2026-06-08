// Scoring formula:
// base (by bestRank) + solvedBonus + speedBonus + nearMissBonus
//   - guessPenalty - hintPenalty - surrenderPenalty

const HINT_PENALTIES = [25, 45, 70];

function getBaseScore(bestRank: number | null): number {
  if (!bestRank) return 0;
  if (bestRank === 1) return 1000;
  if (bestRank <= 3) return 750;
  if (bestRank <= 10) return 500;
  if (bestRank <= 50) return 250;
  if (bestRank <= 100) return 120;
  if (bestRank <= 300) return 40;
  if (bestRank <= 500) return 10;
  return 0;
}

function getSpeedBonus(status: "solved" | "surrendered", durationSec: number): number {
  if (status !== "solved") return 0;
  // Up to +200 pts, decreases by 1.5 pts/sec — gone after ~2 min 13s
  return Math.max(0, 200 - Math.floor(durationSec * 1.5));
}

export function calculateRoundScore(params: {
  status: "solved" | "surrendered";
  bestRank: number | null;
  durationSec: number;
  guessCount: number;
  usedHints: number;
  // Small +50 bonus when first near-miss (rank ≤ 50) achieved within 60s — only for non-solved
  firstNearMissWithin60s?: boolean;
}): number {
  const base = getBaseScore(params.bestRank);
  const solvedBonus = params.status === "solved" ? 300 : 0;
  const speedBonus = getSpeedBonus(params.status, params.durationSec);
  // Near-miss bonus only meaningful for surrendered players (solved already earns full base+bonus)
  const nearMissBonus = params.firstNearMissWithin60s && params.status !== "solved" ? 50 : 0;
  const guessPenalty = Math.min(params.guessCount * 3, 120);
  const hintPenalty = Array.from(
    { length: params.usedHints },
    (_, i) => HINT_PENALTIES[i] ?? 0,
  ).reduce((a, b) => a + b, 0);
  const surrenderPenalty = params.status === "surrendered" ? 80 : 0;

  return Math.max(
    0,
    base + solvedBonus + speedBonus + nearMissBonus - guessPenalty - hintPenalty - surrenderPenalty,
  );
}
