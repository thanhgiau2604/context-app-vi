import { motion } from "motion/react";
import { Link } from "@tanstack/react-router";
import { Trophy, Medal, Award } from "lucide-react";
import { usePlayersListener } from "@/hooks/use-players-realtime-listener";
import { useGameStore } from "@/stores/game-session-store";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/tailwind-class-merge-utils";

// Per-rank styling (index = final rank: 0=1st, 1=2nd, 2=3rd).
const RANK_STYLE = [
  {
    Icon: Trophy,
    color: "text-yellow-400",
    height: "h-32",
    step: "bg-yellow-400/20 border-yellow-400/40",
  },
  {
    Icon: Medal,
    color: "text-slate-300",
    height: "h-24",
    step: "bg-slate-300/15 border-slate-300/40",
  },
  {
    Icon: Award,
    color: "text-amber-600",
    height: "h-20",
    step: "bg-amber-600/15 border-amber-600/40",
  },
];

// Visual left→right order of podium steps for a given player count (centre = winner).
const DISPLAY_ORDER: Record<number, number[]> = {
  1: [0],
  2: [1, 0],
  3: [1, 0, 2],
};

export function FinalGamePodiumPage() {
  const { isAdmin } = useGameStore();
  const players = usePlayersListener();
  const sorted = [...players].sort((a, b) => b.totalScore - a.totalScore);

  const podiumCount = Math.min(3, sorted.length);
  const order = DISPLAY_ORDER[podiumCount] ?? [];

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 p-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center gap-2"
      >
        <Trophy size={44} className="text-yellow-400" aria-hidden="true" />
        <h1 className="text-3xl font-bold text-gradient-brand">Kết thúc!</h1>
      </motion.div>

      <div className="flex items-end justify-center gap-4">
        {order.map((rankIdx, displayIdx) => {
          const player = sorted[rankIdx];
          const style = RANK_STYLE[rankIdx];
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
              <div
                className={cn(
                  "flex w-24 items-center justify-center rounded-t-lg border",
                  style.height,
                  style.step,
                  rankIdx === 0 && "game-glow",
                )}
              >
                <span className={cn("text-3xl font-bold", style.color)}>#{rankIdx + 1}</span>
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
              <span className="flex-1 truncate font-medium">{p.name}</span>
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
