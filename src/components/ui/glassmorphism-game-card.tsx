import { cn } from "@/lib/tailwind-class-merge-utils";

type Props = {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
};

// Glassmorphism card for game surfaces using Midnight Arena design tokens
export function GameCard({ children, className, glow = false }: Props) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-game-surface-1 backdrop-blur-md",
        glow && "shadow-[0_0_24px_var(--game-glow-primary)]",
        className,
      )}
    >
      {children}
    </div>
  );
}
