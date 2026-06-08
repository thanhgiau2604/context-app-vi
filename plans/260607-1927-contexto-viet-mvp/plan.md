# Plan: Contexto Việt MVP

**Brainstorm:** [docs/brainstorm](../../docs/brainstorm-website-game-contexto-tieng-viet-frontend-gemini.md)  
**Design:** [DESIGN.md](../../DESIGN.md)  
**Status:** 📋 Planning

---

## Stack hiện tại

- Vite + React 18 + TypeScript (initialized)
- Tailwind CSS 4 + `tw-animate-css` (installed, CSS tokens đầy đủ trong `src/index.css`)
- shadcn/ui new-york (initialized, `components.json` ready)
- `src/lib/tailwind-class-merge-utils.ts` có `cn()` utility
- Bun package manager
- DESIGN.md: complete design system (Midnight Arena theme, OKLCH tokens, rank colors)

**Chưa cài:** Firebase, Zustand, Motion, Zod, nanoid, lucide-react, react-router-dom

---

## Phases

| # | Phase | Status | Effort |
|---|-------|--------|--------|
| 01 | [Install Packages & Setup Project Folder Structure](phase-01-install-packages-and-setup-project-folder-structure.md) | ⬜ | S |
| 02 | [Firestore Types, Schemas, Firebase Init & Anonymous Auth](phase-02-firestore-types-schemas-firebase-init-anonymous-auth.md) | ⬜ | M |
| 03 | [Admin Settings UI, Gemini Key Storage & Gemini REST Service](phase-03-admin-settings-ui-gemini-key-storage-and-gemini-rest-service.md) | ⬜ | M |
| 04 | [Room Lifecycle: Admin Create Room, Player Join with Name, Lobby Realtime](phase-04-room-lifecycle-admin-create-room-player-join-with-name-lobby-realtime.md) | ⬜ | M |
| 05 | [Game Creation: Gemini Call, Validate, Hash, Write Firestore hintPool](phase-05-game-creation-gemini-call-validate-hash-write-firestore-hintpool.md) | ⬜ | L |
| 06 | [Gameplay Core: Guess Input, Hash Lookup, Rank Display & Local History](phase-06-gameplay-core-guess-input-hash-lookup-rank-display-local-history.md) | ⬜ | L |
| 07 | [Hint System: Dynamic hintPool Lookup (bestRank - random step 1–5)](phase-07-hint-system-dynamic-hintpool-lookup-bestrank-minus-random-step.md) | ⬜ | M |
| 08 | [Round Completion: Scoring Formula, Solved, Surrender, Next Round](phase-08-round-completion-scoring-formula-solved-surrender-next-round.md) | ⬜ | M |
| 09 | [Realtime Results Board, Cumulative Leaderboard & Final Podium](phase-09-realtime-results-board-cumulative-leaderboard-final-podium.md) | ⬜ | M |
| 10 | [UI Polish: Motion Animations, Rank Colors, Confetti & Responsive Layout](phase-10-ui-polish-motion-animations-rank-colors-confetti-responsive-layout.md) | ⬜ | L |
| 11 | [Firestore Security Rules: Admin/Player Permissions & termIndex Protection](phase-11-firestore-security-rules-admin-player-permissions-termindex-protection.md) | ⬜ | S |

---

## Dependencies

```
01 → 02 → 03
          02 → 04
          02 → 05 (requires 03)
          02 → 06 (requires 04, 05)
               06 → 07
               06 → 08 (requires 07)
                    08 → 09
          02 → 10 (parallel with 06–09, polish last)
          02 → 11 (last, after all features stable)
```

Sequential chain: 01 → 02 → 04 → 05 → 06 → 07 → 08 → 09  
Phase 03 seeded by 02, needed before 05.  
Phase 10 và 11 sau khi gameplay core stable.

---

## Feature folder structure

```
src/
├── components/ui/              # shadcn components
├── features/
│   ├── admin/
│   │   ├── settings/           # Gemini key UI + service
│   │   ├── create-game/        # Game creation modal + services
│   │   └── panel/              # Admin dashboard
│   ├── room/
│   │   ├── lobby/              # Lobby + player list
│   │   └── join/               # Player join flow
│   ├── gameplay/
│   │   ├── guess/              # Guess input + history
│   │   ├── hint/               # Hint panel + logic
│   │   └── round/              # Round header + status
│   └── results/
│       ├── public-board/       # Realtime solved/surrendered board
│       └── leaderboard/        # Final podium
├── lib/
│   ├── firebase.ts             # Firebase init (Auth + Firestore)
│   ├── firestore/
│   │   ├── room-repository.ts
│   │   ├── round-repository.ts
│   │   └── player-repository.ts
│   ├── gemini/
│   │   ├── gemini-service.ts   # REST call
│   │   └── prompt-builder.ts   # Vietnamese Contexto prompt
│   └── utils/
│       ├── normalize-vi.ts     # Vietnamese text normalize
│       ├── term-hash.ts        # SHA-256 with roundSalt
│       └── hint-pool-builder.ts # Select ~25 terms for hintPool
├── stores/
│   ├── game-store.ts           # localGuesses, bestRank, usedHints
│   └── admin-store.ts          # geminiKey, model, roomId
├── types/
│   └── game.types.ts           # All Firestore document types
├── hooks/
│   ├── use-room.ts             # Firestore room listener
│   ├── use-round.ts            # Firestore round listener
│   └── use-public-results.ts   # Firestore publicResults listener
└── routes/
    ├── player-routes.tsx        # /join, /room/:roomId
    └── admin-routes.tsx         # /admin, /admin/settings
```

---

## Key decisions

- **Bun** làm package manager
- **react-router-dom v7** cho routing
- **motion** (Motion for React) thay cho framer-motion
- **Gemini REST API** trực tiếp, không dùng SDK để giảm bundle
- **hintPool** tự gen từ relatedTerms (không qua Gemini)
- **SHA-256 Web Crypto API** cho term hashing
- **Firestore batch write** khi ghi 1000 termIndex docs (500 docs/batch)
