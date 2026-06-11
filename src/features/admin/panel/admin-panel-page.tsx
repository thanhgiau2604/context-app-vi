import { useEffect, useState } from "react";
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
  RotateCcw,
  Eye,
  Trash2,
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
import {
  updateRoundStatus,
  deleteRound,
} from "@/lib/firestore/round-with-embedded-terms-firestore-repository";
import { useAutoEndRoundWhenAllFinished } from "@/hooks/use-auto-end-round-when-all-finished";
import { joinGame } from "@/lib/firestore/top-level-player-firestore-repository";
import { useGameStore } from "@/stores/game-session-store";
import { CreateGameModalDialog } from "@/features/admin/create-game/create-game-modal-dialog";
import { RoundDetailDialog } from "@/features/admin/panel/admin-round-detail-with-terms-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  const [detailRound, setDetailRound] = useState<Round | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Round | null>(null);

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

  // Auto-end round only when ALL active players have finished (spec §4.3).
  useAutoEndRoundWhenAllFinished(
    gameState?.status === "playing" ? (gameState?.currentRoundId ?? null) : null,
    true,
  );

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
      <Card className="w-full max-w-2xl game-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CardTitle className="text-2xl text-gradient-brand">Admin Dashboard</CardTitle>
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
              aria-label="Đăng xuất"
            >
              <LogOut size={16} aria-hidden="true" />
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
                    // Admin is a player entity (spec §3.1/4.1): join so admin shows in
                    // lobby list and counts toward round-end (all-players-finished gate).
                    if (uid) await joinGame(uid, "Admin");
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
                  <Loader2 size={16} className="mr-2 animate-spin" aria-hidden="true" />
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
                    <Loader2 size={16} className="animate-spin mr-2" aria-hidden="true" />
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
                    <Loader2 size={16} className="animate-spin mr-2" aria-hidden="true" />
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
              <Link to="/admin/settings" aria-label="Cài đặt" title="Cài đặt">
                <Settings size={16} aria-hidden="true" />
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
                    className="flex items-center gap-3 rounded-lg bg-muted/10 border border-border/40 px-4 py-3 text-base"
                  >
                    <span className="text-muted-foreground font-mono font-bold w-7">#{i + 1}</span>
                    <span className="flex-1 text-sm font-mono text-muted-foreground truncate">
                      {r.roundId}
                    </span>
                    <RoundStatusBadge status={r.status} />
                    {/* Force về "ready" để chơi lại — chỉ với game đã chơi (completed) hoặc draft */}
                    {(r.status === "completed" || r.status === "draft") && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 shrink-0"
                        disabled={busy}
                        title="Cho chơi lại (đánh dấu sẵn sàng)"
                        aria-label="Cho chơi lại"
                        onClick={() =>
                          run(async () => {
                            await updateRoundStatus(r.roundId, "ready");
                            toast.success("Game đã sẵn sàng để chơi lại.");
                          }, "Không cập nhật được trạng thái game")
                        }
                      >
                        <RotateCcw size={14} aria-hidden="true" />
                      </Button>
                    )}
                    {/* Xem chi tiết: đáp án + 499 từ liên quan */}
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 shrink-0"
                      title="Xem chi tiết"
                      aria-label="Xem chi tiết"
                      onClick={() => setDetailRound(r)}
                    >
                      <Eye size={14} aria-hidden="true" />
                    </Button>
                    {/* Xóa game — chặn xóa round đang chơi */}
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 shrink-0 text-destructive hover:text-destructive"
                      disabled={busy || r.roundId === currentRoundId}
                      title={
                        r.roundId === currentRoundId ? "Không thể xóa game đang chơi" : "Xóa game"
                      }
                      aria-label="Xóa game"
                      onClick={() => setDeleteTarget(r)}
                    >
                      <Trash2 size={14} aria-hidden="true" />
                    </Button>
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

      <RoundDetailDialog
        round={detailRound}
        open={detailRound !== null}
        onOpenChange={(open) => {
          if (!open) setDetailRound(null);
        }}
      />

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent className="game-card">
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa game này?</AlertDialogTitle>
            <AlertDialogDescription>
              Game <span className="font-mono font-semibold">{deleteTarget?.roundId}</span> và toàn
              bộ dữ liệu liên quan sẽ bị xóa vĩnh viễn. Không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={busy}
              onClick={() => {
                const target = deleteTarget;
                if (!target) return;
                void run(async () => {
                  await deleteRound(target.roundId);
                  toast.success("Đã xóa game.");
                  setDeleteTarget(null);
                }, "Không xóa được game");
              }}
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
