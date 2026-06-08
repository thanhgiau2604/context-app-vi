import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Toaster } from "sonner";
import { playerRoutes } from "@/routes/player-room-routes";
import { adminRoutes } from "@/routes/admin-panel-routes";

const router = createBrowserRouter([...playerRoutes, ...adminRoutes]);

export default function App() {
  return (
    <>
      <RouterProvider router={router} />
      <Toaster richColors position="top-center" />
    </>
  );
}
