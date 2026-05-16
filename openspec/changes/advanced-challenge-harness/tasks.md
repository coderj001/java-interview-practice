## 1. Schema Extension (challenges.json)

- [ ] 1.1 Add `sandboxProfile` block to all 3 existing challenges with `mode: "reflective"` and no other fields (backwards-compatible baseline)
- [ ] 1.2 Add `aiTestConfig` block to all 3 existing challenges with `promptTemplate`, `defaultCount: 3`, and `methodContract` repeated for convenience
- [ ] 1.3 Add a new Rate Limiter challenge entry with `sandboxProfile.mode: "concurrent"`, `concurrentThreads: 20`, and `testCases[]` using threshold assertions (`minAccepted`, `maxRejected`, `expectNoExceptions`)
- [ ] 1.4 Add a new SQL challenge entry (e.g., "User Table CRUD") with `sandboxProfile.mode: "sql"`, `setup` DDL string, and `testCases[]` with `expected` row objects

## 2. Java Harness Infrastructure

- [ ] 2.1 Create `ChallengeHarness` interface in `com.interview.platform.web` with a single method `List<ChallengeTest> buildTests(Challenge challenge, JsonNode sandboxProfile)`
- [ ] 2.2 Create `HarnessFactory` class that reads `sandboxProfile.mode` from a `JsonNode` and instantiates the correct `ChallengeHarness` implementation; throw `IllegalArgumentException` for unknown modes
- [ ] 2.3 Refactor `ChallengeWorkbench.buildDefinitions()` to call `HarnessFactory.build(challenge, sandboxProfile)` instead of the hardcoded switch; remove `beginnerDefinition()`, `intermediateDefinition()`, `advancedDefinition()` methods
- [ ] 2.4 Add `StaticChallengeCatalog` JSON parsing to extract `sandboxProfile` and `testCases[]` per challenge and pass them to `HarnessFactory`

## 3. ReflectiveHarness

- [ ] 3.1 Create `ReflectiveHarness` implementing `ChallengeHarness`; it reads `testCases[]` from the JSON node and builds `ChallengeTest` instances using reflection (mapping JSON primitive types to Java types: `int`, `int[]`, `int[][]`, `String`)
- [ ] 3.2 Verify all 3 existing challenges pass their full test suites after migration (no score changes, no outcome changes)

## 4. SqlHarness

- [ ] 4.1 Download H2 JAR (stable release, e.g., `h2-2.2.224.jar`) and place at `sandbox-runtime/libs/h2.jar`
- [ ] 4.2 Update `sandbox-runtime/Dockerfile` to `COPY sandbox-runtime/libs /app/libs` and update `CMD` / compile steps to use `-cp ".:/app/libs/*"`
- [ ] 4.3 Create `SqlHarness` implementing `ChallengeHarness`; on each test run: open `jdbc:h2:mem:<UUID>`, execute `sandboxProfile.setup` DDL, execute user-submitted SQL via `Statement.execute()`, query target table, compare rows against `expected` objects (order-insensitive, column-by-column)
- [ ] 4.4 Add `challenges.json` SQL challenge entry and verify `SqlHarness` evaluates it correctly end-to-end

## 5. ConcurrentHarness

- [ ] 5.1 Create `ConcurrentHarness` implementing `ChallengeHarness`; use `ExecutorService` + `CountDownLatch` to invoke the target method from N threads simultaneously; collect accept/reject counts and any thrown exceptions
- [ ] 5.2 Implement threshold assertion logic: validate actual `acceptedCount >= minAccepted`, `rejectedCount <= maxRejected`, and no exceptions when `expectNoExceptions: true`
- [ ] 5.3 Add Rate Limiter challenge to `challenges.json` and verify `ConcurrentHarness` correctly passes a thread-safe implementation and fails a non-thread-safe one

## 6. AI Test Case Generation (Orchestrator)

- [ ] 6.1 Add `GET /api/challenges/:id/ai-tests` route to `web-ui/server.js`; read `aiTestConfig.promptTemplate` from `challenges.json`, interpolate `{count}`, `{methodContract}`, `{examples}` placeholders, call AI provider
- [ ] 6.2 Parse AI response as JSON array of `{name, input, expected}`; validate each item against `methodContract` type signature; drop invalid items with a `console.warn`; return `{ aiTests: [...], droppedCount: N }`
- [ ] 6.3 Extend the `POST /api/challenges/:id/submit` handler to accept `includeAiTests: true`; if set, fetch AI tests, append to evaluation payload, return results in `aiTests[]` field separate from `tests[]`
- [ ] 6.4 Ensure `correctnessPoints` scoring is unchanged when `aiTests` are included (baseline tests only)

## 7. Verification

- [ ] 7.1 Run the full existing test suite; confirm all 3 original challenges evaluate identically before and after migration
- [ ] 7.2 Submit a correct Rate Limiter solution and confirm `ConcurrentHarness` returns `accepted: true`
- [ ] 7.3 Submit a correct SQL solution and confirm `SqlHarness` returns `accepted: true`
- [ ] 7.4 Call `/api/challenges/1/ai-tests` and confirm response is a valid array of test case objects
- [ ] 7.5 Submit with `includeAiTests: true` and confirm `aiTests[]` is populated and score is unchanged
