import { AnimatePresence, motion } from "motion/react";
import { Flag, Trophy, Loader2 } from "lucide-react";
import { usePublicResultsRealtime } from "@/hooks/use-public-results-realtime-listener";
import { useLiveRoundProgress } from "@/lib/firestore/live-round-progress-firestore-repository";
import { RankBadge } from "@/components/ui/rank-display-badge";
import { cn } from "@/lib/tailwind-class-merge-utils";

type Props = { roundId: string; activePlayers: number };

function sortResults(results: ReturnType<typeof usePublicResultsRealtime>) {
  return [...results].sort((a, b) => {
    if (a.status === "solved" && b.status !== "solved") return -1;
    if (b.status === "solved" && a.status !== "solved") return 1;
    if (a.status === "solved") return a.finishOrder - b.finishOrder;
    const ar = a.bestRank ?? Infinity,
      br = b.bestRank ?? Infinity;
    return ar - br;
  });
}

export function RealtimeRoundResultsBoard({ roundId, activePlayers }: Props) {
  const results = usePublicResultsRealtime(roundId);
  const liveProgress = useLiveRoundProgress(roundId);
  const sorted = sortResults(results);

  // In-progress players: have a live rank but haven't finished yet. Show their best
  // rank live (no guess word — spec §9), sorted closest-first.
  const finishedUids = new Set(results.map((r) => r.uid));
  const inProgress = liveProgress
    .filter((p) => !finishedUids.has(p.uid))
    .sort((a, b) => (b.liveScore ?? 0) - (a.liveScore ?? 0) || a.bestRank - b.bestRank);
  const stillWaiting = activePlayers - results.length;

  return (
    <div className="flex flex-col gap-2 game-card p-4" aria-live="polite">
      <div className="flex items-center justify-between">
        <span className="text-base font-semibold text-gradient-brand">Kết quả round</span>
        {stillWaiting > 0 && (
          <span className="text-xs text-muted-foreground">Còn {stillWaiting} người đang chơi</span>
        )}
      </div>

      {sorted.length === 0 && inProgress.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-2">Chưa có ai đoán.</p>
      )}

      <AnimatePresence initial={false}>
        {sorted.map((r, i) => (
          <motion.div
            key={r.uid}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25, delay: i * 0.04 }}
            className={cn(
              "flex items-center gap-3 rounded-lg border px-3 py-2 text-sm",
              r.status === "solved"
                ? "border-green-500/30 bg-green-500/10 text-green-400"
                : "border-border bg-muted/10 text-muted-foreground",
            )}
          >
            {r.status === "solved" ? (
              <Trophy size={14} className="shrink-0" aria-hidden="true" />
            ) : (
              <Flag size={14} className="shrink-0" aria-hidden="true" />
            )}
            <span className="flex-1 font-medium truncate">{r.name}</span>
            <RankBadge rank={r.bestRank} size="sm" />
            <span className="font-mono text-xs">+{r.roundScore}đ</span>
          </motion.div>
        ))}

        {inProgress.map((p) => (
          <motion.div
            key={`live-${p.uid}`}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25 }}
            className="flex items-center gap-3 rounded-lg border border-border bg-muted/5 px-3 py-2 text-sm text-muted-foreground"
          >
            <Loader2 size={14} className="shrink-0 animate-spin opacity-60" aria-hidden="true" />
            <span className="flex-1 font-medium truncate">{p.name}</span>
            <RankBadge rank={p.bestRank} size="sm" />
            <span className="font-mono text-xs tabular-nums">~{p.liveScore ?? 0}đ</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
