## Context

The `ChallengeWorkbench` evaluates user solutions by compiling them in-process via `javax.tools` and invoking methods via reflection. Every test case is hardcoded in `buildDefinitions()` — a Java `switch` that must be updated for each new challenge. There are currently 3 challenges; adding a Rate Limiter or a SQL challenge would require a JVM-level code change, a recompile, and a container rebuild.

The `challenges.json` file already holds the ground truth for challenge *metadata* (title, hints, scoring). This design drives *evaluation* from that same file, so adding a new challenge is a JSON edit, and the AI can generate test cases on demand without touching Java code.

## Goals / Non-Goals

**Goals:**
- Drive test case execution from `challenges.json` (`testCases[]` array) with zero Java changes per new challenge.
- Support a `sandboxProfile.mode` field that selects the evaluation strategy: `reflective` (default), `sql`, or `concurrent`.
- Add H2 in-memory JDBC support for SQL challenges — setup DDL + row-level assertions — all declared in JSON.
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

### D3: `SqlHarness` uses H2 in embedded mode, not a sidecar container

H2 ships as a single JAR, requires no port allocation, and resets perfectly between runs (`jdbc:h2:mem:testdb;DB_CLOSE_DELAY=-1` scoped per evaluation job). This maintains the stateless sandbox contract.

Alternatives considered: real Postgres sidecar — powerful but adds container orchestration complexity; reserved for a future change.

### D4: H2 JAR is bundled in the Docker image, not downloaded at runtime

The sandbox runs with `--network none`. Downloading at execution time is not possible. The H2 JAR is added as a `COPY` layer in the `Dockerfile` and placed in `/app/libs/`. The `javac`/`java` invocations are updated to include `-cp ".:/app/libs/*"`.

### D5: AI test-case generation is orchestrated by the Node.js layer, not the Java harness

The Java sandbox has no AI provider access (network-isolated). The Orchestrator (`server.js`) is already wired to AI providers. The new `/api/challenges/:id/ai-tests` endpoint generates test-case JSON from the AI, validates the schema, and appends the cases to the payload sent to the sandbox. This matches the existing `review` and `hint` patterns.

### D6: `ConcurrentHarness` uses `java.util.concurrent` exclusively (no extra JARs)

Thread stress can be implemented with `ExecutorService`, `CountDownLatch`, and `AtomicInteger` — all in the JDK. The harness launches N threads simultaneously (configurable via `sandboxProfile.concurrentThreads`), records accept/reject counts, and asserts against JSON-declared thresholds.

## Risks / Trade-offs

| Risk | Mitigation |
|---|---|
| Malformed `testCases[]` JSON crashes the harness at startup | Validate schema at `HarnessFactory` build time; throw a descriptive `IllegalArgumentException` per challenge |
| AI generates test cases with wrong types (e.g., string where int expected) | Orchestrator validates AI output against `methodContract` type signature before injecting; rejects invalid cases with a warning |
| H2 DDL in `sandboxProfile.setup.sql` is user-supplied and could be malicious | Sandbox already runs as the `sandbox` user with no host filesystem access; H2 in-memory with no file-based URLs is safe |
| `ConcurrentHarness` with many threads increases per-job execution time | `sandboxProfile.timeoutMs` override per challenge; `concurrentThreads` defaults to 10 |
| JSON test cases only support primitive and array types today | `ReflectiveHarness` maps JSON types to Java types; complex object types (custom classes) not supported in v1 — documented limitation |

## Migration Plan

1. **Phase 1 – Schema extension**: Add `sandboxProfile` (defaulting to `mode: "reflective"`) and `aiTestConfig` to `challenges.json` for all 3 existing challenges. No code change; harness reads the existing `testCases[]` as before.
2. **Phase 2 – `HarnessFactory` + `ReflectiveHarness`**: Replace `buildDefinitions()` with factory-driven lookup. Run existing tests to confirm parity.
3. **Phase 3 – Dockerfile + `SqlHarness`**: Add H2 JAR, update classpath, implement and test `SqlHarness` with a new SQL challenge in JSON.
4. **Phase 4 – `ConcurrentHarness`**: Implement and test with a new Rate Limiter challenge in JSON.
5. **Phase 5 – AI test generation endpoint**: Add Orchestrator route; wire to AI provider; test with mock responses.

Rollback: each phase is independently deployable. Reverting the Java changes restores the old hardcoded harness; `challenges.json` additions are additive and safe to leave in place.

## Open Questions

- **OQ1**: Should AI-generated test cases count toward the official score, or run as advisory (shown to user but not scored)? Recommend: advisory in v1 to avoid score inflation from flaky AI output. Needs product decision.
- **OQ2**: For the SQL harness, should the user write raw SQL (and the harness calls `Statement.execute()`), or implement a Java class that uses JDBC? Recommend: raw SQL for SQL-tagged challenges, Java JDBC for jdbc-tagged challenges.
