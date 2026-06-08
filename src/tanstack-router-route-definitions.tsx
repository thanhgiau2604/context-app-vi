import { createRouter, createRoute, createRootRoute, Outlet } from "@tanstack/react-router";
import { Toaster } from "sonner";
import { AdminAuthGuard } from "@/features/admin/auth/admin-auth-guard";
import { PlayerJoinRoomPage } from "@/features/room/join/player-join-room-page";
import { RoomWaitingLobbyPage } from "@/features/room/lobby/room-waiting-lobby-page";
import { GamePageLayout } from "@/features/gameplay/round/game-page-layout";
import { FinalGamePodiumPage } from "@/features/results/leaderboard/final-game-podium-page";
import { AdminPanelPage } from "@/features/admin/panel/admin-panel-page";
import { AdminGeminiSettingsPage } from "@/features/admin/settings/admin-gemini-settings-page";

// ── Root route — provides Outlet + global Toaster ──────────────────────────
const rootRoute = createRootRoute({
  component: () => (
    <>
      <Outlet />
      <Toaster richColors position="top-center" />
    </>
  ),
});

// ── Player routes — single-room app, no roomId in URLs ────────────────────
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: PlayerJoinRoomPage,
});

const lobbyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/lobby",
  component: RoomWaitingLobbyPage,
});

const gameRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/game",
  component: GamePageLayout,
});

const podiumRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/podium",
  component: FinalGamePodiumPage,
});

// ── Admin routes (all guarded by AdminAuthGuard) ──────────────────────────
const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin",
  component: () => (
    <AdminAuthGuard>
      <AdminPanelPage />
    </AdminAuthGuard>
  ),
});

const adminSettingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/settings",
  component: () => (
    <AdminAuthGuard>
      <AdminGeminiSettingsPage />
    </AdminAuthGuard>
  ),
});

// ── Router ─────────────────────────────────────────────────────────────────
const routeTree = rootRoute.addChildren([
  indexRoute,
  lobbyRoute,
  gameRoute,
  podiumRoute,
  adminRoute,
  adminSettingsRoute,
]);

export const router = createRouter({ routeTree });

// Type registration for full type-safety in useNavigate, Link, useParams etc.
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
