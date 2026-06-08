import { useEffect, useState } from "react";
import { useGameStore } from "@/stores/game-session-store";
import { RankBadge } from "@/components/ui/rank-display-badge";
import { Badge } from "@/components/ui/badge";

type Props = {
  roundNumber: number;
  startedAtMs: number;
  onHint: () => void;
  onSurrender: () => void;
  hintDisabled: boolean;
  surrenderDisabled: boolean;
  usedHints: number;
};

export function RoundStatusHeaderBar({
  roundNumber,
  startedAtMs,
  onHint,
  onSurrender,
  hintDisabled,
  surrenderDisabled,
  usedHints,
}: Props) {
  const { bestRank, localGuesses } = useGameStore();
  const [elapsedSec, setElapsedSec] = useState(0);

  useEffect(() => {
    const id = setInterval(
      () => setElapsedSec(Math.floor((Date.now() - startedAtMs) / 1000)),
      1000,
    );
    return () => clearInterval(id);
  }, [startedAtMs]);

  const mm = String(Math.floor(elapsedSec / 60)).padStart(2, "0");
  const ss = String(elapsedSec % 60).padStart(2, "0");

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-game-surface-1 px-4 py-3">
      <Badge variant="outline" className="font-mono">
        Round #{roundNumber}
      </Badge>
      <div className="flex items-center gap-1">
        <span className="text-xs text-muted-foreground">Best:</span>
        <RankBadge rank={bestRank} size="sm" />
      </div>
      <span className="text-xs text-muted-foreground">{localGuesses.length} lượt</span>
      <span className="ml-auto font-mono text-sm tabular-nums text-muted-foreground">
        {mm}:{ss}
      </span>
      <button
        onClick={onHint}
        disabled={hintDisabled}
        className="rounded-md border border-border px-2 py-1 text-xs disabled:opacity-40 hover:bg-muted/30 transition-colors"
      >
        💡 Gợi ý ({3 - usedHints} còn)
      </button>
      <button
        onClick={onSurrender}
        disabled={surrenderDisabled}
        className="rounded-md border border-destructive/40 px-2 py-1 text-xs text-destructive/80 disabled:opacity-40 hover:bg-destructive/10 transition-colors"
      >
        🏳 Bỏ cuộc
      </button>
    </div>
  );
}
