# Phase 05 — Game Creation: Gemini Call, Validate, Normalize, Hash, Write termIndex + hintPool to Firestore

**Status:** ⬜ Todo  
**Priority:** High  
**Effort:** L (4–5h)  
**Requires:** Phase 02, 03, 04

---

## Overview

Admin clicks "Create New Game" → Gemini generates data → validate → normalize → hash → batch write termIndex (1000 docs) + hintPool (~19 docs) + roundSecret → round status becomes `ready`.

---

## Firestore paths written in this phase

```
rooms/{roomId}/rounds/{roundId}/                    Round doc
rooms/{roomId}/rounds/{roundId}/termIndex/{hash}    1000 term hashes
rooms/{roomId}/rounds/{roundId}/hintPool/{rank}     ~19 hint entries (plaintext)
rooms/{roomId}/rounds/{roundId}/private/secret      keyword plaintext
```

---

## Files to create

### `src/lib/firestore/round-firestore-repository.ts`

```ts
import { db } from '@/lib/firebase'
import {
  doc, setDoc, writeBatch, serverTimestamp, updateDoc, collection
} from 'firebase/firestore'
import { nanoid } from 'nanoid'
import type { Round, TermIndexDoc, HintPoolEntry, RoundSecret } from '@/types/game.types'

export async function createRound(roomId: string, createdBy: string): Promise<string> {
  const roundId = nanoid(10)
  const roundSalt = nanoid(16)
  await setDoc(doc(db, 'rooms', roomId, 'rounds', roundId), {
    roundId,
    status: 'draft',
    roundNumber: 1,
    roundSalt,
    termCount: 0,
    createdBy,
    createdAt: serverTimestamp(),
  } satisfies Partial<Round> & { createdAt: unknown })
  return roundId
}

// Firestore batch limit = 500 ops. Split 1000 termIndex into 2 batches.
export async function writeTermIndex(
  roomId: string,
  roundId: string,
  entries: Array<{ hash: string; rank: number; type: 'keyword' | 'related' }>
) {
  const chunks = chunkArray(entries, 499)
  for (const chunk of chunks) {
    const batch = writeBatch(db)
    for (const entry of chunk) {
      const ref = doc(db, 'rooms', roomId, 'rounds', roundId, 'termIndex', entry.hash)
      batch.set(ref, { rank: entry.rank, type: entry.type } satisfies TermIndexDoc)
    }
    await batch.commit()
  }
}

export async function writeHintPool(
  roomId: string,
  roundId: string,
  entries: HintPoolEntry[]
) {
  const batch = writeBatch(db)
  for (const entry of entries) {
    const rankKey = String(entry.rank).padStart(4, '0')
    const ref = doc(db, 'rooms', roomId, 'rounds', roundId, 'hintPool', rankKey)
    batch.set(ref, entry)
  }
  await batch.commit()
}

export async function writeRoundSecret(roomId: string, roundId: string, secret: RoundSecret) {
  await setDoc(doc(db, 'rooms', roomId, 'rounds', roundId, 'private', 'secret'), secret)
}

export async function updateRoundStatus(roomId: string, roundId: string, status: Round['status']) {
  await updateDoc(doc(db, 'rooms', roomId, 'rounds', roundId), { status })
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size))
  return chunks
}
```

---

### `src/features/admin/create-game/create-game-orchestration-service.ts`

Orchestrates the full flow: Gemini → validate → normalize → hash → Firestore write.

```ts
import { generateRoundWithGemini } from '@/lib/gemini/gemini-round-generation-service'
import { normalizeVietnamese } from '@/lib/utils/normalize-vi'
import { hashTerm } from '@/lib/utils/term-hash'
import { buildHintPool } from '@/lib/utils/hint-pool-builder'
import {
  createRound, writeTermIndex, writeHintPool,
  writeRoundSecret, updateRoundStatus
} from '@/lib/firestore/round-firestore-repository'
import { updateDoc, doc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { nanoid } from 'nanoid'

type CreateGameInput = {
  roomId: string
  adminUid: string
  apiKey: string
  model: string
  topic?: string
  difficulty?: 'easy' | 'medium' | 'hard'
}

type CreateGameProgress = {
  step: 'generating' | 'validating' | 'hashing' | 'writing' | 'done'
  message: string
}

export async function createGame(
  input: CreateGameInput,
  onProgress: (p: CreateGameProgress) => void
): Promise<{ roundId: string; keyword: string; previewTerms: Array<{ term: string; rank: number }> }> {
  onProgress({ step: 'generating', message: 'Gemini đang tạo keyword và 1000 từ liên quan...' })
  const generated = await generateRoundWithGemini(input)

  onProgress({ step: 'validating', message: 'Đang kiểm tra dữ liệu...' })
  // Validation already done inside generateRoundWithGemini via Zod

  onProgress({ step: 'hashing', message: 'Đang xử lý và hash dữ liệu...' })
  const roundId = await createRound(input.roomId, input.adminUid)

  // Read roundSalt from just-created round
  const { getDoc } = await import('firebase/firestore')
  const roundSnap = await getDoc(doc(db, 'rooms', input.roomId, 'rounds', roundId))
  const roundSalt = roundSnap.data()!.roundSalt as string

  const normalizedKeyword = normalizeVietnamese(generated.keyword)
  const keywordHash = await hashTerm(roundSalt, normalizedKeyword)

  const termEntries: Array<{ hash: string; rank: number; type: 'keyword' | 'related' }> = []
  termEntries.push({ hash: keywordHash, rank: 1, type: 'keyword' })

  for (const t of generated.relatedTerms) {
    const normalized = normalizeVietnamese(t.term)
    const hash = await hashTerm(roundSalt, normalized)
    termEntries.push({ hash, rank: t.rank, type: 'related' })
  }

  const hintPool = buildHintPool(generated.relatedTerms)

  onProgress({ step: 'writing', message: 'Đang lưu vào database...' })
  await writeTermIndex(input.roomId, roundId, termEntries)
  await writeHintPool(input.roomId, roundId, hintPool)
  await writeRoundSecret(input.roomId, roundId, {
    keyword: generated.keyword,
    normalizedKeyword,
  })
  await updateRoundStatus(input.roomId, roundId, 'ready')

  // Update room's currentRoundId
  await updateDoc(doc(db, 'rooms', input.roomId), { currentRoundId: roundId })

  onProgress({ step: 'done', message: 'Round đã sẵn sàng!' })

  return {
    roundId,
    keyword: generated.keyword,
    previewTerms: generated.relatedTerms.slice(0, 20),
  }
}
```

---

### `src/features/admin/create-game/create-game-modal-dialog.tsx`

```
Dialog: Create New Game
  Tab 1: Generate with Gemini
    - Input: Topic (optional)
    - Select: Difficulty (easy / medium / hard)
    - Select: Model (from admin store)
    - [Generate] button
    - Progress indicator with step message
    - Preview section (after generation):
        - Keyword (visible to admin)
        - Top 20 related terms table
        - hintPool entries (ranks shown)
        - Validation status badge
    - [Confirm & Start Round] button

  Tab 2: Import JSON manually
    - Textarea: paste raw JSON
    - [Validate & Import] button
    - Same preview + confirm flow
```

State machine:
```
idle → generating → preview → confirming → done | error
```

Error handling:
- Gemini API error → toast error, stay on idle
- Validate error → list all errors inline
- Firestore write error → toast, allow retry

---

### `src/features/admin/create-game/import-json-manual-tab.tsx`

```ts
// Parses pasted JSON, runs same Zod validation as Gemini flow
// On success: shows same preview modal
// On confirm: calls createGame() with pre-validated GeneratedRound
```

---

## Todo checklist

- [ ] Create `src/lib/firestore/round-firestore-repository.ts`
- [ ] Create `src/features/admin/create-game/create-game-orchestration-service.ts`
- [ ] Create `src/features/admin/create-game/create-game-modal-dialog.tsx`
- [ ] Create `src/features/admin/create-game/import-json-manual-tab.tsx`
- [ ] Add "Create New Game" button to admin panel that opens the dialog
- [ ] Test: full Gemini flow writes 1001 docs to termIndex (1 keyword + 1000 terms)
- [ ] Test: hintPool has ~19 docs with plaintext terms
- [ ] Test: `private/secret` has keyword plaintext
- [ ] Test: round status changes to `ready`
- [ ] Test: import JSON tab validates correctly and writes same data

---

## Success criteria

- Full flow takes < 45s (Gemini usually 15–30s for 1000 terms)
- Progress messages update in real time
- Admin can see keyword + top 20 terms in preview before confirming
- All 1001 termIndex docs in Firestore after confirm
- hintPool has entries at spread ranks
- round.status = `ready` after confirm
