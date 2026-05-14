## 1. Project Restructuring and Data Foundation

- [x] 1.1 Create `challenges.json` at the project root by migrating the data from the existing `challenges/challenge-*` directories.
- [x] 1.2 Create `system-prompt.md` at the project root with the base AI configuration and instruction prompt.
- [x] 1.3 Update `web-ui/src/node/challenge-loader.js` to parse the new `challenges.json` file.
- [x] 1.4 Implement temp file extraction logic on server startup to write `starterCode` and `testCases` to `.java-runtime/challenges/`.
- [x] 1.5 Modify `java-runtime.js` to reference the `.java-runtime/challenges/` directory for compilation and test execution.
- [x] 1.6 Implement `POST /api/challenges/:id/time` and `POST /api/challenges/:id/notes` endpoints in `server.js` with atomic file writes to `challenges.json`.
- [x] 1.7 Update the `POST /api/challenges/:id/submit` endpoint to record `bestScore`, `attempts`, `status`, and `completedAt` in `challenges.json`.
- [x] 1.8 Delete the legacy `challenges/` directory once migration is complete.

## 2. AI Layer Enhancements

- [x] 2.1 Update `web-ui/server.js` or `ai-provider.js` to load the `system-prompt.md` file into memory.
- [x] 2.2 Update `ai-gemini.js` to inject the global system prompt, per-challenge `hints`, and `rules` into the review and hint requests.
- [x] 2.3 Update `ai-openrouter.js` to inject the global system prompt, per-challenge `hints`, and `rules` into the review and hint requests.

## 3. Frontend Infrastructure & Editor Setup

- [x] 3.1 Install npm dependencies in `web-ui/`: `marked`, `codemirror`, `@codemirror/lang-java`, `@replit/codemirror-vim`, `@codemirror/theme-one-dark`, and `esbuild`.
- [x] 3.2 Create a build script `web-ui/scripts/build-editor.js` to bundle CodeMirror using `esbuild` into `public/codemirror-bundle.js`.
- [x] 3.3 Add a `build:editor` script to `web-ui/package.json` and execute it to generate the bundle.

## 4. UI Redesign: Home View & Routing

- [x] 4.1 Overhaul `web-ui/public/styles.css` using the tokens, colors, typography, and spacing defined in `DESIGN.md`.
- [x] 4.2 Restructure `web-ui/views/index.ejs` to support a two-view Single Page Application (SPA) container structure.
- [x] 4.3 Implement client-side hash routing (`window.addEventListener('hashchange')`) in `app.js` to toggle between Home (`#/home`) and Workspace (`#/challenge/:id`).
- [x] 4.4 Build the Home View in `app.js`: render the challenge table with #, Name, Level, Tags, Score, and Status.
- [x] 4.5 Implement the overall progress indicator (percentage of completed challenges) on the Home View.
- [x] 4.6 Implement the "Start" button logic: record session start time and transition to the Workspace view.

## 5. UI Redesign: Challenge Workspace

- [x] 5.1 Implement the Workspace view layout in `app.js` and `styles.css` using the glassmorphism and modern panel design.
- [x] 5.2 Integrate `marked` to render the challenge `details` markdown as HTML in the workspace.
- [x] 5.3 Integrate the bundled CodeMirror 6 editor into the workspace, configuring Java syntax, custom dark theme, and the Vim mode toggle button.
- [x] 5.4 Implement the session timer logic: display running timer, save elapsed time via API on navigation away or page unload.
- [x] 5.5 Implement the notes textarea with debounced auto-save to the API.
- [x] 5.6 Wire up "Run Tests", "Submit", "Review", and "Next Hint" button actions to the existing API endpoints within the new Workspace layout.
- [x] 5.7 Update the rendering of AI review and hint outputs to match the new design system.
