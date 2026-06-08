import { useEffect, useState } from "react";
import { getRoundKeyword } from "@/lib/firestore/round-firestore-repository";
import { ROOM_ID } from "@/lib/firestore/single-room-id-constant";
import { RealtimeRoundResultsBoard } from "@/features/results/public-board/realtime-round-results-board";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Props = {
  /** ID of the round that just completed — used to load results and reveal keyword */
  roundId: string;
  activePlayers: number;
};

/**
 * Shown to all players between rounds (room.status="playing", currentRoundId cleared).
 * Reveals the keyword and displays the round leaderboard.
 * Disappears when admin starts the next round (currentRoundId set again).
 */
export function BetweenRoundsKeywordRevealSummary({ roundId, activePlayers }: Props) {
  const [keyword, setKeyword] = useState<string | null>(null);

  useEffect(() => {
    // Round is completed — Firestore rules allow read for all signed-in users
    getRoundKeyword(ROOM_ID, roundId)
      .then(setKeyword)
      .catch(() => {});
  }, [roundId]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Ván game vừa xong</CardTitle>
          {keyword ? (
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-muted-foreground">Từ khoá:</span>
              <Badge className="text-sm font-bold px-3">{keyword}</Badge>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground animate-pulse">Đang tải từ khoá…</p>
          )}
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <RealtimeRoundResultsBoard
            roomId={ROOM_ID}
            roundId={roundId}
            activePlayers={activePlayers}
          />
          <p className="text-center text-sm text-muted-foreground animate-pulse">
            Chờ admin bắt đầu round tiếp theo…
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
