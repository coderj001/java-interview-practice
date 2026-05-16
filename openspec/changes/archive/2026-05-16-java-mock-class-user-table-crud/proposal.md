## Why

Currently, the Sandbox Runtime supports a limited set of hardcoded execution modes (`reflective`, `jdbc`, `concurrent`). This makes it difficult to evaluate complex candidate solutions that don't fit these paradigms, such as evaluating business logic with mocked dependencies (e.g., using Mockito). We need a way for challenge authors to define fully custom test harnesses—including JUnit and Mockito based tests—directly within the challenge definition, enabling a much richer variety of interview problems.

## What Changes

- Introduce a new Sandbox Mode called `custom_test`.
- Allow embedding a Custom Test Harness directly inside `challenges.json` via a new field (e.g., `sandboxProfile.harnessCode`).
- Support two `runner` strategies for the `custom_test` mode:
  - `junit`: The Sandbox Runtime uses the JUnit Platform Console Launcher to execute standard JUnit tests and automatically translates the test outcomes into the standard `EvaluationResult` JSON score.
  - `raw`: The Sandbox Runtime executes a standard Java `main` method, shifting the responsibility of printing the structured JSON score entirely to the custom harness code.
- Update the Sandbox Runtime Docker image to include required testing dependencies (JUnit Platform Console Launcher, Mockito, etc.) in an offline `lib/` directory so they are accessible to the `javac` and `java` commands during isolated execution.

## Capabilities

### New Capabilities
- `custom-test-harness`: Support for author-provided custom test classes (both `junit` and `raw` runners) embedded in `challenges.json`, along with the offline dependency packaging required to execute them in the sandbox.

### Modified Capabilities
- `sandboxed-java-execution`: Update the sandbox execution logic to parse the `custom_test` mode, resolve the embedded `harnessCode`, and appropriately invoke either the JUnit Console Launcher or the standard Java runner depending on the `runner` property. Add local JARs to the classpath.

## Impact

- **challenges.json Schema**: Added `custom_test` mode and fields like `harnessCode` and `runner` to the `sandboxProfile`.
- **Sandbox Runtime Dockerfile & Build**: Needs modifications to copy and provide JUnit and Mockito JARs into the container locally.
- **Sandbox Execution Wrapper (`sandbox-runtime/server.js`)**: Needs to handle the new `custom_test` mode, write the `harnessCode` to a temporary file alongside the user solution, and use the correct CLI invocation (`org.junit.platform.console.ConsoleLauncher` or standard Java class) while parsing the results.
