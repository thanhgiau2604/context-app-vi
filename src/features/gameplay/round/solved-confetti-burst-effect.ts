import confetti from "canvas-confetti";

// Fires confetti burst centered on screen when player solves the keyword
export function fireSolvedConfetti() {
  confetti({
    particleCount: 120,
    spread: 80,
    origin: { y: 0.6 },
    colors: ["#f5c518", "#7c3aed", "#06b6d4", "#10b981"],
  });
}
