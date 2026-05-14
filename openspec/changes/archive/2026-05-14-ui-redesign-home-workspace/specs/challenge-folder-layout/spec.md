## MODIFIED Requirements

### Requirement: Per-challenge content lives in a dedicated challenge folder
The system MUST store canonical challenge content in the root `challenges.json` file and generate runtime challenge folders under `.java-runtime/challenges/challenge-<id>/` for Java compilation and test execution.

#### Scenario: Load challenge data from consolidated JSON
- **WHEN** the application loads challenge `1`
- **THEN** it MUST resolve challenge metadata, details, starter code, and test cases from `challenges.json`

#### Scenario: Generate runtime challenge files
- **WHEN** the server starts
- **THEN** it MUST generate `.java-runtime/challenges/challenge-1/starter/Solution.java` and `.java-runtime/challenges/challenge-1/tests/visible-tests.json`

### Requirement: Each challenge folder exposes the required challenge assets
Each runtime challenge directory under `.java-runtime/challenges/challenge-<id>/` MUST contain generated starter and test assets derived from `challenges.json`.

#### Scenario: Required runtime files exist for a challenge
- **WHEN** the application evaluates challenge `4`
- **THEN** `.java-runtime/challenges/challenge-4/` MUST include `starter/Solution.java` and `tests/visible-tests.json`

#### Scenario: Authored content remains in consolidated source
- **WHEN** challenge prompt/details, hints, rules, or metadata are authored
- **THEN** those fields MUST be maintained in `challenges.json` rather than per-challenge source directories
