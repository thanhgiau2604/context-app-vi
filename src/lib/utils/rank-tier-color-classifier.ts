// Maps guess rank to display tier used for color-coding in guess history and badges
export type RankTier = "exact" | "ultra" | "hot" | "warm" | "close" | "cool" | "far" | "unknown";

export function getRankTier(rank: number | null): RankTier {
  if (rank === null) return "unknown";
  if (rank === 1) return "exact";
  if (rank <= 10) return "ultra";
  if (rank <= 50) return "hot";
  if (rank <= 100) return "warm";
  if (rank <= 300) return "close";
  return "cool"; // rank 301–500 (corpus max = 500)
}

// Tailwind classes using CSS token vars defined in src/index.css
export const rankTierColorClass: Record<RankTier, string> = {
  exact: "text-rank-exact bg-rank-exact/15 border-rank-exact/40",
  ultra: "text-rank-ultra bg-rank-ultra/15 border-rank-ultra/40",
  hot: "text-rank-hot bg-rank-hot/15 border-rank-hot/40",
  warm: "text-rank-warm bg-rank-warm/15 border-rank-warm/40",
  close: "text-rank-close bg-rank-close/15 border-rank-close/40",
  cool: "text-rank-cool bg-rank-cool/15 border-rank-cool/40",
  far: "text-rank-far bg-rank-far/15 border-rank-far/40",
  unknown: "text-muted-foreground bg-muted/30 border-muted/30",
};

// Solid-ish fill color for the Contexto-style proximity bar (guess history).
// Hotter tiers = more opaque/vivid so closer guesses read as "warmer" at a glance.
export const rankTierBarClass: Record<RankTier, string> = {
  exact: "bg-rank-exact/85",
  ultra: "bg-rank-ultra/75",
  hot: "bg-rank-hot/65",
  warm: "bg-rank-warm/55",
  close: "bg-rank-close/50",
  cool: "bg-rank-cool/45",
  far: "bg-rank-far/40",
  unknown: "bg-muted/40",
};

export function getRankLabel(rank: number | null): string {
  const tier = getRankTier(rank);
  switch (tier) {
    case "exact":
      return "Chính xác!";
    case "ultra":
      return "Siêu gần";
    case "hot":
      return "Rất nóng";
    case "warm":
      return "Ấm";
    case "close":
      return "Gần";
    case "cool":
      return "Hơi xa";
    case "far":
      return "Xa";
    case "unknown":
      return "Không có";
  }
}
