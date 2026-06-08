import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
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
} from "lucide-react";
import { toast } from "sonner";
import { auth } from "@/lib/firebase-app-init";
import { signOutAdmin } from "@/lib/firebase-email-password-auth-service";
import {
  ensureSingleRoom,
  openSession,
  startGameSession,
  advanceToNextRound,
  endSession,
  resetSession,
  subscribeToRoom,
  subscribeToGameLibrary,
} from "@/lib/firestore/room-firestore-repository";
import { ROOM_ID } from "@/lib/firestore/single-room-id-constant";
import { useGameStore } from "@/stores/game-session-store";
import { CreateGameModalDialog } from "@/features/admin/create-game/create-game-modal-dialog";
import type { CreateGameResult } from "@/features/admin/create-game/create-game-orchestration-service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Room, Round } from "@/types/game-firestore-types";

function RoomStatusBadge({ status }: { status: Room["status"] }) {
  const variantMap: Record<Room["status"], "secondary" | "outline" | "default" | "destructive"> = {
    idle: "secondary",
    waiting: "outline",
    playing: "default",
    ended: "destructive",
  };
  const labels: Record<Room["status"], string> = {
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
  const { setPlayer, uid } = useGameStore();
  const [room, setRoom] = useState<Room | null>(null);
  const [library, setLibrary] = useState<Round[]>([]);
  const [showCreateGame, setShowCreateGame] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      setPlayer(user.uid, "Admin", true);
      void ensureSingleRoom(user.uid);
    }
    const unsub1 = subscribeToRoom(ROOM_ID, setRoom);
    const unsub2 = subscribeToGameLibrary(ROOM_ID, setLibrary);
    return () => {
      unsub1();
      unsub2();
    };
  }, [setPlayer]);

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

  async function handleSignOut() {
    await signOutAdmin();
    toast.info("Đã đăng xuất.");
  }

  function handleGameCreated(result: CreateGameResult) {
    toast.success(`Game tạo xong! Keyword: ${result.keyword}`);
    setShowCreateGame(false);
  }

  const status = room?.status ?? "idle";
  const currentRoundId = room?.currentRoundId;
  const readyCount = library.filter((r) => r.status === "ready").length;

  return (
    <>
      <Card className="w-full max-w-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CardTitle className="text-gradient-brand">Admin Dashboard</CardTitle>
              {room && <RoomStatusBadge status={status} />}
            </div>
            <Button size="icon" variant="ghost" onClick={handleSignOut} title="Đăng xuất">
              <LogOut size={16} />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {/* Session lifecycle controls */}
          <div className="flex flex-wrap gap-2">
            {status === "idle" && (
              <Button
                onClick={() => run(openSession, "Không mở được phòng")}
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
                    run(async () => {
                      const hasNext = await advanceToNextRound(currentRoundId);
                      if (!hasNext) toast.info("Hết game trong kho. Kết thúc phiên.");
                    }, "Không chuyển được round")
                  }
                  disabled={busy}
                >
                  {busy ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <SkipForward size={16} className="mr-2" />
                  )}
                  Round tiếp
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => run(() => endSession(currentRoundId), "Không kết thúc được")}
                  disabled={busy}
                >
                  <StopCircle size={16} className="mr-2" />
                  Kết thúc
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
          </div>

          {/* Create game + settings */}
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

          {/* Game library */}
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
          roomId={ROOM_ID}
          adminUid={uid}
          onDone={handleGameCreated}
        />
      )}
    </>
  );
}
