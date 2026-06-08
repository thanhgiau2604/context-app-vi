import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { playerRoutes } from '@/routes/player-room-routes'
import { adminRoutes } from '@/routes/admin-panel-routes'

const router = createBrowserRouter([
  ...playerRoutes,
  ...adminRoutes,
])

export default function App() {
  return <RouterProvider router={router} />
}
