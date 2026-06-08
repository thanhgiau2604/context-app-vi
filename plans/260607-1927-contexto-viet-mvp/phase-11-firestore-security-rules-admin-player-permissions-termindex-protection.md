# Phase 11 — Firestore Security Rules: Admin/Player Permissions & termIndex Protection

**Status:** ⬜ Todo  
**Priority:** High  
**Effort:** S (2h)  
**Requires:** All phases stable

---

## Overview

Write production-ready Firestore Security Rules. Block: list termIndex, player modifying room status, reading keyword before solved/surrendered. Test with Firebase Emulator.

---

## Rules file: `firestore.rules`

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function signedIn() {
      return request.auth != null;
    }

    function isAdmin(roomId) {
      return signedIn()
        && get(/databases/$(database)/documents/rooms/$(roomId)).data.adminUid == request.auth.uid;
    }

    function isSelf(uid) {
      return signedIn() && request.auth.uid == uid;
    }

    function playerFinished(roomId, roundId) {
      // Player can read secret if they solved or surrendered
      let pr = get(/databases/$(database)/documents/rooms/$(roomId)/rounds/$(roundId)/playerRounds/$(request.auth.uid));
      return pr.data.status == 'solved' || pr.data.status == 'surrendered';
    }

    function roundRevealed(roomId, roundId) {
      let r = get(/databases/$(database)/documents/rooms/$(roomId)/rounds/$(roundId));
      return r.data.status == 'revealed' || r.data.status == 'completed';
    }

    // ── Rooms ──────────────────────────────────────────
    match /rooms/{roomId} {
      allow read: if signedIn();
      allow create: if signedIn()
        && request.resource.data.adminUid == request.auth.uid;
      allow update: if isAdmin(roomId);
      allow delete: if false;

      // ── Players ────────────────────────────────────
      match /players/{uid} {
        allow read: if signedIn();
        allow create: if isSelf(uid);
        allow update: if isSelf(uid) || isAdmin(roomId);
        allow delete: if false;
      }

      // ── Rounds ─────────────────────────────────────
      match /rounds/{roundId} {
        allow read: if signedIn();
        allow create, update: if isAdmin(roomId);
        allow delete: if false;

        // termIndex: players can get by known hash, cannot list all
        match /termIndex/{termHash} {
          allow get: if signedIn();
          allow list: if false;  // blocks enumeration of all 1000 terms
          allow create, update, delete: if isAdmin(roomId);
        }

        // hintPool: players can get individual entries, cannot list
        match /hintPool/{rank} {
          allow get: if signedIn();
          allow list: if false;
          allow create, update, delete: if isAdmin(roomId);
        }

        // private/secret: admin always, player only after finishing
        match /private/{docId} {
          allow read: if isAdmin(roomId)
            || (signedIn() && (playerFinished(roomId, roundId) || roundRevealed(roomId, roundId)));
          allow create, update, delete: if isAdmin(roomId);
        }

        // playerRounds: self read/write, admin read
        match /playerRounds/{uid} {
          allow read: if isSelf(uid) || isAdmin(roomId);
          allow create: if isSelf(uid);
          allow update: if isSelf(uid);
          allow delete: if false;
        }

        // publicResults: all signed-in can read, self or admin can write
        match /publicResults/{uid} {
          allow read: if signedIn();
          allow create, update: if isSelf(uid) || isAdmin(roomId);
          allow delete: if false;
        }
      }
    }
  }
}
```

---

## Emulator test scenarios

### Setup

```bash
# Install Firebase CLI if needed
bun add -g firebase-tools

# Init emulator
firebase init emulators  # select Firestore + Auth

# Run emulator
firebase emulators:start
```

### Test cases to verify

| Scenario                                            | Expected |
| --------------------------------------------------- | -------- |
| Signed-in player reads `rooms/{roomId}`             | ✅ Allow |
| Unauthenticated reads any doc                       | ❌ Deny  |
| Player creates `players/{ownUid}`                   | ✅ Allow |
| Player creates `players/{otherUid}`                 | ❌ Deny  |
| Player updates `rooms/{roomId}` (not admin)         | ❌ Deny  |
| Admin updates `rooms/{roomId}`                      | ✅ Allow |
| Player `get` known `termIndex/{hash}`               | ✅ Allow |
| Player `list` `termIndex` collection                | ❌ Deny  |
| Player `get` known `hintPool/{rank}`                | ✅ Allow |
| Player `list` `hintPool` collection                 | ❌ Deny  |
| Player reads `private/secret` before solving        | ❌ Deny  |
| Player reads `private/secret` after solving         | ✅ Allow |
| Player reads `private/secret` when round `revealed` | ✅ Allow |
| Player writes own `playerRounds/{uid}`              | ✅ Allow |
| Player writes other's `playerRounds/{otherUid}`     | ❌ Deny  |
| Player writes `publicResults/{ownUid}`              | ✅ Allow |

---

## `firebase.json`

```json
{
  "firestore": {
    "rules": "firestore.rules"
  },
  "hosting": {
    "public": "dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [{ "source": "**", "destination": "/index.html" }]
  },
  "emulators": {
    "auth": { "port": 9099 },
    "firestore": { "port": 8080 },
    "hosting": { "port": 5001 },
    "ui": { "enabled": true, "port": 4000 }
  }
}
```

---

## Connect app to emulator in dev (optional)

```ts
// src/lib/firebase.ts — add at bottom for local dev
if (import.meta.env.DEV) {
  const { connectFirestoreEmulator } = await import("firebase/firestore");
  const { connectAuthEmulator } = await import("firebase/auth");
  connectAuthEmulator(auth, "http://localhost:9099");
  connectFirestoreEmulator(db, "localhost", 8080);
}
```

---

## Todo checklist

- [ ] Create `firestore.rules` at project root
- [ ] Create `firebase.json` at project root
- [ ] Run `firebase emulators:start`
- [ ] Test each scenario in table above using Emulator UI or REST calls
- [ ] Fix any rule failures
- [ ] Deploy rules: `firebase deploy --only firestore:rules`
- [ ] Smoke test production: player cannot list termIndex in DevTools Network tab

---

## Success criteria

- All 16 test scenarios pass in emulator
- Player cannot enumerate termIndex or hintPool via `list`
- Player cannot read `private/secret` before solving/surrendering
- Player cannot write to other players' documents
- Admin-only operations blocked for non-admin uid
