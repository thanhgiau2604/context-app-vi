import { useEffect, useState } from "react";
import { Flag } from "lucide-react";
import { useGameStore } from "@/stores/game-session-store";
import { RankBadge } from "@/components/ui/rank-display-badge";
import { Badge } from "@/components/ui/badge";

type Props = {
  roundNumber: number;
  startedAtMs: number;
  onSurrender: () => void;
  surrenderDisabled: boolean;
};

export function RoundStatusHeaderBar({
  roundNumber,
  startedAtMs,
  onSurrender,
  surrenderDisabled,
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
    <div className="hud-corners flex flex-wrap items-center gap-2 rounded-xl border border-primary/25 bg-game-surface-1 px-4 py-3">
      <Badge variant="outline" className="font-mono uppercase tracking-wider border-primary/40 text-primary">
        Round #{roundNumber}
      </Badge>
      <div className="flex items-center gap-1">
        <span className="text-xs uppercase tracking-wider text-muted-foreground">Best</span>
        <RankBadge rank={bestRank} size="sm" />
      </div>
      <span className="text-xs text-muted-foreground">{localGuesses.length} lượt</span>
      <span className="neon-text ml-auto font-mono text-sm tabular-nums text-primary">
        {mm}:{ss}
      </span>
      <button
        onClick={onSurrender}
        disabled={surrenderDisabled}
        className="inline-flex items-center gap-1 rounded-md border border-destructive/40 px-2 py-1 text-xs text-destructive/80 disabled:opacity-40 hover:bg-destructive/10 transition-colors"
      >
        <Flag size={12} aria-hidden="true" />
        Bỏ cuộc
      </button>
    </div>
  );
}
