// Scoring constants — spec §8. Baseline-tunable after playtest (TBD-tunable).
// Single source of truth for round-score-calculator.ts.

// Thứ tự ưu tiên: SỐ LẦN ĐOÁN > THỜI GIAN. Ít lần đoán luôn thắng, dù chậm hơn.
// Bảo đảm bằng GUESS_PENALTY (10) > TIME_PENALTY_CAP (8): thêm 1 lần đoán (−10)
// luôn lớn hơn toàn bộ chênh lệch thời gian tối đa (−8). Thời gian chỉ phân định
// giữa hai người BẰNG số lần đoán.
export const SOLVE_BASE = 1000; // điểm gốc khi giải được
export const GUESS_PENALTY = 10; // trừ mỗi lần đoán (sau lần đầu) — yếu tố chính
export const MIN_SOLVE_SCORE = 200; // sàn điểm giải, dù đoán nhiều

export const TIME_GRACE_SEC = 30; // miễn phạt thời gian trong grace đầu
export const TIME_PENALTY_PER_SEC = 1; // trừ mỗi giây sau grace
export const TIME_PENALTY_CAP = 8; // trần phạt thời gian — luôn < GUESS_PENALTY

export const PROX_WINDOW_SEC = 60; // cửa sổ xét proximity bonus
export const PROX_THRESHOLD = 50; // chỉ thưởng khi bestRank ≤ ngưỡng
export const PROX_FACTOR = 2; // hệ số: (THRESHOLD - bestRank) * FACTOR

// Phạt hint leo thang theo lượt dùng: hint 1 = −25, 2 = −45, 3 = −70 (đủ 3 = −140).
export const HINT_PENALTIES = [25, 45, 70];
