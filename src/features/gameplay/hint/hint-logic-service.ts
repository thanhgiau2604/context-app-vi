import type { RoundTerm } from "@/types/game-firestore-types";
import { HINT_PENALTIES } from "@/lib/config/scoring-config";

export type HintResult = {
  term: string;
  rank: number;
  penalty: number;
  hintIndex: number;
};

export type HintBlockReason = "too-close" | "no-hints-left" | "round-not-playing";

// Hints can be flipped at any time — no need to have guessed a related word first.
export function getHintBlockReason(
  bestRank: number | null,
  usedHints: number,
  roundStatus: string,
): HintBlockReason | null {
  if (roundStatus !== "playing") return "round-not-playing";
  // Guard the null case explicitly: `null <= 2` coerces to true in JS.
  if (bestRank !== null && bestRank <= 2) return "too-close";
  if (usedHints >= 3) return "no-hints-left";
  return null;
}

export function getHintBlockMessage(reason: HintBlockReason): string {
  switch (reason) {
    case "too-close":
      return "Bạn đã rất gần đáp án — không thể mở thêm gợi ý!";
    case "no-hints-left":
      return "Bạn đã dùng hết 3 lượt gợi ý.";
    case "round-not-playing":
      return "Round chưa bắt đầu hoặc đã kết thúc.";
  }
}

// Pure in-memory hint resolution — no Firestore reads.
// Reveals a term closer than the player's best (never the keyword at rank 1), and
// never re-reveals a rank already shown by a previous hint (`revealedRanks`).
// With no guesses yet (bestRank null), seeds from the corpus floor (max rank + 1).
export function resolveHint(
  roundTerms: RoundTerm[],
  bestRank: number | null,
  usedHints: number,
  revealedRanks: Set<number>,
): HintResult | null {
  const maxRank = roundTerms.reduce((m, t) => Math.max(m, t.rank), 1);
  const effectiveBest = bestRank ?? maxRank + 1;

  // maxStep keeps targetRank ≥ 2 (never reveals the keyword at rank 1).
  const maxStep = Math.min(5, effectiveBest - 2);
  if (maxStep < 1) return null;

  // Preferred window: 1–5 ranks closer than best, term exists, not already revealed.
  const windowCandidates: RoundTerm[] = [];
  for (let step = 1; step <= maxStep; step++) {
    const r = effectiveBest - step;
    if (revealedRanks.has(r)) continue;
    const entry = roundTerms.find((t) => t.rank === r);
    if (entry) windowCandidates.push(entry);
  }

  // Fallback (window fully revealed): any unrevealed term closer than best, rank ≥ 2.
  const candidates =
    windowCandidates.length > 0
      ? windowCandidates
      : roundTerms.filter(
          (t) => t.rank >= 2 && t.rank < effectiveBest && !revealedRanks.has(t.rank),
        );

  if (candidates.length === 0) return null;

  const entry = candidates[Math.floor(Math.random() * candidates.length)];
  return {
    term: entry.term,
    rank: entry.rank,
    penalty: HINT_PENALTIES[usedHints] ?? 0,
    hintIndex: usedHints + 1,
  };
}
