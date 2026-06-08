import { RouterProvider } from "@tanstack/react-router";
import { router } from "./tanstack-router-route-definitions";

export default function App() {
  return <RouterProvider router={router} />;
}
