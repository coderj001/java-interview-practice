## Why

The current `ChallengeWorkbench` evaluation model is hardcoded in Java — every new challenge requires modifying `ChallengeWorkbench.java` directly. This makes it impossible to add advanced challenges (Rate Limiter, SQL Operations, OAuth2-style multi-step flows) without a code release, and the AI has no role in generating or validating test cases at runtime. As the challenge library grows, this model does not scale.

## What Changes

- **New**: `sandboxProfile` block in `challenges.json` — declares the evaluation mode (`reflective`, `sql`, `concurrent`, `script`) and dependencies for each challenge.
- **New**: `aiTestConfig` block in `challenges.json` — per-challenge prompt templates that let the AI Orchestrator generate additional test cases at runtime before submission.
- **New**: `HarnessFactory` in Java — reads the challenge's `sandboxProfile.mode` and instantiates the appropriate `ChallengeHarness` implementation (e.g., `ReflectiveHarness`, `SqlHarness`, `ConcurrentHarness`).
- **New**: `ReflectiveHarness` — replaces the current hardcoded `buildDefinitions()` by driving test cases from `challenges.json` `testCases[]` at runtime. Existing challenges migrate to this harness with zero behaviour change.
- **New**: `SqlHarness` — sets up an H2 in-memory JDBC database, runs `setup.sql` DDL, compiles the user's code alongside a thin JDBC executor shim, and asserts the resulting table state against `expected` rows declared in `challenges.json`.
- **New**: `ConcurrentHarness` — wraps the user's class with a `java.util.concurrent` stress driver; supports assertions like `maxRejected`, `minThroughput`.
- **New**: `/api/challenges/:id/ai-tests` endpoint on the Orchestrator — calls the configured AI provider to generate N extra test cases using `aiTestConfig.promptTemplate`, injects them into the current evaluation run.
- **Modified**: `sandboxed-java-execution` — classpath policy extended to support per-challenge extra JARs (H2, etc.) declared in `sandboxProfile.deps`.

## Capabilities

### New Capabilities
- `harness-factory`: Runtime harness selection driven by `challenges.json`; replaces hardcoded `buildDefinitions()`.
- `sql-harness`: H2 in-memory SQL evaluation mode with DDL setup, JDBC shim, and row-level assertions.
- `concurrent-harness`: Thread-stress evaluation mode for concurrency challenges (Rate Limiter, etc.).
- `ai-generated-test-cases`: Orchestrator endpoint that asks the AI to synthesise extra test cases from a per-challenge prompt template and merges them into the evaluation run.

### Modified Capabilities
- `sandboxed-java-execution`: Classpath policy extended to allow per-challenge extra JARs.

## Impact

- **`challenges.json`** — schema extended with `sandboxProfile` and `aiTestConfig`; backwards-compatible (existing challenges default to `reflective` mode).
- **`src/main/java/com/interview/platform/web/ChallengeWorkbench.java`** — `buildDefinitions()` replaced by `HarnessFactory` lookup; `ChallengeDefinition` record gains a `HarnessFactory`-provided `ChallengeHarness`.
- **`sandbox-runtime/Dockerfile`** — H2 JAR added to `/app/libs/`; javac/java classpath updated to include `/app/libs/*`.
- **`web-ui/server.js`** (Orchestrator) — new `/api/challenges/:id/ai-tests` route; AI provider call plumbed through existing `ProviderRegistry` pattern.
- **No breaking changes** to existing API contracts or existing challenge data.
