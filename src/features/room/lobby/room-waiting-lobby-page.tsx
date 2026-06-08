import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Copy, Users } from "lucide-react";
import { toast } from "sonner";
import { subscribeToRoom, subscribeToPlayers } from "@/lib/firestore/room-firestore-repository";
import { useGameStore } from "@/stores/game-session-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Player, Room } from "@/types/game-firestore-types";

export function RoomWaitingLobbyPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { uid, isAdmin } = useGameStore();
  const [room, setRoom] = useState<Room | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);

  useEffect(() => {
    if (!roomId) return;
    const unsub1 = subscribeToRoom(roomId, (r) => {
      setRoom(r);
      if (r?.status === "active") navigate(`/room/${roomId}/game`);
      if (r?.status === "ended") navigate(`/room/${roomId}/podium`);
    });
    const unsub2 = subscribeToPlayers(roomId, setPlayers);
    return () => {
      unsub1();
      unsub2();
    };
  }, [roomId, navigate]);

  function copyLink() {
    const url = `${window.location.origin}/?room=${roomId}`;
    navigator.clipboard.writeText(url);
    toast.success("Đã sao chép link phòng!");
  }

  const joinUrl = `${window.location.origin}/?room=${roomId}`;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Phòng chờ</CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono text-base tracking-widest">
                {roomId}
              </Badge>
              <Button size="icon" variant="ghost" onClick={copyLink}>
                <Copy size={16} />
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground break-all">{joinUrl}</p>
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
          {!isAdmin && (
            <p className="text-center text-sm text-muted-foreground animate-pulse">
              Chờ admin bắt đầu…
            </p>
          )}
          {isAdmin && room?.status === "lobby" && (
            <p className="text-center text-sm text-muted-foreground">Mở tab Admin để tạo game.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
