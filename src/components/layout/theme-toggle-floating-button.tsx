import { useState } from "react";
import { Sun, Moon } from "lucide-react";
import { getStoredTheme, toggleTheme, type Theme } from "@/lib/theme/light-dark-theme-controller";
import { cn } from "@/lib/tailwind-class-merge-utils";

// Floating dark/light switch — mounted once in the root route so it appears on
// every screen. Sits bottom-right above content, out of the game's way.
export function ThemeToggleFloatingButton() {
  const [theme, setThemeState] = useState<Theme>(() => getStoredTheme());
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={() => setThemeState(toggleTheme())}
      aria-label={isDark ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối"}
      title={isDark ? "Giao diện sáng" : "Giao diện tối"}
      className={cn(
        "fixed bottom-4 right-4 z-50 grid size-11 place-items-center rounded-full",
        "game-card neon-glow text-foreground transition-transform hover:scale-105 active:scale-95",
      )}
    >
      {isDark ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
    </button>
  );
}
