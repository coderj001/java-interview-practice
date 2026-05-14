## Why

The current UI is a single-page workbench with a sidebar list of challenges. There is no dedicated home/landing page, no way to see challenge progress at a glance, no scoring or time tracking, and the editor is a plain textarea. The challenge data is spread across multiple directories and files, making it hard to manage. The AI hint system lacks per-challenge guidance rules and a system-level prompt. The UI needs a complete redesign to feel like a premium interview practice platform.

## What Changes

- **New home page** with a table listing all challenges — columns: #, name, level (colored chip), tags, score, status, and a "Start" button that begins the timer and opens the challenge workspace
- **New challenge workspace view** with markdown-rendered details (using `marked`), CodeMirror 6 editor with Java syntax highlighting and Vim keymap toggle, AI hint panel with per-challenge rules, and user notes field
- **Single `challenges.json`** replaces the current multi-directory challenge structure. All metadata, inline markdown details, starter code, test cases, hints, rules, notes, and scoring live in one file. The server extracts Java/test files to a temp directory for compilation.
- **Scoring system**: per-challenge score (test pass rate), time tracking (explicit start button triggers timer), attempt count, overall progress percentage
- **`system-prompt.md`** at project root — global AI system prompt injected into every hint/review call, augmented by per-challenge `hints` and `rules` fields
- **Design system adoption**: implement the dark-mode design from `DESIGN.md` — Hanken Grotesk + JetBrains Mono fonts, Electric Cyan primary, glassmorphism panels, chip components for tags/levels
- **Client-side hash routing** (`#/home`, `#/challenge/:id`) for a two-view SPA within the existing Express + EJS setup
- **BREAKING**: Challenge data format changes from per-directory files to single `challenges.json`. Existing `challenges/challenge-*/` directories are replaced.

## Capabilities

### New Capabilities
- `challenge-home-view`: Home page with challenge table, level/tag chips, score display, progress bar, and explicit "Start" button for time tracking
- `challenge-data-consolidation`: Single `challenges.json` as source of truth with temp-file extraction for Java runtime execution
- `challenge-scoring`: Per-challenge scoring (test pass %, attempts, time spent) and overall progress tracking, persisted in `challenges.json`
- `code-editor-codemirror`: CodeMirror 6 integration with Java syntax, Vim keymap toggle, and dark theme matching DESIGN.md
- `ai-system-prompt`: Global `system-prompt.md` file loaded at startup, combined with per-challenge hints/rules for AI context
- `markdown-challenge-details`: Client-side markdown rendering of challenge details using `marked`

### Modified Capabilities
- `web-ui-workspace-layout`: Complete redesign from 3-column single-page to two-view SPA (home + workspace) with hash routing
- `challenge-workbench`: Editor changes from textarea to CodeMirror 6, challenge details rendered as markdown, notes field added
- `node-ai-hint`: Hint endpoint now receives per-challenge `hints` and `rules` from `challenges.json` plus global system prompt
- `node-ai-review`: Review endpoint now uses global system prompt from `system-prompt.md`
- `challenge-folder-layout`: **BREAKING** — replaced by single `challenges.json` file

## Impact

- **Frontend**: Complete rewrite of `index.ejs`, `app.js`, `styles.css` — new two-view SPA with design system
- **Backend**: `challenge-loader.js` rewritten to read `challenges.json` instead of directory traversal. New temp-file extraction logic for Java runtime. New endpoints for saving notes and scoring.
- **Dependencies**: New npm packages — `marked`, `codemirror` (+ `@codemirror/lang-java`, `@codemirror/vim`, `@codemirror/theme-one-dark` or custom theme)
- **Data migration**: Existing 3 challenges need to be migrated into `challenges.json` format
- **AI layer**: `ai-provider.js`, `ai-gemini.js`, `ai-openrouter.js` updated to accept system prompt + per-challenge hints/rules
- **Java runtime**: `java-runtime.js` updated to work with temp-extracted files instead of static challenge directories
