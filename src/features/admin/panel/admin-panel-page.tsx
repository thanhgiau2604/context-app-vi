import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Loader2,
  Plus,
  Settings,
  LogOut,
  Play,
  Users,
  SkipForward,
  StopCircle,
  RefreshCw,
  Gamepad2,
  Flag,
} from "lucide-react";
import { toast } from "sonner";
import { auth } from "@/lib/firebase-app-init";
import { signOutAdmin } from "@/lib/firebase-email-password-auth-service";
import {
  ensureGameState,
  openSession,
  startGameSession,
  endCurrentRound,
  closeSession,
  resetSession,
  subscribeToGameState,
  subscribeToGameLibrary,
} from "@/lib/firestore/game-state-singleton-firestore-repository";
import { subscribeToPublicResults } from "@/hooks/use-public-results-realtime-listener";
import { joinGame } from "@/lib/firestore/top-level-player-firestore-repository";
import { useGameStore } from "@/stores/game-session-store";
import { CreateGameModalDialog } from "@/features/admin/create-game/create-game-modal-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { GameState, Round } from "@/types/game-firestore-types";

function GameStatusBadge({ status }: { status: GameState["status"] }) {
  const variantMap: Record<
    GameState["status"],
    "secondary" | "outline" | "default" | "destructive"
  > = {
    idle: "secondary",
    waiting: "outline",
    playing: "default",
    ended: "destructive",
  };
  const labels: Record<GameState["status"], string> = {
    idle: "Chờ",
    waiting: "Mở phòng",
    playing: "Đang chơi",
    ended: "Kết thúc",
  };
  return <Badge variant={variantMap[status]}>{labels[status]}</Badge>;
}

function RoundStatusBadge({ status }: { status: Round["status"] }) {
  if (status === "ready")
    return (
      <Badge variant="outline" className="text-xs">
        Sẵn sàng
      </Badge>
    );
  if (status === "playing") return <Badge className="text-xs">Đang chơi</Badge>;
  if (status === "completed")
    return (
      <Badge variant="secondary" className="text-xs opacity-60">
        Đã chơi
      </Badge>
    );
  return (
    <Badge variant="secondary" className="text-xs opacity-40">
      Draft
    </Badge>
  );
}

export function AdminPanelPage() {
  const navigate = useNavigate();
  const { setPlayer, uid } = useGameStore();
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [library, setLibrary] = useState<Round[]>([]);
  const [showCreateGame, setShowCreateGame] = useState(false);
  const [busy, setBusy] = useState(false);
  const autoEndedRoundRef = useRef<string | null>(null);

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      setPlayer(user.uid, "Admin", true);
      void ensureGameState(user.uid);
    }
    const unsub1 = subscribeToGameState(setGameState);
    const unsub2 = subscribeToGameLibrary(setLibrary);
    return () => {
      unsub1();
      unsub2();
    };
  }, [setPlayer]);

  // Auto-end round when all registered players submit results
  useEffect(() => {
    const rId = gameState?.currentRoundId;
    const playerCount = gameState?.playerCount ?? 0;
    if (!rId || gameState?.status !== "playing" || playerCount === 0) return;
    return subscribeToPublicResults(rId, (results) => {
      if (results.length >= playerCount && autoEndedRoundRef.current !== rId) {
        autoEndedRoundRef.current = rId;
        endCurrentRound(rId).catch(console.error);
      }
    });
  }, [gameState?.currentRoundId, gameState?.status, gameState?.playerCount]);

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

  async function handlePlayAlong() {
    if (!uid) return;
    try {
      await joinGame(uid, "Admin");
      void navigate({ to: "/game" });
    } catch {
      toast.error("Không thể vào chơi.");
    }
  }

  const status = gameState?.status ?? "idle";
  const currentRoundId = gameState?.currentRoundId;
  const readyCount = library.filter((r) => r.status === "ready").length;
  const isBetweenRounds = status === "playing" && !currentRoundId;

  return (
    <>
      <Card className="w-full max-w-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CardTitle className="text-gradient-brand">Admin Dashboard</CardTitle>
              {gameState && <GameStatusBadge status={status} />}
            </div>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => {
                void signOutAdmin();
                toast.info("Đã đăng xuất.");
              }}
              title="Đăng xuất"
            >
              <LogOut size={16} />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            {status === "idle" && (
              <Button
                onClick={() =>
                  run(async () => {
                    await openSession();
                    void navigate({ to: "/lobby" });
                  }, "Không mở được phòng")
                }
                disabled={busy || readyCount === 0}
                title={readyCount === 0 ? "Cần ít nhất 1 game trong kho" : undefined}
              >
                <Users size={16} className="mr-2" />
                Mở phòng chờ
                {readyCount === 0 && <span className="ml-2 text-xs opacity-60">(cần game)</span>}
              </Button>
            )}

            {status === "waiting" && (
              <Button onClick={() => run(startGameSession, "Không bắt đầu được")} disabled={busy}>
                {busy ? (
                  <Loader2 size={16} className="mr-2 animate-spin" />
                ) : (
                  <Play size={16} className="mr-2" />
                )}
                Bắt đầu game
              </Button>
            )}

            {status === "playing" && currentRoundId && (
              <>
                <Button
                  variant="secondary"
                  onClick={() =>
                    run(() => endCurrentRound(currentRoundId), "Không kết thúc được ván game")
                  }
                  disabled={busy}
                >
                  {busy ? (
                    <Loader2 size={16} className="animate-spin mr-2" />
                  ) : (
                    <Flag size={16} className="mr-2" />
                  )}
                  Kết thúc ván game
                </Button>
                <Button
                  variant="destructive"
                  onClick={() =>
                    run(async () => {
                      await endCurrentRound(currentRoundId);
                      await closeSession();
                    }, "Không kết thúc được game")
                  }
                  disabled={busy}
                >
                  <StopCircle size={16} className="mr-2" />
                  Kết thúc game
                </Button>
              </>
            )}

            {isBetweenRounds && (
              <>
                <Button
                  onClick={() => run(startGameSession, "Không bắt đầu được round mới")}
                  disabled={busy || readyCount === 0}
                  title={readyCount === 0 ? "Hết game trong kho" : undefined}
                >
                  {busy ? (
                    <Loader2 size={16} className="animate-spin mr-2" />
                  ) : (
                    <SkipForward size={16} className="mr-2" />
                  )}
                  Round tiếp
                  {readyCount === 0 && <span className="ml-2 text-xs opacity-60">(hết game)</span>}
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => run(closeSession, "Không kết thúc được game")}
                  disabled={busy}
                >
                  <StopCircle size={16} className="mr-2" />
                  Kết thúc game
                </Button>
              </>
            )}

            {status === "ended" && (
              <Button
                variant="outline"
                onClick={() => run(resetSession, "Không reset được")}
                disabled={busy}
              >
                <RefreshCw size={16} className="mr-2" />
                Chơi lại
              </Button>
            )}

            {status === "playing" && currentRoundId && (
              <Button variant="outline" onClick={handlePlayAlong}>
                <Gamepad2 size={16} className="mr-2" />
                Vào chơi
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setShowCreateGame(true)} className="flex-1">
              <Plus size={16} className="mr-2" />
              Tạo game mới
            </Button>
            <Button variant="outline" asChild>
              <Link to="/admin/settings">
                <Settings size={16} />
              </Link>
            </Button>
          </div>

          {library.length > 0 ? (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Kho game ({library.length})
              </p>
              <ul className="flex flex-col gap-1 max-h-64 overflow-y-auto">
                {library.map((r, i) => (
                  <li
                    key={r.roundId}
                    className="flex items-center gap-3 rounded-lg bg-muted/10 border border-border/40 px-3 py-2 text-sm"
                  >
                    <span className="text-muted-foreground font-mono w-6">#{i + 1}</span>
                    <span className="flex-1 text-xs font-mono text-muted-foreground truncate">
                      {r.roundId}
                    </span>
                    <RoundStatusBadge status={r.status} />
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-center text-sm text-muted-foreground py-4">
              Chưa có game nào. Tạo game mới để bắt đầu.
            </p>
          )}
        </CardContent>
      </Card>

      {uid && (
        <CreateGameModalDialog
          open={showCreateGame}
          onOpenChange={setShowCreateGame}
          adminUid={uid}
          onDone={(result) => {
            toast.success(`Game tạo xong! Keyword: ${result.keyword}`);
            setShowCreateGame(false);
          }}
        />
      )}
    </>
  );
}
