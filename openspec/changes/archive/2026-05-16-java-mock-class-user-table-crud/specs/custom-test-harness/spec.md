## ADDED Requirements

### Requirement: Embed Custom Test Harnesses in Challenge Definitions
The system MUST allow challenge authors to provide a complete, custom Java test class embedded directly within `challenges.json` via the `sandboxProfile.harnessCode` field when using the `custom_test` mode.

#### Scenario: Challenge specifies a custom harness
- **WHEN** a challenge is defined with `mode: custom_test`
- **THEN** it MUST include a `harnessCode` field containing the raw Java code for the test class
- **AND** it MUST include a `runner` field specifying the execution strategy (`junit` or `raw`)

### Requirement: Support JUnit 5 Framework for Custom Tests
The system MUST support authoring custom test harnesses using the JUnit 5 Jupiter API and Mockito. The offline Sandbox Runtime MUST include these dependencies in its library classpath.

#### Scenario: Authoring a JUnit-based harness
- **WHEN** a challenge uses the `junit` runner
- **THEN** the `harnessCode` MAY use standard `@Test`, `@ExtendWith(MockitoExtension.class)`, `@Mock`, and `@InjectMocks` annotations
- **AND** the sandbox execution MUST resolve these imports successfully during compilation

### Requirement: Support Raw Java Execution for Custom Tests
The system MUST allow authors to use a standard `main` method instead of a testing framework when maximum control over the evaluation output is required.

#### Scenario: Authoring a raw Java harness
- **WHEN** a challenge uses the `raw` runner
- **THEN** the `harnessCode` MUST contain a `public static void main(String[] args)` method
- **AND** the method MUST print exactly one well-formed JSON string representing the final `EvaluationResult` to standard output
