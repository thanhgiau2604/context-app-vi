import { Trophy, Medal, Award } from "lucide-react";

// Shared top-3 medal styling using semantic game tokens (DESIGN.md §11.2):
// rank 1 → rank-exact (gold), rank 2 → accent (cyan), rank 3 → primary (violet).
// Index = final rank (0=1st, 1=2nd, 2=3rd). rank ≥4 → no medal (caller falls back to "#n").
export const MEDAL_STYLES = [
  {
    Icon: Trophy,
    color: "text-rank-exact",
    ring: "border-rank-exact/40 bg-rank-exact/10",
    step: "border-rank-exact/40 bg-rank-exact/15",
    height: "h-32",
  },
  {
    Icon: Medal,
    color: "text-accent",
    ring: "border-accent/40 bg-accent/10",
    step: "border-accent/40 bg-accent/15",
    height: "h-24",
  },
  {
    Icon: Award,
    color: "text-primary",
    ring: "border-primary/40 bg-primary/10",
    step: "border-primary/40 bg-primary/15",
    height: "h-20",
  },
] as const;

export type MedalStyle = (typeof MEDAL_STYLES)[number];
