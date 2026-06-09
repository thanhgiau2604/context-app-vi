import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Loader2, Play, Users } from "lucide-react";
import { toast } from "sonner";
import {
  subscribeToRoom,
  subscribeToPlayers,
  startGameSession,
} from "@/lib/firestore/room-firestore-repository";
import { ROOM_ID } from "@/lib/firestore/single-room-id-constant";
import { useGameStore } from "@/stores/game-session-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Player, Room } from "@/types/game-firestore-types";

export function RoomWaitingLobbyPage() {
  const navigate = useNavigate();
  const { uid, isAdmin } = useGameStore();
  const [room, setRoom] = useState<Room | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    const unsub1 = subscribeToRoom(ROOM_ID, (r) => {
      setRoom(r);
      if (r?.status === "playing") void navigate({ to: "/game" });
      if (r?.status === "ended") void navigate({ to: "/podium" });
    });
    const unsub2 = subscribeToPlayers(ROOM_ID, setPlayers);
    return () => {
      unsub1();
      unsub2();
    };
  }, [navigate]);

  async function handleStartGame() {
    setStarting(true);
    try {
      await startGameSession();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không bắt đầu được game.");
    } finally {
      setStarting(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Phòng chờ</CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users size={14} />
              <span>{players.length} người chơi</span>
            </div>
          </div>
          {room?.status === "waiting" && (
            <p className="text-sm text-muted-foreground">
              {isAdmin ? "Bấm Bắt đầu game khi đủ người." : "Chờ admin bắt đầu game…"}
            </p>
          )}
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <ul className="flex flex-col gap-2">
            {players.map((p) => (
              <li key={p.uid} className="flex items-center gap-3 rounded-lg bg-muted/20 px-3 py-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                  {p.name[0]?.toUpperCase()}
                </span>
                <span className="font-medium">{p.name}</span>
                {p.uid === uid && <Badge className="ml-auto text-xs">Bạn</Badge>}
              </li>
            ))}
            {players.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-2 animate-pulse">
                Chưa có ai tham gia…
              </p>
            )}
          </ul>

          {/* Admin start button */}
          {isAdmin && (
            <Button onClick={handleStartGame} disabled={starting || players.length === 0}>
              {starting ? (
                <Loader2 size={16} className="mr-2 animate-spin" />
              ) : (
                <Play size={16} className="mr-2" />
              )}
              Bắt đầu game ({players.length} người)
            </Button>
          )}

          {!isAdmin && (
            <p className="text-center text-sm text-muted-foreground animate-pulse">
              Chờ admin bắt đầu…
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
