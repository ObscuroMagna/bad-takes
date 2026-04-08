# Bad Takes — Code Guide

A walkthrough of the codebase so you can find and edit things yourself.

## File Map

```
src/
  App.jsx          Clapperboard app — components, hooks, layout, animations
  InfoPages.jsx    Footer + About/Privacy/Submit modal overlays
  firebase.js      Firebase init (reads VITE_ env vars)
  useTakes.js      Hook: fetches takes from Firebase, falls back to takes.js
  useVotes.js      Hook: real-time votes from Firebase + localStorage persistence
  takes.js         Hardcoded fallback takes (array of strings)
  main.jsx         React 18 entry point (just renders <App />)

.github/ISSUE_TEMPLATE/
  submit-a-take.yml      Issue form for community take submissions
  contact.yml            General contact: bugs, feedback, questions
  commercial-license.yml Issue form for commercial license inquiries
  config.yml             Disables blank issues

public/
  clap.mp3         Clapperboard sound effect
  favicon.ico      Favicon
  manifest.json    PWA manifest
  sw.js            Service worker
  icons/           PWA app icons

takes-cli.mjs     CLI tool for managing takes via Firebase REST API
THEMES.md         Theme system design doc (not yet implemented in code)
.env.example      Template for environment variables
```

## App.jsx Breakdown

Everything lives in one file. Here's what's in it and roughly where:

### Helper Components (top of file)

**`ClapperStripes`** — Renders the diagonal black/white stripes on the clapperboard bars. Takes `skew` and `origin` props so the top and bottom bars form chevrons that meet at the seam. The top bar uses `skew={20} origin="bottom"` and the bottom uses `skew={-20} origin="top"`.

**`Clapperboard`** — The full clapperboard visual: board body with film details (PROD, DIRECTOR, DATE), the animated top clapper bar, and the static bottom bar. The `isOpen` prop controls the hinge animation. `onAnimationEnd` fires when the clapper snaps shut.

**`PopcornKernel`** — A CSS blob particle. Spawns at a position and animates upward with rotation and fade. Randomized size, shape, and duration. Uses `useState` + `requestAnimationFrame` to trigger CSS transitions.

**`EmojiParticle`** — Same idea as PopcornKernel but renders an emoji character. Used for rare drops.

### Hooks (middle of file)

**`useShake`** — Listens for DeviceMotion events and calls `onShake` when the phone is shaken hard enough. Handles the iOS permission request. Threshold and cooldown are built in.

**`useIsMobile`** — Returns `true` when viewport is under 600px. Used throughout for layout decisions.

**`ClapperWrap`** — A responsive wrapper that measures the viewport and scales the 340px-wide clapperboard down on small screens using CSS `transform: scale()`.

### Utility Functions

**`hashTake(text)`** — Generates a 6-character base36 hash from a take string. Used as the key for votes in Firebase and for URL hash routing. This same function exists in the CLI (`takes-cli.mjs`) — if you change one, change both.

### Main App Component

The `App` function starting around line 368. Here's the flow:

1. **State setup** — current take index, animation state, particles, opacity
2. **URL hash resolution** — on load, checks if `#hash` in the URL matches a take and jumps to it
3. **Shuffle queue** — `drawNext()` uses Fisher-Yates to cycle through all takes before repeating
4. **Clap sound** — preloads `clap.mp3`, plays on clapperboard snap
5. **Particle spawning** — `spawnParticles()` creates 12 popcorn kernels, with a 12% chance of a bonus emoji burst
6. **`nextTake()`** — the main action: opens clapper → waits 300ms → closes → new take appears
7. **Layout** — renders title, subtitle, ClapperWrap, take display area, vote buttons, share/copy buttons

### Layout Structure

```
Outer container (full viewport, dark gradient, flex-column)
  ├── Spotlight overlay (radial gradient, decorative)
  ├── Top spacer (fixed height, prevents content shift)
  ├── Title "BAD TAKES"
  ├── Subtitle
  ├── ClapperWrap
  │     ├── Clapperboard
  │     └── Particles (popcorn + emoji)
  └── Bottom section (min-height reserves space)
        ├── Take display
        │     ├── Desktop: [trash btn] [film strip] [trophy btn]
        │     └── Mobile: [film strip] then [trash] [trophy] below
        ├── Verdict label (TRASH → CERTIFIED BANGER based on vote ratio)
        ├── Share / Copy link buttons
        └── "TAP CLAPPERBOARD" hint text
```

### Vote Buttons

Two layouts depending on `isMobile`:
- **Desktop**: trash (left) and trophy (right) flank the film strip in a row
- **Mobile**: both buttons sit below the film strip in a centered row

Both call `castVote("down")` or `castVote("up")`. After voting, the unselected button fades to 30% opacity and the selected one scales up.

### Verdict System

An inline IIFE inside the JSX calculates the verdict from the up/down vote ratio:
- 0–20% up → TRASH
- 21–40% → PRETTY BAD
- 41–60% → MEH
- 61–80% → SOLID TAKE
- 81–100% → CERTIFIED BANGER

## InfoPages.jsx

Exports two components consumed by `App.jsx`:

- **`Footer`** — small uppercase link row pinned to the bottom of the viewport via `marginTop: auto` on the outer flex column. Buttons call `onOpen("about" | "privacy" | "submit")`; the GitHub source link is a plain `<a>`.
- **`InfoModal`** — full-screen dimmed overlay with a centered card. Closes on backdrop click, the × button, or `Escape`. Locks body scroll while open. Content for each modal type lives in the `MODAL_CONTENT` map at the top of the file — edit there to change copy.

The Submit modal CTA links to a pre-filled GitHub issue using the `submit-a-take.yml` template under `.github/ISSUE_TEMPLATE/`. Same pattern is used for commercial license inquiries from `LICENSING.md` / `README.md`. There is no email contact path anywhere in the project — all inbound contact routes through GitHub Issues.

## useTakes.js

Subscribes to the `takes` node in Firebase. Returns `{ takes, loading }`. If Firebase is empty or fails, keeps the hardcoded fallback array from `takes.js`.

## useVotes.js

Subscribes to the `votes` node in Firebase. Returns `{ votes, getVote, voted, castVote, resetVoted }`.

Key details:
- Votes are stored as `votes/{hash}/up` and `votes/{hash}/down` (numbers)
- `castVote` uses `runTransaction` for atomic increments (safe for concurrent users)
- On vote, saves the choice to localStorage under `badtakes_votes` so it persists across page refreshes
- When `activeHash` changes, checks localStorage and restores the previous vote state

## takes-cli.mjs

Node.js script for managing takes from the terminal. No build step needed — just `node takes-cli.mjs`.

Auth flow: starts a local HTTP server on port 9876 (localhost only), serves a page with the Firebase JS SDK that does Google sign-in via popup. The token gets sent back to the CLI server and cached in `.auth-token.json`. Tokens auto-refresh.

Reads `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, and `VITE_FIREBASE_DATABASE_URL` from your `.env` file. Optionally reads `VITE_SITE_URL` to print shareable per-take links in the `list` output.

The `tally` command includes its own copy of `hashTake()` to match take text to vote keys — keep this in sync with the one in `App.jsx`.

## Firebase Schema

```
takes/
  0: "Hot dogs are sandwiches"
  1: "Cereal is soup"
  ...

votes/
  {6-char-hash}/
    up: 42
    down: 7
  {another-hash}/
    up: 3
    down: 15
```

## Common Edits

**Add a take without the CLI**: Firebase Console → Realtime Database → `takes` node → add a new numbered child with the take string as the value.

**Change the verdict labels**: In `App.jsx`, search for `TRASH` — you'll find the verdicts array around line 776. Edit the `icon`, `label`, or `color` values.

**Change particle colors**: Search for `POPCORN_COLORS` near line 179. It's an array of hex codes.

**Change rare drop emojis**: Search for `RARE_EMOJIS` near line 185. Swap in whatever emojis you want. Adjust `RARE_CHANCE` (0.12 = 12%) to change how often they appear.

**Change the mobile breakpoint**: Search for `useIsMobile` — the default is 600px.

**Change the clapperboard size**: `CLAP_NATIVE_W` (340) and `CLAP_NATIVE_H` (268) near line 310. The `ClapperWrap` component handles scaling it down for small screens.

**Add a theme**: See `THEMES.md` for the full design. The theme system isn't wired up in code yet — when you're ready, create `src/themes.js` with the config objects and consume them via React context.
