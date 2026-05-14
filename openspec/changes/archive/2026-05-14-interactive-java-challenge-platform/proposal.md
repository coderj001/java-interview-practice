## Why

Developers preparing for Java interviews need more than isolated coding problems: they need a structured environment that combines hands-on coding, automated correctness feedback, performance insight, and interview-style coaching. Building this now creates a single production-oriented practice platform that shortens preparation time and improves interview readiness.

## What Changes

- Add an interactive coding challenge platform for Java with browser-based code authoring, execution, and submission workflows.
- Add automated verification, scoring, and ranking for challenge submissions.
- Add user-facing achievements and embeddable profile badges that update from challenge progress.
- Add challenge analytics including execution time and memory usage tracking.
- Add curated challenge metadata including explanations, resources, and difficulty progression (beginner, intermediate, advanced).
- Add AI interview simulation features: real-time code review, follow-up interview questions, progressive hints, and pluggable LLM provider support.
- Add challenge catalog coverage for the listed beginner/intermediate/advanced challenge set.

## Capabilities

### New Capabilities
- `challenge-workbench`: Browser-based Java challenge workspace for coding, testing, and submissions.
- `evaluation-and-ranking`: Automated test execution, scoring, and leaderboard ranking behavior.
- `learning-progression`: Challenge catalog organization by difficulty, with per-challenge learning resources and explanations.
- `profile-recognition`: Badge generation and profile-facing status surfaces based on progress.
- `ai-interview-simulation`: AI-assisted review, follow-up questioning, progressive hints, and multi-LLM provider integration.

### Modified Capabilities
- None.

## Impact

- Affects web UI, backend evaluation services, challenge metadata model, user progress model, and ranking services.
- Introduces integration points for external LLM APIs (Gemini, OpenAI, Claude) with API-key based configuration.
- Requires secure execution/isolation for user code and telemetry collection for performance analytics.
- Expands documentation and tests for challenge lifecycle, scoring correctness, and AI interview workflows.
