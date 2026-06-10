import { useState } from "react";
import { Flag, StopCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  endCurrentRound,
  closeSession,
} from "@/lib/firestore/game-state-singleton-firestore-repository";
import { Button } from "@/components/ui/button";

type Props = { roundId: string };

export function AdminInGameControlBar({ roundId }: Props) {
  const [busy, setBusy] = useState(false);

  async function run(fn: () => Promise<void>, errMsg: string) {
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : errMsg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2">
      <span className="text-xs font-medium text-muted-foreground shrink-0">Admin:</span>
      <Button
        size="sm"
        variant="secondary"
        className="h-7 text-xs"
        onClick={() => run(() => endCurrentRound(roundId), "Lỗi kết thúc ván game")}
        disabled={busy}
      >
        {busy ? (
          <Loader2 size={12} className="animate-spin mr-1" />
        ) : (
          <Flag size={12} className="mr-1" />
        )}
        Kết thúc ván
      </Button>
      <Button
        size="sm"
        variant="destructive"
        className="h-7 text-xs"
        onClick={() =>
          run(async () => {
            await endCurrentRound(roundId);
            await closeSession();
          }, "Lỗi kết thúc game")
        }
        disabled={busy}
      >
        <StopCircle size={12} className="mr-1" />
        Kết thúc game
      </Button>
    </div>
  );
}
