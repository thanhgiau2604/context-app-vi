import confetti from "canvas-confetti";

// Fires confetti burst centered on screen when player solves the keyword
export function fireSolvedConfetti() {
  confetti({
    particleCount: 120,
    spread: 80,
    origin: { y: 0.6 },
    // Neon Cyber Arena palette: matrix-green, cyan, magenta, electric-blue
    colors: ["#39ff14", "#00f0ff", "#ff1ad9", "#1a8fff"],
  });
}
