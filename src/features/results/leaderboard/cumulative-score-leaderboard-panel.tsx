import { motion } from "motion/react";
import { usePlayersListener } from "@/hooks/use-players-realtime-listener";
import { cn } from "@/lib/tailwind-class-merge-utils";

export function CumulativeScoreLeaderboardPanel() {
  const players = usePlayersListener();
  const sorted = [...players].sort((a, b) => b.totalScore - a.totalScore);
  const maxScore = sorted[0]?.totalScore || 1;

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border bg-muted/10 p-4">
      <span className="text-sm font-medium">Bảng điểm tổng</span>

      {sorted.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-2">Chưa có điểm.</p>
      )}

      {sorted.map((p, i) => (
        <div key={p.uid} className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-sm">
            <span
              className={cn(
                "w-5 text-center font-bold",
                i === 0 && "text-yellow-400",
                i === 1 && "text-slate-300",
                i === 2 && "text-amber-600",
              )}
            >
              #{i + 1}
            </span>
            <span className="flex-1 truncate">{p.name}</span>
            <span className="font-mono text-xs text-muted-foreground">{p.totalScore}đ</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-muted/30 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-primary"
              animate={{ width: `${(p.totalScore / maxScore) * 100}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
