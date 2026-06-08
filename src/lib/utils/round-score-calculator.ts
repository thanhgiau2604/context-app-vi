// Scoring formula from design doc (brainstorm section 9)
const HINT_PENALTIES = [25, 45, 70]

function getBaseScore(bestRank: number | null): number {
  if (!bestRank) return 0
  if (bestRank === 1) return 1000
  if (bestRank <= 3) return 750
  if (bestRank <= 10) return 500
  if (bestRank <= 50) return 250
  if (bestRank <= 100) return 120
  if (bestRank <= 300) return 40
  if (bestRank <= 1000) return 10
  return 0
}

function getSpeedBonus(status: 'solved' | 'surrendered', durationSec: number): number {
  if (status !== 'solved') return 0
  return Math.max(0, 200 - Math.floor(durationSec * 1.5))
}

export function calculateRoundScore(params: {
  status: 'solved' | 'surrendered'
  bestRank: number | null
  durationSec: number
  guessCount: number
  usedHints: number
}): number {
  const base = getBaseScore(params.bestRank)
  const solvedBonus = params.status === 'solved' ? 300 : 0
  const speedBonus = getSpeedBonus(params.status, params.durationSec)
  const guessPenalty = Math.min(params.guessCount * 3, 120)
  const hintPenalty = Array.from({ length: params.usedHints }, (_, i) => HINT_PENALTIES[i] ?? 0)
    .reduce((a, b) => a + b, 0)
  const surrenderPenalty = params.status === 'surrendered' ? 80 : 0

  return Math.max(0, base + solvedBonus + speedBonus - guessPenalty - hintPenalty - surrenderPenalty)
}
