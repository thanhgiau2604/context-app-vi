import { motion } from "motion/react";
import { usePlayersListener } from "@/hooks/use-players-realtime-listener";
import { MEDAL_STYLES } from "@/lib/utils/leaderboard-medal-style";
import { cn } from "@/lib/tailwind-class-merge-utils";

export function CumulativeScoreLeaderboardPanel() {
  const players = usePlayersListener();
  // Render exactly one row per existing player — no fixed slot count.
  const sorted = [...players].sort((a, b) => b.totalScore - a.totalScore);

  return (
    <div className="hud-corners flex flex-col gap-2 game-card p-4">
      <span className="font-display text-base font-semibold text-gradient-brand">
        Bảng điểm tổng
      </span>

      {sorted.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-3">Chưa có điểm.</p>
      )}

      <div className="flex flex-col gap-1.5">
        {sorted.map((p, i) => {
          const medal = MEDAL_STYLES[i];
          return (
            <motion.div
              key={p.uid}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: i * 0.04 }}
              className={cn(
                "flex items-center gap-3 rounded-lg border px-3 py-2.5",
                medal ? medal.ring : "border-border bg-muted/10",
                i === 0 && "game-glow shimmer-overlay",
              )}
            >
              <span className="flex w-7 shrink-0 items-center justify-center">
                {medal ? (
                  <medal.Icon size={20} className={medal.color} aria-hidden="true" />
                ) : (
                  <span className="font-mono text-sm font-bold text-muted-foreground">
                    #{i + 1}
                  </span>
                )}
              </span>
              <span className="flex-1 truncate text-base font-semibold">{p.name}</span>
              <span
                className={cn(
                  "font-mono text-lg font-bold tabular-nums",
                  medal ? medal.color : "text-foreground",
                )}
              >
                {p.totalScore}
                <span className="ml-0.5 text-xs font-normal text-muted-foreground">đ</span>
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
