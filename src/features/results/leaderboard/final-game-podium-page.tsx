import { useEffect } from "react";
import { motion } from "motion/react";
import { Link } from "@tanstack/react-router";
import { Trophy } from "lucide-react";
import { Repeat2, Clock } from "lucide-react";
import { usePlayersListener } from "@/hooks/use-players-realtime-listener";
import { useLatestCompletedRoundResults } from "@/hooks/use-latest-completed-round-results";
import { useGameStore } from "@/stores/game-session-store";
import { MEDAL_STYLES } from "@/lib/utils/leaderboard-medal-style";
import { formatDurationMmSs } from "@/lib/utils/format-duration-mmss";
import { fireSolvedConfetti } from "@/features/gameplay/round/solved-confetti-burst-effect";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/tailwind-class-merge-utils";

// Visual left→right order of podium steps for a given player count (centre = winner).
const DISPLAY_ORDER: Record<number, number[]> = {
  1: [0],
  2: [1, 0],
  3: [1, 0, 2],
};

// Compact last-round stats (số lần đoán + thời gian) shown beside the cumulative score.
function RoundStatsLine({
  result,
}: {
  result: { guessCount: number; durationMs: number } | undefined;
}) {
  if (!result) return null;
  return (
    <span className="flex items-center gap-2 text-[11px] text-muted-foreground tabular-nums">
      <span className="inline-flex items-center gap-0.5">
        <Repeat2 size={11} aria-hidden="true" /> {result.guessCount} lượt
      </span>
      <span className="inline-flex items-center gap-0.5">
        <Clock size={11} aria-hidden="true" /> {formatDurationMmSs(result.durationMs / 1000)}
      </span>
    </span>
  );
}

export function FinalGamePodiumPage() {
  const { isAdmin } = useGameStore();
  const players = usePlayersListener();
  const roundResults = useLatestCompletedRoundResults();
  const sorted = [...players].sort((a, b) => b.totalScore - a.totalScore);

  const podiumCount = Math.min(3, sorted.length);
  const order = DISPLAY_ORDER[podiumCount] ?? [];

  // Celebrate the final result once on mount (DESIGN.md §15.5: confetti runs once).
  useEffect(() => {
    fireSolvedConfetti();
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 p-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center gap-2"
      >
        <Trophy size={44} className="text-rank-exact" aria-hidden="true" />
        <h1 className="font-display text-3xl font-bold text-gradient-brand">Kết thúc!</h1>
      </motion.div>

      <div className="flex items-end justify-center gap-4">
        {order.map((rankIdx, displayIdx) => {
          const player = sorted[rankIdx];
          const style = MEDAL_STYLES[rankIdx];
          return (
            <motion.div
              key={player.uid}
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: displayIdx * 0.3, type: "spring", stiffness: 200, damping: 18 }}
              className="flex flex-col items-center gap-2"
            >
              <style.Icon size={24} className={style.color} aria-hidden="true" />
              <span className="max-w-[96px] truncate text-center text-base font-semibold">
                {player.name}
              </span>
              <span className={cn("font-mono text-sm font-bold tabular-nums", style.color)}>
                {player.totalScore}đ
              </span>
              <RoundStatsLine result={roundResults.get(player.uid)} />
              <div
                className={cn(
                  "flex w-24 items-center justify-center rounded-t-lg border",
                  style.height,
                  style.step,
                  rankIdx === 0 && "game-glow shimmer-overlay",
                )}
              >
                <span className={cn("font-display text-3xl font-bold", style.color)}>
                  #{rankIdx + 1}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {sorted.length > 3 && (
        <div className="flex w-full max-w-sm flex-col gap-2">
          {sorted.slice(3).map((p, i) => (
            <div
              key={p.uid}
              className="flex items-center gap-3 rounded-lg border border-border bg-muted/10 px-3 py-2.5 text-sm"
            >
              <span className="w-6 font-mono font-bold text-muted-foreground">#{i + 4}</span>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate font-medium">{p.name}</span>
                <RoundStatsLine result={roundResults.get(p.uid)} />
              </div>
              <span className="font-mono font-bold tabular-nums text-foreground">
                {p.totalScore}đ
              </span>
            </div>
          ))}
        </div>
      )}

      {isAdmin && (
        <Button asChild>
          <Link to="/admin">Về Admin</Link>
        </Button>
      )}
    </div>
  );
}
