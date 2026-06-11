import { AnimatePresence, motion } from "motion/react";
import { Flag, Trophy, Loader2, Repeat2, Clock } from "lucide-react";
import { usePublicResultsRealtime } from "@/hooks/use-public-results-realtime-listener";
import { useLiveRoundProgress } from "@/lib/firestore/live-round-progress-firestore-repository";
import { RankBadge } from "@/components/ui/rank-display-badge";
import { formatDurationMmSs } from "@/lib/utils/format-duration-mmss";
import { cn } from "@/lib/tailwind-class-merge-utils";

type Props = { roundId: string; activePlayers: number };

type PublicResult = ReturnType<typeof usePublicResultsRealtime>[number];

function sortResults(results: PublicResult[]) {
  return [...results].sort((a, b) => {
    if (a.status === "solved" && b.status !== "solved") return -1;
    if (b.status === "solved" && a.status !== "solved") return 1;
    if (a.status === "solved") return a.finishOrder - b.finishOrder;
    const ar = a.bestRank ?? Infinity,
      br = b.bestRank ?? Infinity;
    return ar - br;
  });
}

// Two results share the same standing (Hạng) when they are equal under the sort order.
function sameStanding(a: PublicResult, b: PublicResult): boolean {
  const aSolved = a.status === "solved";
  const bSolved = b.status === "solved";
  if (aSolved !== bSolved) return false;
  if (aSolved) return a.finishOrder === b.finishOrder;
  return (a.bestRank ?? Infinity) === (b.bestRank ?? Infinity);
}

// Standard competition ranking ("1224"): equal entries share a number, the next distinct
// entry skips ahead by the count of tied entries above it.
function assignStandings(sorted: PublicResult[]): Array<PublicResult & { place: number }> {
  let place = 0;
  return sorted.map((r, i) => {
    if (i === 0 || !sameStanding(sorted[i - 1], r)) place = i + 1;
    return { ...r, place };
  });
}

export function RealtimeRoundResultsBoard({ roundId, activePlayers }: Props) {
  const results = usePublicResultsRealtime(roundId);
  const liveProgress = useLiveRoundProgress(roundId);
  const ranked = assignStandings(sortResults(results));

  // In-progress players: have a live rank but haven't finished yet. Show their best
  // rank live (no guess word — spec §9), sorted closest-first.
  const finishedUids = new Set(results.map((r) => r.uid));
  const inProgress = liveProgress
    .filter((p) => !finishedUids.has(p.uid))
    .sort((a, b) => (b.liveScore ?? 0) - (a.liveScore ?? 0) || a.bestRank - b.bestRank);
  const stillWaiting = activePlayers - results.length;

  return (
    <div className="hud-corners flex flex-col gap-2 game-card p-4" aria-live="polite">
      <div className="flex items-center justify-between">
        <span className="font-display text-base font-semibold text-gradient-brand">
          Kết quả round
        </span>
        {stillWaiting > 0 && (
          <span className="text-xs text-muted-foreground">Còn {stillWaiting} người đang chơi</span>
        )}
      </div>

      {ranked.length === 0 && inProgress.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-2">Chưa có ai đoán.</p>
      )}

      <AnimatePresence initial={false}>
        {ranked.map((r, i) => (
          <motion.div
            key={r.uid}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25, delay: i * 0.04 }}
            className={cn(
              "flex items-center gap-3 rounded-lg border px-3 py-2 text-sm",
              r.status === "solved"
                ? "border-success/30 bg-success/10 text-success"
                : "border-border bg-muted/10 text-muted-foreground",
            )}
          >
            {/* Standing (Hạng N) — ties share the same number */}
            <span
              className={cn(
                "shrink-0 rounded-md border px-2 py-0.5 font-display text-xs font-bold tabular-nums",
                r.place === 1
                  ? "border-primary/40 bg-primary/15 text-primary"
                  : "border-border bg-muted/20 text-muted-foreground",
              )}
            >
              Hạng {r.place}
            </span>
            {r.status === "solved" ? (
              <Trophy size={14} className="shrink-0" aria-hidden="true" />
            ) : (
              <Flag size={14} className="shrink-0" aria-hidden="true" />
            )}
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate font-medium">{r.name}</span>
              {/* Per-player round stats: số lần đoán + thời gian */}
              <span className="flex items-center gap-2 text-[11px] opacity-70 tabular-nums">
                <span className="inline-flex items-center gap-0.5">
                  <Repeat2 size={11} aria-hidden="true" /> {r.guessCount} lượt
                </span>
                <span className="inline-flex items-center gap-0.5">
                  <Clock size={11} aria-hidden="true" /> {formatDurationMmSs(r.durationMs / 1000)}
                </span>
              </span>
            </div>
            <span className="font-mono text-xs font-bold">+{r.roundScore}đ</span>
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
