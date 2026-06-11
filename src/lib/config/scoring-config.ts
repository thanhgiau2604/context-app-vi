// Scoring constants — spec §8. Baseline-tunable after playtest (TBD-tunable).
// Single source of truth for round-score-calculator.ts.

export const SOLVE_BASE = 1000; // điểm gốc khi giải được
export const GUESS_PENALTY = 10; // trừ mỗi lần đoán (sau lần đầu)
export const MIN_SOLVE_SCORE = 200; // sàn điểm giải, dù đoán nhiều

export const TIME_GRACE_SEC = 60; // miễn phạt thời gian trong grace đầu
export const TIME_PENALTY_PER_SEC = 1; // trừ mỗi giây sau grace
export const TIME_PENALTY_CAP = 400; // trần phạt thời gian

export const PROX_WINDOW_SEC = 60; // cửa sổ xét proximity bonus
export const PROX_THRESHOLD = 50; // chỉ thưởng khi bestRank ≤ ngưỡng
export const PROX_FACTOR = 2; // hệ số: (THRESHOLD - bestRank) * FACTOR

// Phạt hint leo thang theo lượt dùng: hint 1 = −25, 2 = −45, 3 = −70 (đủ 3 = −140).
export const HINT_PENALTIES = [25, 45, 70];
