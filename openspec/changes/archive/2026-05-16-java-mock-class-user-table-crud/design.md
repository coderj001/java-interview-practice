## Context

The Java Interview Practice platform evaluates candidate submissions using a Sandbox Runtime. Currently, the runtime only supports hardcoded built-in modes (`reflective`, `jdbc`, `concurrent`). To evaluate more complex domain-driven challenges (like "User Table CRUD with JDBC" or custom mock-based problems), authors need the ability to write their own full-fledged Java test classes that test the candidate's solution. These tests often rely on frameworks like JUnit 5 and Mockito.

## Goals / Non-Goals

**Goals:**
- Allow challenge authors to embed custom Java test classes directly in `challenges.json`.
- Support standard JUnit 5 test classes (with Mockito) as well as raw Java `main` classes.
- Ensure all required testing dependencies are available within the offline Docker Sandbox Runtime.
- Transparently translate JUnit test outcomes into the platform's standard `EvaluationResult` JSON format.

**Non-Goals:**
- Supporting arbitrary Maven/Gradle dependency downloads *during* test execution (the sandbox must remain offline).
- Permitting candidates to upload their own test suites (this is strictly for platform-authored evaluation harnesses).

## Decisions

### 1. Unified `custom_test` Mode with Runner Strategies
Instead of creating a new top-level sandbox mode for every test framework, we will introduce a single `custom_test` mode. Inside `sandboxProfile`, we will specify a `runner` property (e.g., `junit` or `raw`).
- **Rationale**: Keeps the sandbox execution pipeline clean. The orchestrator simply looks for `custom_test`, writes the embedded `harnessCode` to a `.java` file, compiles it alongside the solution, and delegates execution based on the `runner`.

### 2. Offline Dependency Packaging via Maven
We will update the root `pom.xml` to include the `maven-dependency-plugin` with the `copy-dependencies` goal, extracting all runtime and test dependencies into a local directory (e.g., `target/dependency/`). The `sandbox-runtime/Dockerfile` will be updated to `COPY` this directory into `/app/lib/`.
- **Rationale**: The Sandbox Runtime runs in an isolated network environment. By packaging dependencies at image build time, we ensure robust, offline, fast compilation and execution. 
- **Alternatives Considered**: Using a fat-JAR. Rejected because we need to dynamically compile the user's source code against these libraries using `javac -cp`.

### 3. JUnit Console Launcher & Result Translation
For the `junit` runner, the sandbox's Node.js wrapper will invoke the JUnit Platform Console Launcher CLI:
`java -cp "/app/lib/*:/app/.java-runtime/classes" org.junit.platform.console.ConsoleLauncher --select-class <HarnessClassName> --reports-dir=reports`
The wrapper will then parse the resulting JUnit XML/JSON report to determine pass/fail metrics, converting them into the expected `{"correctnessPoints": X, ...}` schema.
- **Rationale**: Relying on JUnit's structured reporting (like XML) is far less brittle than parsing human-readable stdout strings.

## Risks / Trade-offs

- **Risk: Malicious custom test code**: Custom test classes run with the same permissions as user code inside the container.
  - *Mitigation*: The test code is authored by the platform (in `challenges.json`), not the candidate, so it is trusted. Standard sandbox constraints (timeout, memory, network isolation) still apply.
- **Risk: Increased Docker Image Size**: Adding Mockito, ByteBuddy, and JUnit to the sandbox image increases its size.
  - *Mitigation*: These dependencies are relatively small (a few MBs) and are cached efficiently by Docker layers. The trade-off is worth the massive increase in challenge authoring flexibility.
