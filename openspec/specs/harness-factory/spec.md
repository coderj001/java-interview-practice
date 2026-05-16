## Purpose

TBD

## Requirements

### Requirement: Harness selection from challenge profile
The system SHALL read a `sandboxProfile.mode` field from each challenge in `challenges.json` and instantiate the corresponding `ChallengeHarness` implementation at startup. If `sandboxProfile` is absent, the system SHALL default to `mode: "reflective"`.

#### Scenario: Reflective mode selected by default
- **WHEN** a challenge in `challenges.json` has no `sandboxProfile` field
- **THEN** `HarnessFactory` SHALL construct a `ReflectiveHarness` for that challenge

#### Scenario: Explicit mode selection
- **WHEN** a challenge has `sandboxProfile.mode: "sql"`
- **THEN** `HarnessFactory` SHALL construct a `SqlHarness` for that challenge

#### Scenario: Unknown mode rejected at startup
- **WHEN** a challenge has `sandboxProfile.mode: "unknown-mode"`
- **THEN** `HarnessFactory` SHALL throw `IllegalArgumentException` with a descriptive message at application startup, preventing the workbench from launching with a broken configuration

### Requirement: Test cases driven from JSON
The system SHALL build test case definitions from the `testCases[]` array in `challenges.json` rather than hardcoded Java switch statements. Each entry in `testCases[]` MUST have a `name`, `input` array, and `expected` value.

#### Scenario: Test cases loaded at startup
- **WHEN** `ChallengeWorkbench` initialises and a challenge has `testCases[]` in `challenges.json`
- **THEN** `HarnessFactory` SHALL construct a matching list of `ChallengeTest` instances for that challenge

#### Scenario: Missing testCases fails fast
- **WHEN** a challenge with `sandboxProfile.mode: "reflective"` has no `testCases[]` or an empty array
- **THEN** `HarnessFactory` SHALL throw `IllegalArgumentException` at startup

### Requirement: Backwards-compatible with existing challenges
All 3 existing challenges SHALL produce identical evaluation results after the migration from hardcoded `buildDefinitions()` to `HarnessFactory`.

#### Scenario: Existing challenge evaluation unchanged
- **WHEN** a correct solution for challenge `1` (Sum of Two Numbers) is submitted
- **THEN** the evaluation SHALL return `accepted: true`, `passedTests: 3`, and `correctnessPoints: 100` - identical to the pre-migration result
