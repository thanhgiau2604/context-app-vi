import { PlayerJoinRoomPage } from "@/features/room/join/player-join-room-page";
import { RoomWaitingLobbyPage } from "@/features/room/lobby/room-waiting-lobby-page";
import { GamePageLayout } from "@/features/gameplay/round/game-page-layout";
import { FinalGamePodiumPage } from "@/features/results/leaderboard/final-game-podium-page";

export const playerRoutes = [
  { path: "/", element: <PlayerJoinRoomPage /> },
  { path: "/room/:roomId", element: <RoomWaitingLobbyPage /> },
  { path: "/room/:roomId/game", element: <GamePageLayout /> },
  { path: "/room/:roomId/podium", element: <FinalGamePodiumPage /> },
];
