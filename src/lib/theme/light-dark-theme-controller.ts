// Theme controller — switches between the default dark theme and the opt-in
// light theme. The theme is a single class on <html> ("dark" | "light"); CSS in
// index.css supplies the token values for each. Choice persists in localStorage
// so it survives reloads. An inline script in index.html applies the saved theme
// before first paint (no flash) — this module is the runtime/React-facing API.

export type Theme = "dark" | "light";

const STORAGE_KEY = "contextto-theme";

export function getStoredTheme(): Theme {
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved === "light" ? "light" : "dark";
}

// Apply theme to <html>: keep the dark/light class mutually exclusive so the
// Tailwind `dark:` variant (used by shadcn) only fires in dark mode.
export function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.classList.toggle("light", theme === "light");
}

export function setTheme(theme: Theme): void {
  localStorage.setItem(STORAGE_KEY, theme);
  applyTheme(theme);
}

export function toggleTheme(): Theme {
  const next: Theme = getStoredTheme() === "dark" ? "light" : "dark";
  setTheme(next);
  return next;
}
