import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Loader2, LogIn } from "lucide-react";
import { toast } from "sonner";
import { ensureAnonymousUser } from "@/lib/firebase-anonymous-auth";
import { getGameState } from "@/lib/firestore/game-state-singleton-firestore-repository";
import { joinGame, RoomFullError } from "@/lib/firestore/top-level-player-firestore-repository";
import { MAX_PLAYERS } from "@/lib/config/game-limits-config";
import { useGameStore } from "@/stores/game-session-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export function PlayerJoinRoomPage() {
  const navigate = useNavigate();
  const { setPlayer } = useGameStore();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return;

    setLoading(true);
    try {
      const state = await getGameState();
      if (!state || state.status === "idle") {
        toast.error("Phòng chưa mở. Chờ admin bấm Mở phòng chờ.");
        return;
      }
      if (state.status === "ended") {
        toast.error("Phiên chơi đã kết thúc.");
        return;
      }
      if (state.status === "playing") {
        toast.error("Game đang chạy, không thể tham gia lúc này.");
        return;
      }
      // Pre-check cap for UX; transaction in joinGame is the authoritative guard against races.
      if ((state.playerCount ?? 0) >= MAX_PLAYERS) {
        toast.error(`Phòng đã đủ ${MAX_PLAYERS} người chơi.`);
        return;
      }

      const user = await ensureAnonymousUser();
      await joinGame(user.uid, trimmedName);
      setPlayer(user.uid, trimmedName, false);
      void navigate({ to: "/lobby" });
    } catch (e) {
      if (e instanceof RoomFullError) toast.error(e.message);
      else toast.error(e instanceof Error ? e.message : "Có lỗi xảy ra.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gradient-brand">Contextto Việt</CardTitle>
          <p className="text-sm text-muted-foreground">Game đoán từ tiếng Việt</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleJoin} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="player-name">Tên của bạn</Label>
              <Input
                id="player-name"
                placeholder="Nhập tên..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={20}
                autoFocus
              />
            </div>
            <Button type="submit" disabled={loading || !name.trim()}>
              {loading ? (
                <Loader2 size={16} className="mr-2 animate-spin" />
              ) : (
                <LogIn size={16} className="mr-2" />
              )}
              Tham gia
            </Button>
          </form>
          <div className="mt-4 text-center">
            <Badge variant="outline" className="text-xs text-muted-foreground">
              Không cần đăng nhập
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
