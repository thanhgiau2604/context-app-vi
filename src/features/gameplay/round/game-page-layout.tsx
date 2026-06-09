import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ROOM_ID } from "@/lib/firestore/single-room-id-constant";
import { subscribeToRoom, endCurrentRound } from "@/lib/firestore/room-firestore-repository";
import { getRoundKeyword } from "@/lib/firestore/round-firestore-repository";
import { useRoundSaltLoader } from "@/hooks/use-round-salt-loader";
import { useGameStore } from "@/stores/game-session-store";
import { GuessInputForm } from "@/features/gameplay/guess/guess-input-form";
import { GuessHistorySortedList } from "@/features/gameplay/guess/guess-history-sorted-list";
import { RoundStatusHeaderBar } from "./round-status-header-bar";
import { HintPanel } from "@/features/gameplay/hint/hint-panel";
import { SolvedCelebrationOverlay } from "./solved-celebration-overlay";
import { KeywordRevealCard } from "./keyword-reveal-card";
import { BetweenRoundsKeywordRevealSummary } from "./between-rounds-keyword-reveal-summary";
import { AdminInGameControlBar } from "@/features/admin/panel/admin-in-game-control-bar";
import { finishPlayerRound } from "./round-completion-firestore-service";
import { usePublicResultsRealtime } from "@/hooks/use-public-results-realtime-listener";
import { RealtimeRoundResultsBoard } from "@/features/results/public-board/realtime-round-results-board";
import { CumulativeScoreLeaderboardPanel } from "@/features/results/leaderboard/cumulative-score-leaderboard-panel";
import type { Room } from "@/types/game-firestore-types";

export function GamePageLayout() {
  const navigate = useNavigate();
  const {
    uid,
    playerName,
    isAdmin,
    currentRoundId,
    localGuesses,
    bestRank,
    usedHints,
    setRound,
    resetRoundState,
  } = useGameStore();

  const [room, setRoom] = useState<Room | null>(null);
  // startedAtMs resets each round so timer and score calc stay accurate
  const [startedAtMs, setStartedAtMs] = useState(Date.now());
  const [solved, setSolved] = useState(false);
  const [surrendered, setSurrendered] = useState(false);
  const [showSurrenderConfirm, setShowSurrenderConfirm] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [roundScore, setRoundScore] = useState(0);
  const [revealedKeyword, setRevealedKeyword] = useState<string | null>(null);

  // Near-miss bonus: first time bestRank ≤ 50 within first 60s
  const [firstNearMissWithin60s, setFirstNearMissWithin60s] = useState(false);

  // lastRoundId survives currentRoundId clearing — used for between-rounds summary
  const [lastRoundId, setLastRoundId] = useState<string | null>(null);
  const prevRoundIdRef = useRef<string | null>(null);
  // Prevent double-trigger of auto-end per round
  const autoEndedRoundRef = useRef<string | null>(null);

  // Detect near-miss: bestRank ≤ 50 within 60s of round start
  useEffect(() => {
    if (
      !firstNearMissWithin60s &&
      bestRank !== null &&
      bestRank <= 50 &&
      Date.now() - startedAtMs <= 60_000
    ) {
      setFirstNearMissWithin60s(true);
    }
  }, [bestRank, firstNearMissWithin60s, startedAtMs]);

  useEffect(() => {
    return subscribeToRoom(ROOM_ID, (r) => {
      setRoom(r);

      if (r?.currentRoundId) {
        // New round — reset all per-round state
        if (prevRoundIdRef.current && prevRoundIdRef.current !== r.currentRoundId) {
          resetRoundState();
          setSolved(false);
          setSurrendered(false);
          setShowSurrenderConfirm(false);
          setShowCelebration(false);
          setRevealedKeyword(null);
          setFirstNearMissWithin60s(false);
          setStartedAtMs(Date.now());
        }
        prevRoundIdRef.current = r.currentRoundId;
        setLastRoundId(r.currentRoundId);
        setRound(r.currentRoundId);
      }

      if (r?.status === "waiting") void navigate({ to: "/lobby" });
      if (r?.status === "ended") void navigate({ to: "/podium" });
    });
  }, [setRound, resetRoundState, navigate]);

  const roundId = currentRoundId ?? room?.currentRoundId ?? null;
  const { roundSalt } = useRoundSaltLoader(ROOM_ID, roundId);
  const publicResults = usePublicResultsRealtime(ROOM_ID, roundId ?? lastRoundId);
  const activePlayers = room?.playerCount ?? 0;

  // Admin auto-end: when all registered players have submitted results
  useEffect(() => {
    if (
      isAdmin &&
      roundId &&
      activePlayers > 0 &&
      publicResults.length >= activePlayers &&
      autoEndedRoundRef.current !== roundId
    ) {
      autoEndedRoundRef.current = roundId;
      endCurrentRound(roundId).catch(console.error);
    }
  }, [isAdmin, roundId, activePlayers, publicResults.length]);

  async function fetchAndRevealKeyword(rId: string) {
    try {
      const kw = await getRoundKeyword(ROOM_ID, rId);
      setRevealedKeyword(kw);
    } catch {
      // stays hidden if fetch fails
    }
  }

  async function handleSolved() {
    if (!roundId || !uid || !playerName) return;
    setSolved(true);
    try {
      const score = await finishPlayerRound({
        roomId: ROOM_ID,
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
        firstNearMissWithin60s,
      });
      setRoundScore(score);
      setShowCelebration(true);
      void fetchAndRevealKeyword(roundId);
    } catch (e) {
      console.error("finishPlayerRound error", e);
      // Revert solved so player can retry
      setSolved(false);
    }
  }

  async function handleSurrender() {
    if (!roundId || !uid || !playerName) return;
    setSurrendered(true);
    setShowSurrenderConfirm(false);
    const surrenderBestRank = localGuesses.reduce<number | null>(
      (min, g) => (g.rank === null ? min : min === null || g.rank < min ? g.rank : min),
      null,
    );
    try {
      await finishPlayerRound({
        roomId: ROOM_ID,
        roundId,
        uid,
        name: playerName,
        status: "surrendered",
        bestRank: surrenderBestRank,
        guessCount: localGuesses.length,
        usedHints,
        hintPenalty: 0,
        startedAtMs,
        finishOrder: publicResults.length + 1,
        firstNearMissWithin60s,
      });
      void fetchAndRevealKeyword(roundId);
    } catch (e) {
      console.error("finishPlayerRound error", e);
      setSurrendered(false);
    }
  }

  // Between-rounds: room playing but no active round → show round summary
  const isBetweenRounds = room?.status === "playing" && !room.currentRoundId && !!lastRoundId;
  if (isBetweenRounds) {
    return (
      <BetweenRoundsKeywordRevealSummary
        roundId={lastRoundId!}
        activePlayers={activePlayers}
        isAdmin={isAdmin}
      />
    );
  }

  const isPlaying = !solved && !surrendered;
  const roundStatus = isPlaying ? "playing" : "locked";

  if (!roundId || !roundSalt || !uid) {
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
        keyword={revealedKeyword ?? "???"}
        score={roundScore}
        onDismiss={() => setShowCelebration(false)}
      />

      <div className="grid grid-cols-1 md:grid-cols-[3fr_2fr] gap-4 max-w-5xl mx-auto">
        {/* Left: gameplay */}
        <div className="flex flex-col gap-3">
          {/* Admin controls strip — only visible to admin */}
          {isAdmin && <AdminInGameControlBar roundId={roundId} />}

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
              roomId={ROOM_ID}
              roundId={roundId}
              disabled={false}
              onSolved={handleSolved}
            />
          )}
          {surrendered && (
            <KeywordRevealCard
              keyword={revealedKeyword ?? "(đáp án sẽ hiện khi ván game kết thúc)"}
            />
          )}
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
          <HintPanel roomId={ROOM_ID} roundId={roundId} uid={uid} roundStatus={roundStatus} />
          <GuessHistorySortedList />
        </div>

        {/* Right: results + leaderboard (desktop) */}
        <div className="hidden md:flex flex-col gap-3">
          <RealtimeRoundResultsBoard
            roomId={ROOM_ID}
            roundId={roundId}
            activePlayers={activePlayers}
          />
          <CumulativeScoreLeaderboardPanel roomId={ROOM_ID} />
        </div>
      </div>
    </div>
  );
}
