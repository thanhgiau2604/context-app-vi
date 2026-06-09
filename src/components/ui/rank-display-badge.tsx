import { getRankTier, rankTierColorClass } from "@/lib/utils/rank-tier-color-classifier";
import { cn } from "@/lib/tailwind-class-merge-utils";

type Props = { rank: number | null; size?: "sm" | "md" | "lg"; notFound?: boolean };

export function RankBadge({ rank, size = "md", notFound }: Props) {
  // notFound words use "far" tier styling — visually distinct from unknown ("???")
  const tier = notFound ? "far" : getRankTier(rank);
  const label = notFound ? "quá xa" : rank === null ? "???" : `#${rank}`;
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-md font-mono font-bold border tabular-nums",
        size === "sm" && "px-1.5 py-0.5 text-xs",
        size === "md" && "px-2 py-1 text-sm",
        size === "lg" && "px-3 py-1.5 text-base",
        rankTierColorClass[tier],
      )}
    >
      {label}
    </span>
  );
}
