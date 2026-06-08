import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Users } from "lucide-react";
import { subscribeToRoom, subscribeToPlayers } from "@/lib/firestore/room-firestore-repository";
import { ROOM_ID } from "@/lib/firestore/single-room-id-constant";
import { useGameStore } from "@/stores/game-session-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Player, Room } from "@/types/game-firestore-types";

export function RoomWaitingLobbyPage() {
  const navigate = useNavigate();
  const { uid } = useGameStore();
  const [room, setRoom] = useState<Room | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);

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

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Phòng chờ</CardTitle>
          {room?.status === "waiting" && (
            <p className="text-sm text-muted-foreground">Chờ admin bắt đầu game…</p>
          )}
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{players.length} người chơi</span>
          </div>
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
          </ul>
          <p className="text-center text-sm text-muted-foreground animate-pulse">
            Chờ admin bắt đầu…
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
