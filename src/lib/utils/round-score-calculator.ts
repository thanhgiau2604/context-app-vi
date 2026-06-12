// Round scoring — spec §8.
//   solveScore     = max(MIN_SOLVE_SCORE, SOLVE_BASE - (guessCount-1)*GUESS_PENALTY)   // chỉ khi solved
//   timePenalty    = min(CAP, max(0, elapsedSec - GRACE) * PER_SEC)                     // chỉ khi solved
//   proximityBonus = CHỈ khi surrendered: bestRank ≤ THRESHOLD && trong cửa sổ ? (THRESHOLD - bestRank)*FACTOR : 0
//   hintPenalty    = Σ HINT_PENALTIES[0 .. usedHints-1]   // leo thang [10,20,30]
//   roundScore(solved)      = max(0, solveScore - timePenalty - hintPenalty)
//   roundScore(surrendered) = max(0, proximityBonus - hintPenalty)
// Lý do prox chỉ cho surrendered: người đã giải đều ở rank 1 nên prox vô nghĩa, và
// cờ near-miss-trong-60s là nhiễu — nó từng cho người đoán nhiều/chậm vượt người ít lượt.

import {
  SOLVE_BASE,
  GUESS_PENALTY,
  MIN_SOLVE_SCORE,
  TIME_GRACE_SEC,
  TIME_PENALTY_PER_SEC,
  TIME_PENALTY_CAP,
  PROX_THRESHOLD,
  PROX_FACTOR,
  HINT_PENALTIES,
} from "@/lib/config/scoring-config";

export function calculateRoundScore(params: {
  status: "solved" | "surrendered";
  bestRank: number | null;
  durationSec: number;
  guessCount: number;
  usedHints: number;
  // true khi bestRank ≤ PROX_THRESHOLD đạt được trong PROX_WINDOW_SEC đầu (client track) — cờ proximity-in-window
  firstNearMissWithin60s?: boolean;
}): number {
  const solved = params.status === "solved";

  const solveScore = solved
    ? Math.max(MIN_SOLVE_SCORE, SOLVE_BASE - (params.guessCount - 1) * GUESS_PENALTY)
    : 0;

  const timePenalty = solved
    ? Math.min(
        TIME_PENALTY_CAP,
        Math.max(0, params.durationSec - TIME_GRACE_SEC) * TIME_PENALTY_PER_SEC,
      )
    : 0;

  // Proximity bonus CHỈ cho người bỏ cuộc — an ủi vì đến gần. Người đã giải đều rank 1
  // nên prox không có ý nghĩa và từng phá thứ tự (đoán nhiều vẫn vượt nhờ +prox).
  const inWindow = params.firstNearMissWithin60s === true;
  const proximityBonus =
    !solved && inWindow && params.bestRank != null && params.bestRank <= PROX_THRESHOLD
      ? (PROX_THRESHOLD - params.bestRank) * PROX_FACTOR
      : 0;

  const hintPenalty = Array.from(
    { length: params.usedHints },
    (_, i) => HINT_PENALTIES[i] ?? 0,
  ).reduce((a, b) => a + b, 0);

  // Round to integer: durationSec is fractional (ms/1000) → fractional timePenalty.
  // Scores display as whole numbers (range up to ~1000). Single source of truth.
  return Math.round(Math.max(0, solveScore + proximityBonus - timePenalty - hintPenalty));
}
