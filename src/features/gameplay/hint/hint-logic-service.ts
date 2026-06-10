import type { RoundTerm } from "@/types/game-firestore-types";

const HINT_PENALTIES = [25, 45, 70]; // hint 1, 2, 3

export type HintResult = {
  term: string;
  rank: number;
  penalty: number;
  hintIndex: number;
};

export type HintBlockReason =
  | "not-guessed-yet"
  | "too-close"
  | "no-hints-left"
  | "round-not-playing";

export function getHintBlockReason(
  bestRank: number | null,
  usedHints: number,
  roundStatus: string,
): HintBlockReason | null {
  if (roundStatus !== "playing") return "round-not-playing";
  if (bestRank === null) return "not-guessed-yet";
  if (bestRank <= 2) return "too-close";
  if (usedHints >= 3) return "no-hints-left";
  return null;
}

export function getHintBlockMessage(reason: HintBlockReason): string {
  switch (reason) {
    case "not-guessed-yet":
      return "Hãy đoán ít nhất một từ trước khi dùng gợi ý.";
    case "too-close":
      return "Bạn đã rất gần đáp án — không thể mở thêm gợi ý!";
    case "no-hints-left":
      return "Bạn đã dùng hết 3 lượt gợi ý.";
    case "round-not-playing":
      return "Round chưa bắt đầu hoặc đã kết thúc.";
  }
}

// Pure in-memory hint resolution — no Firestore reads.
// Picks a random term 1–5 positions better than bestRank (never reveals keyword at rank 1).
export function resolveHint(
  roundTerms: RoundTerm[],
  bestRank: number,
  usedHints: number,
): HintResult | null {
  // maxStep ensures targetRank stays ≥ 2 (never reveals keyword)
  const maxStep = Math.min(5, bestRank - 2);
  if (maxStep < 1) return null;

  const step = Math.floor(Math.random() * maxStep) + 1;
  const targetRank = bestRank - step;

  const entry = roundTerms.find((t) => t.rank === targetRank);
  if (!entry) return null;

  return {
    term: entry.term,
    rank: entry.rank,
    penalty: HINT_PENALTIES[usedHints] ?? 0,
    hintIndex: usedHints + 1,
  };
}
