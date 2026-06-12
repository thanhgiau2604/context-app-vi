import { AnimatePresence, motion } from "motion/react";
import { getRankTier, rankTierBarClass } from "@/lib/utils/rank-tier-color-classifier";
import { useGameStore } from "@/stores/game-session-store";
import { cn } from "@/lib/tailwind-class-merge-utils";

// Corpus max rank (500 related terms + keyword). Drives proximity-bar width.
const CORPUS_MAX = 500;

// Contexto-style proximity bar: closer guess = wider fill. Log curve spreads the
// huge rank range so mid-ranks stay visible (rank 1 = full, rank 500 ≈ sliver).
function proximityWidthPercent(rank: number): number {
  if (rank <= 1) return 100;
  const pct = 100 * (1 - Math.log(rank) / Math.log(CORPUS_MAX + 1));
  return Math.max(6, Math.min(100, pct));
}

export function GuessHistorySortedList() {
  const { localGuesses, bestRank } = useGameStore();

  // Sort: known rank ascending first, unknown (not-found) last
  const sorted = [...localGuesses].sort((a, b) => {
    if (a.rank === null && b.rank === null) return 0;
    if (a.rank === null) return 1;
    if (b.rank === null) return -1;
    return a.rank - b.rank;
  });

  return (
    <div className="flex flex-col gap-1.5 overflow-y-auto">
      <AnimatePresence initial={false}>
        {sorted.map((guess) => {
          // notFound words render as the dimmest "far" tier with a minimal sliver.
          const tier = guess.notFound ? "far" : getRankTier(guess.rank);
          const isBest = guess.rank !== null && guess.rank === bestRank;
          const widthPct = guess.notFound ? 4 : proximityWidthPercent(guess.rank!);

          return (
            <motion.div
              key={guess.createdAt}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className={cn(
                "relative flex items-center justify-between overflow-hidden rounded-lg px-4 py-2.5",
                "border bg-muted/10",
                // Current best row gets a bright outline + glow, like the highlighted
                // top row in classic Contexto.
                isBest ? "border-2 border-primary/70 game-glow" : "border-white/10",
                isBest && "glow-pulse-once",
              )}
            >
              {/* Proximity fill — width encodes closeness, color encodes tier. */}
              <div
                className={cn(
                  "absolute inset-y-0 left-0 rounded-lg transition-[width] duration-300",
                  rankTierBarClass[tier],
                )}
                style={{ width: `${widthPct}%` }}
                aria-hidden="true"
              />
              <span className="relative z-10 truncate font-medium">{guess.text}</span>
              <span className="relative z-10 ml-3 font-mono text-sm font-bold tabular-nums">
                {guess.notFound ? "—" : guess.rank}
              </span>
            </motion.div>
          );
        })}
      </AnimatePresence>
      {sorted.length === 0 && (
        <p className="text-center text-sm text-muted-foreground py-8">
          Nhập từ đầu tiên để bắt đầu!
        </p>
      )}
    </div>
  );
}
