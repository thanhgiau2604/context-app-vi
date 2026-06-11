# Phase 04 — Persistent Guess-Input Focus

**Priority:** Medium · **Status:** pending

## Problem (user point 5)

Guess input loses focus (e.g. after submit). Player must re-click to type next guess. Should always hold focus.

## Current

[guess-input-form.tsx](../../src/features/gameplay/guess/guess-input-form.tsx) uses `autoFocus` (initial mount only). After submit, `disabled={loading||disabled}` toggles true→false; while disabled the input blurs and does not auto-refocus.

## Fix

**File:** `src/features/gameplay/guess/guess-input-form.tsx`

1. Add `const inputRef = useRef<HTMLInputElement>(null)`; attach to `<Input ref={inputRef} />`.
   - Verify shadcn `Input` forwards ref (it does — `React.forwardRef`). If not, confirm.
2. After successful submit (`setInput("")` in `finally`/`try`), call `inputRef.current?.focus()`.
3. Re-focus when `loading` transitions back to false: `useEffect(() => { if (!loading && !disabled) inputRef.current?.focus(); }, [loading, disabled])`.

Keep `autoFocus` for first mount. Do not steal focus while a modal/confirm (surrender) is open — input is unmounted when `!isPlaying`, so no conflict.

## Edge Cases

- Surrender-confirm box open: input unmounts (`isPlaying` false) → no focus fight.
- Celebration overlay: also unmounts input.

## Todo

- [ ] Add `inputRef`, forward to `Input`
- [ ] Refocus after submit + on `loading` false via effect
- [ ] Verify no focus steal during overlays/modals
- [ ] `npx tsc -b` clean

## Success Criteria

After submitting a guess, the input stays focused; player can type immediately without clicking.
