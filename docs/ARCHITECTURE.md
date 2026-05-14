# Java Interview Challenge Platform Skeleton

## What is implemented

- Core challenge domain models: challenge metadata, difficulty tiers, submissions, score.
- Submission lifecycle transition rules (`DRAFT -> QUEUED -> RUNNING -> COMPLETED/FAILED`).
- Deterministic evaluation service producing correctness score and performance fields.
- In-memory leaderboard service that retains the best score per user.
- Challenge content loaded from filesystem folders under `challenges/challenge-<id>/`.
- AI interview abstraction layer with provider registry (`gemini`, `openai`, `claude`) and progressive 4-level hinting contract.
- Node.js + Express host under `web-ui/` as the single web entry point, with an EJS-rendered browser workbench and lightweight API endpoints.
- Deterministic local solution persistence under `challenges/challenge-<id>/solutions/<user>.java`.
- Git guidance generation that returns add/commit/push commands when the directory is a Git repository.
- Java execution bridge that compiles `Solution` locally with the JDK compiler and runs deterministic sample tests for the seeded workbench challenges.
- Browser UI for browsing challenges, editing solutions, running tests, submitting solutions, requesting review feedback, and stepping through hints.
- Unit tests for deterministic scoring, leaderboard replacement logic, and hint progression.
- Node tests for path determinism, Git guidance behavior, and input validation.

## Next implementation steps

1. Integrate a secure code execution sandbox and asynchronous job queue instead of local process execution.
2. Replace `SimpleInterviewProvider` stubs with real provider adapters and API-key management.
3. Add persistent storage for leaderboard and submission history.
4. Add profile badge issuance and public badge rendering endpoints.
5. Expand hidden test coverage and richer challenge metadata for each catalog entry.
