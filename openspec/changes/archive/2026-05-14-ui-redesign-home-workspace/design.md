## Context

The app is a Node.js (Express + EJS) hosted Java interview practice platform. Currently it renders a single-page 3-column layout: challenge sidebar, workspace (textarea editor + metadata), and insights panel. Challenges live as individual directories under `challenges/` with separate `challenge.json`, `prompt.md`, `starter/Solution.java`, and `tests/visible-tests.json` files. The Java runtime compiles and evaluates solutions by reading these files from disk. AI review and hinting are wired via Gemini and OpenRouter providers.

A design system exists in `DESIGN.md` — dark mode with Electric Cyan (`#00f0ff`) primary, Hanken Grotesk for UI text, JetBrains Mono for code/labels, glassmorphism elevation, and 8px spacing rhythm.

## Goals / Non-Goals

**Goals:**
- Two-view SPA: home page (challenge table) and challenge workspace, using client-side hash routing
- Single `challenges.json` as the sole source of challenge data, user notes, and scoring
- CodeMirror 6 with Java syntax highlighting and toggleable Vim keymap
- Markdown rendering of challenge details via `marked`
- Per-challenge scoring (test pass rate, attempts, time tracking) and overall progress
- Global AI system prompt (`system-prompt.md`) combined with per-challenge hints/rules
- Full adoption of `DESIGN.md` design system

**Non-Goals:**
- User authentication or multi-user support (stays single-user local)
- Database or external storage (JSON file only)
- Real-time collaboration
- Challenge creation UI (challenges are authored by editing JSON)
- Production deployment or build tooling

## Decisions

### 1. Client-side hash routing over server-side routes

**Decision:** Use `window.location.hash` for routing (`#/home`, `#/challenge/:id`).

**Why:** The server already serves a single EJS shell. Adding server routes for views means duplicating template rendering logic or switching to a framework. Hash routing keeps the server purely as an API + static file server. One EJS template, all routing in `app.js`. Easiest to maintain for a single-developer local tool.

**Alternatives considered:**
- Server-side routes with multiple EJS templates — more files, more complexity, no meaningful benefit
- History API (`pushState`) — cleaner URLs but requires server catch-all routing, more setup

### 2. challenges.json with temp-file extraction for Java runtime

**Decision:** All challenge data (metadata, inline markdown details, starter code as string, test cases as JSON array, hints, rules, notes, scoring) lives in a single `challenges.json` at the project root. At server startup and before Java compilation, the server extracts starter code and test cases to a temp directory structure that mirrors what `java-runtime.js` expects.

**Why:** The user wants a single file to manage. The Java runtime (`ChallengeWorkbench.java`) expects files on disk. Temp extraction bridges this gap. Extraction happens once at startup for the directory structure, and per-run for user-submitted code (which is already the case).

**Structure of `challenges.json`:**
```json
{
  "systemPrompt": "system-prompt.md",
  "challenges": [
    {
      "id": 1,
      "title": "Sum of Two Numbers",
      "level": "beginner",
      "tags": ["math", "basics"],
      "details": "## Problem\nImplement `solve(int a, int b)` and return...",
      "methodContract": "int solve(int a, int b)",
      "explanation": "Use integer addition.",
      "starterCode": "public class Solution {\n  public int solve(int a, int b) {\n    // your code here\n  }\n}",
      "testCases": [
        { "input": "2, 3", "expected": "5" },
        { "input": "-4, 10", "expected": "6" }
      ],
      "hints": [
        "Think about basic arithmetic operations",
        "Java's + operator works with int types"
      ],
      "rules": {
        "maxHintLevel": 3,
        "guidanceStyle": "socratic"
      },
      "resources": ["https://docs.oracle.com/javase/tutorial/java/nutsandbolts/"],
      "examples": ["Input: (2, 3) -> Output: 5"],
      "notes": "",
      "score": null,
      "bestScore": 0,
      "attempts": 0,
      "timeSpentMs": 0,
      "completedAt": null,
      "status": "not-started"
    }
  ]
}
```

**Temp extraction approach:**
- On startup: create `<workspace>/.java-runtime/challenges/` with extracted `challenge-{id}/starter/Solution.java` and `challenge-{id}/tests/visible-tests.json` for each challenge
- The existing `.java-runtime` directory is already gitignored and used for compiled classes
- `challenge-loader.js` rewrites to read `challenges.json` and return challenge objects
- `java-runtime.js` continues to read from `.java-runtime/challenges/` as before

**Alternatives considered:**
- Keep directory structure, add metadata to JSON — defeats the single-file goal
- Pass code via stdin to Java — requires rewriting `ChallengeWorkbench.java`, higher risk

### 3. CodeMirror 6 served from node_modules via Express static

**Decision:** Install CodeMirror 6 packages via npm. Bundle them using a simple build step (`esbuild`) into a single `codemirror-bundle.js` served from `/public/`.

**Why:** CodeMirror 6 is ESM-only with many small packages. Can't load them via script tags without a bundler. A minimal esbuild script (one file, one command) produces a single bundle. This is the simplest path — no Webpack, no Vite, just one esbuild call in a build script.

**Packages needed:**
- `codemirror` (core)
- `@codemirror/lang-java` (Java syntax)
- `@codemirror/vim` (Vim keymap — note: the community package is `@replit/codemirror-vim`)
- `@codemirror/theme-one-dark` (base dark theme, customized to match DESIGN.md)
- `esbuild` (dev dependency for bundling)

**Alternatives considered:**
- CDN imports — CodeMirror 6 doesn't have a single CDN bundle, ESM import maps are fragile
- Monaco editor — much heavier (~5MB), overkill for this use case

### 4. Explicit "Start" button for time tracking

**Decision:** The home table has a "Start" button per challenge. Clicking it records `startedAt` timestamp, navigates to `#/challenge/:id`, and begins a visible timer in the workspace header. Timer pauses when navigating back to home. Timer stops and finalizes when submission passes all tests. Time is cumulative across sessions (stored as `timeSpentMs` in challenges.json).

**Why:** The user explicitly wants a "Start" button rather than auto-tracking. This makes time tracking intentional — you're "starting a session" like an interview.

**Timer persistence:** On every navigation away or page unload, the elapsed time since last start is added to `timeSpentMs` via `POST /api/challenges/:id/time`. The server updates `challenges.json`.

### 5. Notes in challenges.json, saved via API

**Decision:** Each challenge has a `notes` field (string) in `challenges.json`. The workspace has a notes textarea below the editor. Notes auto-save on blur or after 2 seconds of inactivity via `POST /api/challenges/:id/notes`.

**Why:** Simplest approach. Single file. No separate user data store. Notes are part of the challenge record.

**Risk:** Frequent writes to `challenges.json` for notes + time + scoring. Mitigated by debouncing writes and using atomic file writes (write to temp, rename).

### 6. System prompt as referenced file

**Decision:** `challenges.json` has a top-level `"systemPrompt": "system-prompt.md"` field pointing to a markdown file at project root. Server reads it once at startup. It's injected as the system message in every AI call, with per-challenge `hints` and `rules` appended.

**Why:** System prompts can be long and are easier to author/edit as markdown files than as JSON strings. The reference pattern keeps `challenges.json` clean while still being the config source.

## Risks / Trade-offs

**[Single-file write contention]** → All mutations (notes, scores, time) write to one `challenges.json`. Mitigated by: atomic writes (write temp + rename), debounced saves, and single-user assumption.

**[Temp file extraction fragility]** → If `challenges.json` is edited while server is running, extracted files may be stale. Mitigated by: re-extracting on each test run (only starter template + tests, which are small), or adding a file watcher in dev mode.

**[CodeMirror bundle size]** → CM6 + Java + Vim ≈ 200-300KB gzipped. Acceptable for a local tool. No lazy loading needed.

**[BREAKING data migration]** → Existing 3 challenges need manual migration to `challenges.json`. One-time effort, low risk. Will provide a migration script.

**[Vim mode learning curve]** → Toggle defaults to OFF. Users opt in via toolbar button.
