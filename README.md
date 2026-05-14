# Java Interview Practice

Node-hosted Java interview practice workspace with an Express + EJS UI (`web-ui/`) and a Java execution runtime (`src/main/java`).

## Prerequisites

- Node.js
- JDK 17 or newer
- Optional: Maven, if you want to run `mvn test`

`npm start` and `npm run dev` rely on local `java` and `javac`.

## Quick Start

Install web UI dependencies once:

```bash
npm install --prefix web-ui
```

Start the app from the repo root:

```bash
npm start
```

Start with auto-reload:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

## How to Use

1. Start the server with `npm start` or `npm run dev`.
2. Open `http://localhost:3000`.
3. Select a challenge.
4. Edit the `Solution` class.
5. Click `Run Tests` for deterministic feedback.
6. Click `Submit` to save the solution under `challenges/challenge-<id>/solutions/<user>.java`.
7. Use `Review` or `Next Hint` for interview-style guidance.

## Project Layout

- [web-ui/server.js](/Users/raju/Develop/Personal/java-interview-practice/web-ui/server.js): Express server and route wiring
- [web-ui/views/index.ejs](/Users/raju/Develop/Personal/java-interview-practice/web-ui/views/index.ejs): server-rendered page template
- [web-ui/public/app.js](/Users/raju/Develop/Personal/java-interview-practice/web-ui/public/app.js): browser client behavior
- [web-ui/public/styles.css](/Users/raju/Develop/Personal/java-interview-practice/web-ui/public/styles.css): UI styling
- [web-ui/src/node/challenge-loader.js](/Users/raju/Develop/Personal/java-interview-practice/web-ui/src/node/challenge-loader.js): challenge filesystem loader
- [web-ui/src/node/java-runtime.js](/Users/raju/Develop/Personal/java-interview-practice/web-ui/src/node/java-runtime.js): Node-to-Java runtime bridge
- [web-ui/src/node/solution-store.js](/Users/raju/Develop/Personal/java-interview-practice/web-ui/src/node/solution-store.js): deterministic local persistence
- [challenges](/Users/raju/Develop/Personal/java-interview-practice/challenges): challenge folders with metadata, starter code, visible tests, and saved solutions
- [src/main/java/com/interview/platform/web/ChallengeWorkbench.java](/Users/raju/Develop/Personal/java-interview-practice/src/main/java/com/interview/platform/web/ChallengeWorkbench.java): Java challenge execution and coaching logic

## API Endpoints

- `GET /`
- `GET /api/challenges`
- `GET /api/challenges/{id}`
- `POST /api/challenges/{id}/run-tests`
- `POST /api/challenges/{id}/submit`
- `POST /api/challenges/{id}/review`
- `POST /api/challenges/{id}/hint`
- `GET /api/leaderboard`

`POST` endpoints use `application/x-www-form-urlencoded`.

## Verification

Success criteria:

- `npm start` starts without errors
- `npm run dev` starts with watch mode
- `http://localhost:3000` loads the UI
- `GET /api/challenges` returns challenge data from `challenges/`
- `Run Tests` works for a valid `Solution` class
- `Submit` saves a file under `challenges/challenge-<id>/solutions/`
- `Submit` updates the leaderboard
- `Submit` returns Git guidance or a clear non-git explanation

Run Node tests:

```bash
npm test
```

If Maven is installed, you can also run:

```bash
mvn test
```

## Current Limitations

- Challenge execution is local and not sandboxed
- Leaderboard storage is in memory only
- AI review and hint providers are stubbed abstractions, not live API integrations

## OpenSpec

This repo uses OpenSpec for change artifacts. The configured default workflow is in [openspec/config.yaml](/Users/raju/Develop/Personal/java-interview-practice/openspec/config.yaml:1).

When working with OpenSpec in this repo, use:

```bash
npx @fission-ai/openspec@latest
```
