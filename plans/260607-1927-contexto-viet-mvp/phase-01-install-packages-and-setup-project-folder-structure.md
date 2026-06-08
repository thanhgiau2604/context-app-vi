# Phase 01 — Install Packages & Setup Project Folder Structure

**Status:** ⬜ Todo  
**Priority:** Critical — blocks all other phases  
**Effort:** S (< 1h)

---

## Overview

Install missing dependencies, create folder structure, setup routing, configure Firebase env vars.

---

## Packages to install

```bash
bun add firebase zustand motion zod nanoid lucide-react react-router-dom
bun add -d @types/node
```

| Package | Purpose |
|---------|---------|
| `firebase` | Auth Anonymous + Firestore SDK |
| `zustand` | Game state + Admin state stores |
| `motion` | Animations (Motion for React, successor to framer-motion) |
| `zod` | Validate Gemini JSON output |
| `nanoid` | Generate `roundSalt` |
| `lucide-react` | Icons (shadcn already configured with lucide) |
| `react-router-dom` | Client-side routing |

---

## Install shadcn components

Install components needed across phases:

```bash
bunx shadcn@latest add button input card badge dialog sheet toast select switch label separator progress skeleton tabs
```

---

## Folder structure to create

```bash
mkdir -p src/features/admin/{settings,create-game,panel}
mkdir -p src/features/room/{lobby,join}
mkdir -p src/features/gameplay/{guess,hint,round}
mkdir -p src/features/results/{public-board,leaderboard}
mkdir -p src/lib/{firestore,gemini,utils}
mkdir -p src/stores
mkdir -p src/types
mkdir -p src/hooks
mkdir -p src/routes
```

---

## Environment variables

Create `.env.local` (never commit):

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

Verify `.gitignore` has `.env.local`.

---

## Routing setup

**File:** `src/routes/player-routes.tsx`

```tsx
// Player-facing routes: join flow, room gameplay
export const playerRoutes = [
  { path: '/', element: <JoinPage /> },
  { path: '/room/:roomId', element: <GamePage /> },
]
```

**File:** `src/routes/admin-routes.tsx`

```tsx
// Admin-only routes: panel + settings
export const adminRoutes = [
  { path: '/admin', element: <AdminPanel /> },
  { path: '/admin/settings', element: <AdminSettings /> },
]
```

**File:** `src/App.tsx` — wire router:

```tsx
import { createBrowserRouter, RouterProvider } from 'react-router-dom'

const router = createBrowserRouter([
  ...playerRoutes,
  ...adminRoutes,
])

export default function App() {
  return <RouterProvider router={router} />
}
```

---

## main.tsx

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
```

---

## Todo checklist

- [ ] `bun add firebase zustand motion zod nanoid lucide-react react-router-dom`
- [ ] Install shadcn components via bunx
- [ ] Create `.env.local` with Firebase config values
- [ ] Create folder structure
- [ ] Create `src/routes/player-routes.tsx` (placeholder pages)
- [ ] Create `src/routes/admin-routes.tsx` (placeholder pages)
- [ ] Update `src/App.tsx` with RouterProvider
- [ ] Run `bun run dev` — verify app starts without errors

---

## Success criteria

- `bun run dev` runs clean, no TS errors
- Browser navigates to `/` and `/admin` without crash
- All package imports resolve correctly
