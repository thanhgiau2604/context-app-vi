import { useEffect, useState } from "react";
import { Loader2, SkipForward, StopCircle } from "lucide-react";
import { toast } from "sonner";
import { getRoundKeyword } from "@/lib/firestore/round-with-embedded-terms-firestore-repository";
import {
  startGameSession,
  closeSession,
} from "@/lib/firestore/game-state-singleton-firestore-repository";
import { RealtimeRoundResultsBoard } from "@/features/results/public-board/realtime-round-results-board";
import { usePublicResultsRealtime } from "@/hooks/use-public-results-realtime-listener";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type Props = {
  roundId: string;
  activePlayers: number;
  isAdmin: boolean;
};

export function BetweenRoundsKeywordRevealSummary({ roundId, activePlayers, isAdmin }: Props) {
  const [keyword, setKeyword] = useState<string | null>(null);
  const [busyNext, setBusyNext] = useState(false);
  const [busyEnd, setBusyEnd] = useState(false);
  const publicResults = usePublicResultsRealtime(roundId);

  useEffect(() => {
    getRoundKeyword(roundId)
      .then(setKeyword)
      .catch(() => {});
  }, [roundId]);

  async function runNext(fn: () => Promise<void>, errMsg: string) {
    setBusyNext(true);
    try {
      await fn();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : errMsg);
    } finally {
      setBusyNext(false);
    }
  }

  async function runEnd(fn: () => Promise<void>, errMsg: string) {
    setBusyEnd(true);
    try {
      await fn();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : errMsg);
    } finally {
      setBusyEnd(false);
    }
  }

  const anyBusy = busyNext || busyEnd;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-4">
      <Card className="game-card game-glow w-full max-w-md">
        <CardHeader>
          <CardTitle className="font-display">Ván game vừa xong</CardTitle>
          {keyword ? (
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-muted-foreground">Từ khoá:</span>
              <Badge className="font-display text-sm font-bold px-3">{keyword}</Badge>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground animate-pulse">Đang tải từ khoá…</p>
          )}
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <RealtimeRoundResultsBoard
            roundId={roundId}
            activePlayers={activePlayers}
            results={publicResults}
          />

          {isAdmin ? (
            <div className="flex gap-2 pt-1">
              <Button
                className="flex-1"
                onClick={() => runNext(startGameSession, "Không bắt đầu được round mới")}
                disabled={anyBusy}
              >
                {busyNext ? (
                  <Loader2 size={16} className="mr-2 animate-spin" />
                ) : (
                  <SkipForward size={16} className="mr-2" />
                )}
                Round tiếp
              </Button>
              <Button
                variant="destructive"
                onClick={() => runEnd(closeSession, "Không kết thúc được game")}
                disabled={anyBusy}
              >
                {busyEnd ? (
                  <Loader2 size={16} className="mr-1 animate-spin" />
                ) : (
                  <StopCircle size={16} className="mr-1" />
                )}
                Kết thúc game
              </Button>
            </div>
          ) : (
            <p className="text-center text-sm text-muted-foreground animate-pulse">
              Chờ admin bắt đầu round tiếp theo…
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
