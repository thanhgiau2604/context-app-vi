import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { subscribeToGameState } from "@/lib/firestore/game-state-singleton-firestore-repository";
import { getRoundKeyword } from "@/lib/firestore/round-with-embedded-terms-firestore-repository";
import { useRoundDataLoader } from "@/hooks/use-round-data-loader";
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
import { PROX_THRESHOLD, PROX_WINDOW_SEC } from "@/lib/config/scoring-config";
import { usePublicResultsRealtime } from "@/hooks/use-public-results-realtime-listener";
import { useAutoEndRoundWhenAllFinished } from "@/hooks/use-auto-end-round-when-all-finished";
import { RealtimeRoundResultsBoard } from "@/features/results/public-board/realtime-round-results-board";
import { CumulativeScoreLeaderboardPanel } from "@/features/results/leaderboard/cumulative-score-leaderboard-panel";
import type { GameState } from "@/types/game-firestore-types";

export function GamePageLayout() {
  const navigate = useNavigate();
  const {
    uid,
    playerName,
    isAdmin,
    currentRoundId,
    roundTerms,
    keywordHash,
    localGuesses,
    bestRank,
    usedHints,
    setRound,
    resetRoundState,
  } = useGameStore();

  const [gameState, setGameState] = useState<GameState | null>(null);
  const [startedAtMs, setStartedAtMs] = useState(Date.now());
  const [finishedAtMs, setFinishedAtMs] = useState<number | null>(null);
  const [solved, setSolved] = useState(false);
  const [surrendered, setSurrendered] = useState(false);
  const [showSurrenderConfirm, setShowSurrenderConfirm] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [roundScore, setRoundScore] = useState(0);
  const [revealedKeyword, setRevealedKeyword] = useState<string | null>(null);
  const [firstNearMissWithin60s, setFirstNearMissWithin60s] = useState(false);
  const [lastRoundId, setLastRoundId] = useState<string | null>(null);
  const prevRoundIdRef = useRef<string | null>(null);

  // Detect near-miss: bestRank ≤ PROX_THRESHOLD within PROX_WINDOW_SEC of round start.
  // Gate must mirror calculator's proximity gate (scoring-config) — keep in sync via shared consts.
  useEffect(() => {
    if (
      !firstNearMissWithin60s &&
      bestRank !== null &&
      bestRank <= PROX_THRESHOLD &&
      Date.now() - startedAtMs <= PROX_WINDOW_SEC * 1000
    ) {
      setFirstNearMissWithin60s(true);
    }
  }, [bestRank, firstNearMissWithin60s, startedAtMs]);

  useEffect(() => {
    return subscribeToGameState((state) => {
      setGameState(state);

      if (state?.currentRoundId) {
        if (prevRoundIdRef.current && prevRoundIdRef.current !== state.currentRoundId) {
          resetRoundState();
          setSolved(false);
          setSurrendered(false);
          setShowSurrenderConfirm(false);
          setShowCelebration(false);
          setRevealedKeyword(null);
          setFirstNearMissWithin60s(false);
          setStartedAtMs(Date.now());
          setFinishedAtMs(null);
        }
        prevRoundIdRef.current = state.currentRoundId;
        setLastRoundId(state.currentRoundId);
        setRound(state.currentRoundId);
      }

      if (state?.status === "waiting") void navigate({ to: "/lobby" });
      if (state?.status === "ended") void navigate({ to: "/podium" });
    });
  }, [setRound, resetRoundState, navigate]);

  const roundId = currentRoundId ?? gameState?.currentRoundId ?? null;

  // Load round terms + keywordHash into store — one fetch per round, no per-guess reads
  useRoundDataLoader(roundId);

  const publicResults = usePublicResultsRealtime(roundId ?? lastRoundId);
  const activePlayers = gameState?.playerCount ?? 0;

  // Admin auto-ends the round only when ALL active players have finished (spec §4.3).
  useAutoEndRoundWhenAllFinished(roundId, isAdmin);

  async function fetchAndRevealKeyword(rId: string) {
    try {
      const kw = await getRoundKeyword(rId);
      setRevealedKeyword(kw);
    } catch {
      // stays hidden if fetch fails
    }
  }

  async function handleSolved() {
    if (!roundId || !uid || !playerName) return;
    setSolved(true);
    setFinishedAtMs(Date.now());
    try {
      const score = await finishPlayerRound({
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
      setSolved(false);
    }
  }

  async function handleSurrender() {
    if (!roundId || !uid || !playerName) return;
    setSurrendered(true);
    setFinishedAtMs(Date.now());
    setShowSurrenderConfirm(false);
    const surrenderBestRank = localGuesses.reduce<number | null>(
      (min, g) => (g.rank === null ? min : min === null || g.rank < min ? g.rank : min),
      null,
    );
    try {
      await finishPlayerRound({
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

  // Between-rounds: playing but no active currentRoundId
  const isBetweenRounds =
    gameState?.status === "playing" && !gameState.currentRoundId && !!lastRoundId;
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
  const roundDataReady = roundTerms.length > 0 && !!keywordHash;

  if (!roundId || !roundDataReady || !uid) {
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
        <div className="flex flex-col gap-3">
          {isAdmin && <AdminInGameControlBar roundId={roundId} />}

          <RoundStatusHeaderBar
            roundNumber={1}
            startedAtMs={startedAtMs}
            endAtMs={finishedAtMs}
            onSurrender={() => setShowSurrenderConfirm(true)}
            surrenderDisabled={!isPlaying}
          />

          {isPlaying && <GuessInputForm disabled={false} onSolved={handleSolved} />}

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

          <HintPanel roundStatus={roundStatus} />
          <GuessHistorySortedList />
        </div>

        <div className="hidden md:flex flex-col gap-3">
          <RealtimeRoundResultsBoard
            roundId={roundId}
            activePlayers={activePlayers}
            results={publicResults}
          />
          <CumulativeScoreLeaderboardPanel />
        </div>
      </div>
    </div>
  );
}
