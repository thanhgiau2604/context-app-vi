import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { subscribeToRoom } from "@/lib/firestore/room-firestore-repository";
import { useRoundSaltLoader } from "@/hooks/use-round-salt-loader";
import { useGameStore } from "@/stores/game-session-store";
import { GuessInputForm } from "@/features/gameplay/guess/guess-input-form";
import { GuessHistorySortedList } from "@/features/gameplay/guess/guess-history-sorted-list";
import { RoundStatusHeaderBar } from "./round-status-header-bar";
import { HintPanel } from "@/features/gameplay/hint/hint-panel";
import { SolvedCelebrationOverlay } from "./solved-celebration-overlay";
import { KeywordRevealCard } from "./keyword-reveal-card";
import { finishPlayerRound } from "./round-completion-firestore-service";
import { usePublicResultsRealtime } from "@/hooks/use-public-results-realtime-listener";
import { RealtimeRoundResultsBoard } from "@/features/results/public-board/realtime-round-results-board";
import { CumulativeScoreLeaderboardPanel } from "@/features/results/leaderboard/cumulative-score-leaderboard-panel";
import type { Room } from "@/types/game-firestore-types";

export function GamePageLayout() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { uid, playerName, currentRoundId, localGuesses, usedHints, setRound } = useGameStore();
  const [room, setRoom] = useState<Room | null>(null);
  const [startedAtMs] = useState(Date.now());
  const [solved, setSolved] = useState(false);
  const [surrendered, setSurrendered] = useState(false);
  const [showSurrenderConfirm, setShowSurrenderConfirm] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [roundScore, setRoundScore] = useState(0);

  const { roundSalt } = useRoundSaltLoader(roomId ?? null, currentRoundId ?? null);
  const roundId = currentRoundId ?? room?.currentRoundId ?? null;
  const publicResults = usePublicResultsRealtime(roomId ?? null, roundId);
  const activePlayers = room ? room.playerCount || publicResults.length : 0;

  useEffect(() => {
    if (!roomId) return;
    return subscribeToRoom(roomId, (r) => {
      setRoom(r);
      if (r?.currentRoundId && !currentRoundId) setRound(r.currentRoundId);
      if (r?.status === "lobby") navigate(`/room/${roomId}`);
      if (r?.status === "ended") navigate(`/room/${roomId}/podium`);
    });
  }, [roomId, currentRoundId, setRound, navigate]);

  async function handleSolved() {
    if (!roomId || !roundId || !uid || !playerName) return;
    setSolved(true);
    try {
      const score = await finishPlayerRound({
        roomId,
        roundId,
        uid,
        name: playerName,
        status: "solved",
        bestRank: 1,
        guessCount: localGuesses.length,
        usedHints,
        hintPenalty: 0,
        startedAtMs,
        finishOrder: publicResults.length + 1,
      });
      setRoundScore(score);
      setShowCelebration(true);
    } catch (e) {
      console.error("finishPlayerRound error", e);
    }
  }

  async function handleSurrender() {
    if (!roomId || !roundId || !uid || !playerName) return;
    setSurrendered(true);
    setShowSurrenderConfirm(false);
    const bestRank = localGuesses.reduce<number | null>(
      (min, g) => (g.rank === null ? min : min === null || g.rank < min ? g.rank : min),
      null,
    );
    try {
      await finishPlayerRound({
        roomId,
        roundId,
        uid,
        name: playerName,
        status: "surrendered",
        bestRank,
        guessCount: localGuesses.length,
        usedHints,
        hintPenalty: 0,
        startedAtMs,
        finishOrder: publicResults.length + 1,
      });
    } catch (e) {
      console.error("finishPlayerRound error", e);
    }
  }

  const isPlaying = !solved && !surrendered;
  const roundStatus = isPlaying ? "playing" : "locked";

  if (!roomId || !roundId || !roundSalt || !uid) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="animate-pulse text-muted-foreground">Đang tải game…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4">
      <SolvedCelebrationOverlay
        visible={showCelebration}
        keyword="???"
        score={roundScore}
        onDismiss={() => setShowCelebration(false)}
      />

      {/* Responsive: single col mobile, two col desktop */}
      <div className="grid grid-cols-1 md:grid-cols-[3fr_2fr] gap-4 max-w-5xl mx-auto">
        {/* Left: gameplay area */}
        <div className="flex flex-col gap-3">
          <RoundStatusHeaderBar
            roundNumber={1}
            startedAtMs={startedAtMs}
            onHint={() => {}}
            onSurrender={() => setShowSurrenderConfirm(true)}
            hintDisabled={true}
            surrenderDisabled={!isPlaying}
            usedHints={usedHints}
          />
          {isPlaying && (
            <GuessInputForm
              roundSalt={roundSalt}
              roomId={roomId}
              roundId={roundId}
              disabled={false}
              onSolved={handleSolved}
            />
          )}
          {surrendered && <KeywordRevealCard keyword="(đáp án ẩn cho đến khi round kết thúc)" />}
          {showSurrenderConfirm && isPlaying && (
            <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 flex flex-col gap-3">
              <p className="text-sm font-medium">Bỏ cuộc? Bạn sẽ xếp cuối round này.</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowSurrenderConfirm(false)}
                  className="flex-1 rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted/20"
                >
                  Huỷ
                </button>
                <button
                  onClick={handleSurrender}
                  className="flex-1 rounded-md bg-destructive/80 px-3 py-1.5 text-sm text-white hover:bg-destructive"
                >
                  Bỏ cuộc
                </button>
              </div>
            </div>
          )}
          <HintPanel roomId={roomId} roundId={roundId} uid={uid} roundStatus={roundStatus} />
          <GuessHistorySortedList />
        </div>

        {/* Right: results + leaderboard (desktop only) */}
        <div className="hidden md:flex flex-col gap-3">
          <RealtimeRoundResultsBoard
            roomId={roomId}
            roundId={roundId}
            activePlayers={activePlayers}
          />
          <CumulativeScoreLeaderboardPanel roomId={roomId} />
        </div>
      </div>
    </div>
  );
}
