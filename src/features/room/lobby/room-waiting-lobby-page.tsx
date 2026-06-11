import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { useNavigate } from "@tanstack/react-router";
import { Loader2, Play, Users } from "lucide-react";
import { toast } from "sonner";
import {
  subscribeToGameState,
  startGameSession,
} from "@/lib/firestore/game-state-singleton-firestore-repository";
import { subscribeToPlayers } from "@/lib/firestore/top-level-player-firestore-repository";
import { useGameStore } from "@/stores/game-session-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Player } from "@/types/game-firestore-types";

export function RoomWaitingLobbyPage() {
  const navigate = useNavigate();
  const { uid, isAdmin } = useGameStore();
  const [players, setPlayers] = useState<Player[]>([]);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    const unsub1 = subscribeToGameState((state) => {
      if (state?.status === "playing") void navigate({ to: "/game" });
      if (state?.status === "ended") void navigate({ to: "/podium" });
    });
    const unsub2 = subscribeToPlayers(setPlayers);
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
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 280, damping: 24 }}
        className="w-full max-w-md"
      >
      <Card className="game-card game-glow w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="font-display">Phòng chờ</CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users size={14} />
              <span>{players.length} người chơi</span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            {isAdmin ? "Bấm Bắt đầu game khi đủ người." : "Chờ admin bắt đầu game…"}
          </p>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <ul className="flex flex-col gap-2">
            {players.map((p, i) => (
              <motion.li
                key={p.uid}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: i * 0.04 }}
                className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                  {p.name[0]?.toUpperCase()}
                </span>
                <span className="font-medium">{p.name}</span>
                {p.uid === uid && <Badge className="ml-auto text-xs">Bạn</Badge>}
              </motion.li>
            ))}
            {players.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-2 animate-pulse">
                Chưa có ai tham gia…
              </p>
            )}
          </ul>

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
      </motion.div>
    </div>
  );
}
