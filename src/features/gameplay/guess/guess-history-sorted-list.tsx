import { AnimatePresence, motion } from "motion/react";
import { getRankTier, rankTierColorClass } from "@/lib/utils/rank-tier-color-classifier";
import { RankBadge } from "@/components/ui/rank-display-badge";
import { useGameStore } from "@/stores/game-session-store";
import { cn } from "@/lib/tailwind-class-merge-utils";

export function GuessHistorySortedList() {
  const { localGuesses } = useGameStore();

  // Sort: known rank ascending first, unknown last
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
          // notFound words render with "far" tier styling; ranked words use their tier
          const tier = guess.notFound ? "far" : getRankTier(guess.rank);
          return (
            <motion.div
              key={guess.createdAt}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className={cn(
                "flex items-center gap-3 rounded-lg border px-4 py-2",
                rankTierColorClass[tier],
              )}
            >
              <RankBadge rank={guess.rank} notFound={guess.notFound} size="sm" />
              <span className="flex-1 font-medium">{guess.text}</span>
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
