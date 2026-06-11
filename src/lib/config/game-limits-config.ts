// Game limits — spec §6, §15.6. Single source of truth for caps + Gemini generation.

// Tối đa người chơi đồng thời (gồm cả admin nếu admin chơi cùng).
export const MAX_PLAYERS = 10;

// Số term liên quan mỗi ván (rank 2–500). Cùng keyword (rank 1) = corpus 500.
export const TARGET_TERM_COUNT = 499;

// Số lần retry khi Gemini trả sai format / thiếu term.
export const MAX_GEMINI_ATTEMPTS = 3;
