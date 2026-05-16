## Context

The `ChallengeWorkbench` evaluates user solutions by compiling them in-process via `javax.tools` and invoking methods via reflection. Every test case is hardcoded in `buildDefinitions()` — a Java `switch` that must be updated for each new challenge. There are currently 3 challenges; adding a Rate Limiter or a SQL challenge would require a JVM-level code change, a recompile, and a container rebuild.

The `challenges.json` file already holds the ground truth for challenge *metadata* (title, hints, scoring). This design drives *evaluation* from that same file, so adding a new challenge is a JSON edit, and the AI can generate test cases on demand without touching Java code.

## Goals / Non-Goals

**Goals:**
- Drive test case execution from `challenges.json` (`testCases[]` array) with zero Java changes per new challenge.
- Support a `sandboxProfile.mode` field that selects the evaluation strategy: `reflective` (default), `jdbc`, or `concurrent`.
- Add H2 in-memory JDBC support for database challenges: the harness creates a real `java.sql.Connection` backed by H2 and passes it to the user's Java method. The user always writes Java — never raw SQL strings outside their class.
- Add a concurrent stress harness for thread-safety challenges (Rate Limiter, bounded queue, etc.).
- Expose an Orchestrator endpoint that asks the AI to synthesise additional test cases using a per-challenge prompt, then merges them into the evaluation run before scoring.
- Keep all existing challenges working identically (backwards-compatible migration).

**Non-Goals:**
- A full OAuth2 / HTTP mock harness (WireMock) — deferred to a follow-up change.
- Modifying the Docker network isolation policy.
- A UI for authoring challenges (out of scope; JSON editing is sufficient for now).

## Decisions

### D1: `sandboxProfile.mode` is the harness selector — not the challenge `tags`

`tags` are display metadata. A challenge can be tagged `["sql", "jdbc"]` but the harness is determined solely by `sandboxProfile.mode`. This keeps the evaluation contract explicit and avoids implicit magic.

Alternatives considered: derive mode from tags — rejected because tags are user-facing labels that should not have execution side-effects.

### D2: `ReflectiveHarness` reads `testCases[]` from `challenges.json` at startup, not at request time

The JSON is parsed once when `ChallengeWorkbench` initialises. `HarnessFactory` builds a `ChallengeDefinition` per challenge. This avoids re-reading the file on every evaluation and matches the existing compile-once pattern for the Java runtime.

Alternatives considered: hot-reload JSON on every request — rejected; adds file I/O latency and concurrent read-write race risks.

### D3: User always submits Java — the harness provides the mock environment

The evaluation model has one invariant: **the user always writes a Java `Solution` class**. For database challenges, the user writes Java JDBC code (e.g., `solve(Connection conn)`). The `JdbcHarness` spins up an H2 in-memory database, creates the schema from `sandboxProfile.setup`, passes a live `Connection` to the user's method, then runs verification queries after the method returns.

The test cases in `challenges.json` describe **what the harness asserts**, not what the user writes. For example, a `testCase` for a JDBC challenge says: "after calling `solve(conn)`, assert `SELECT COUNT(*) FROM users` returns 2" — all in JSON. The AI can generate new test cases in the same JSON shape without knowing the user's code.

Alternatives considered: user submits raw SQL strings — rejected; breaks the Java-only submission contract and requires a different compilation path.

### D4: H2 JAR is bundled in the Docker image, not downloaded at runtime

The sandbox runs with `--network none`. Downloading at execution time is not possible. The H2 JAR is added as a `COPY` layer in the `Dockerfile` and placed in `/app/libs/`. The `javac`/`java` invocations are updated to include `-cp ".:/app/libs/*"`.

### D7: `testCases[]` schema is harness-mode-specific, not language-specific

Each harness mode reads a different shape from `testCases[]`:
- **`reflective`**: `{ name, input: [...], expected: <value> }` — harness calls method via reflection, compares return value.
- **`jdbc`**: `{ name, description, expected: { query: "SELECT...", value | rows } }` — harness calls `solve(conn)`, runs the query, compares result.
- **`concurrent`**: `{ name, concurrentThreads, callsPerThread, constructorArgs, expected: { minAccepted, maxAccepted, maxRejected, expectNoExceptions } }` — harness stress-tests with N threads, checks thresholds.

This keeps the JSON declarative (the AI can generate valid entries for any mode) while keeping execution entirely in Java.

### D5: AI test-case generation is orchestrated by the Node.js layer, not the Java harness

The Java sandbox has no AI provider access (network-isolated). The Orchestrator (`server.js`) is already wired to AI providers. The new `/api/challenges/:id/ai-tests` endpoint generates test-case JSON from the AI, validates the schema, and appends the cases to the payload sent to the sandbox. This matches the existing `review` and `hint` patterns.

### D6: `ConcurrentHarness` uses `java.util.concurrent` exclusively (no extra JARs)

Thread stress can be implemented with `ExecutorService`, `CountDownLatch`, and `AtomicInteger` — all in the JDK. The harness launches N threads simultaneously (configurable via `sandboxProfile.concurrentThreads`), records accept/reject counts, and asserts against JSON-declared thresholds.

## Risks / Trade-offs

| Risk | Mitigation |
|---|---|
| Malformed `testCases[]` JSON crashes the harness at startup | Validate schema at `HarnessFactory` build time; throw a descriptive `IllegalArgumentException` per challenge |
| AI generates test cases with wrong types (e.g., string where int expected) | Orchestrator validates AI output against `methodContract` type signature before injecting; rejects invalid cases with a warning |
| `sandboxProfile.setup` DDL is authored by challenge authors, not users | DDL is part of the challenge definition, not submitted by users; no injection surface. Sandbox runs as the `sandbox` user; H2 in-memory only. |
| `ConcurrentHarness` with many threads increases per-job execution time | `sandboxProfile.timeoutMs` override per challenge; `concurrentThreads` defaults to 10 |
| JSON test cases only support primitive and array types today | `ReflectiveHarness` maps JSON types to Java types; complex object types (custom classes) not supported in v1 — documented limitation |

## Migration Plan

1. **Phase 1 – Schema extension**: Add `sandboxProfile` (defaulting to `mode: "reflective"`) and `aiTestConfig` to `challenges.json` for all 3 existing challenges. No code change; harness reads the existing `testCases[]` as before.
2. **Phase 2 – `HarnessFactory` + `ReflectiveHarness`**: Replace `buildDefinitions()` with factory-driven lookup. Run existing tests to confirm parity.
3. **Phase 3 – Dockerfile + `JdbcHarness`**: Add H2 JAR, update classpath, implement and test `JdbcHarness` with a Java JDBC challenge in JSON.
4. **Phase 4 – `ConcurrentHarness`**: Implement and test with a new Rate Limiter challenge in JSON.
5. **Phase 5 – AI test generation endpoint**: Add Orchestrator route; wire to AI provider; test with mock responses.

Rollback: each phase is independently deployable. Reverting the Java changes restores the old hardcoded harness; `challenges.json` additions are additive and safe to leave in place.

## Open Questions

- **OQ1**: Should AI-generated test cases count toward the official score, or run as advisory (shown to user but not scored)? Recommend: advisory in v1 to avoid score inflation from flaky AI output. Needs product decision.
- **OQ2**: ~~Closed~~ — The user always submits Java. For database challenges, the user writes Java JDBC code (`solve(Connection conn)`). The harness provides the mock `Connection`. Raw SQL-only challenges are explicitly out of scope.
