## ADDED Requirements

### Requirement: Concurrent thread stress execution
For challenges with `sandboxProfile.mode: "concurrent"`, the system SHALL instantiate the user's `Solution` class once and invoke a designated method from `sandboxProfile.concurrentThreads` threads simultaneously using a `CountDownLatch` start barrier.

#### Scenario: All threads start simultaneously
- **WHEN** `ConcurrentHarness` runs a concurrent test case
- **THEN** all N worker threads SHALL call the target method only after a shared `CountDownLatch` reaches zero, ensuring maximum concurrency

#### Scenario: Thread count configurable per challenge
- **WHEN** a challenge declares `sandboxProfile.concurrentThreads: 20`
- **THEN** `ConcurrentHarness` SHALL launch exactly 20 threads for the stress run

### Requirement: Threshold assertions for concurrent outcomes
The system SHALL evaluate concurrent test cases using threshold-based assertions declared in `testCases[].expected` rather than exact return values. Supported assertion keys: `maxRejected` (int), `minAccepted` (int), `expectNoExceptions` (boolean).

#### Scenario: Rate limiter accepts within quota
- **WHEN** 20 threads call a rate-limited `acquire()` with a quota of 10 per window
- **THEN** the test SHALL pass if `acceptedCount >= minAccepted` (e.g., `>= 10`) and `rejectedCount <= maxRejected` (e.g., `<= 10`)

#### Scenario: Thread-unsafe solution triggers exception assertion
- **WHEN** a non-thread-safe solution throws `ConcurrentModificationException` or similar under load
- **THEN** the test SHALL fail with `expectNoExceptions: true` violated and the exception message included in `detail`

### Requirement: Concurrent harness uses JDK concurrency only
`ConcurrentHarness` SHALL be implemented using only `java.util.concurrent` classes available in the JDK — no additional JARs required. Thread timeout SHALL default to `sandboxProfile.timeoutMs` (or the sandbox policy max if not declared).

#### Scenario: JDK-only compilation
- **WHEN** `ConcurrentHarness.java` is compiled with no extra `-cp` arguments
- **THEN** compilation SHALL succeed with no missing class errors
