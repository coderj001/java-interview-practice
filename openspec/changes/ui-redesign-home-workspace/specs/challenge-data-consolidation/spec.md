## ADDED Requirements

### Requirement: Single challenges.json as data source
The server SHALL read all challenge data from a single `challenges.json` file at the project root. This file contains an array of challenge objects with all metadata, inline markdown details, starter code, test cases, hints, rules, notes, and scoring fields.

#### Scenario: Server loads challenges on startup
- **WHEN** the server starts
- **THEN** it reads `challenges.json` and makes all challenges available via the API

#### Scenario: Challenge JSON schema
- **WHEN** `challenges.json` is loaded
- **THEN** each challenge object SHALL have fields: id (number), title (string), level (string: "beginner"|"intermediate"|"advanced"), tags (string array), details (markdown string), methodContract (string), explanation (string), starterCode (string), testCases (array of objects), hints (string array), rules (object), resources (string array), examples (string array), notes (string), score (number|null), bestScore (number), attempts (number), timeSpentMs (number), completedAt (string|null), status (string)

### Requirement: Temp file extraction for Java runtime
The server SHALL extract starter code and test cases from `challenges.json` to the `.java-runtime/challenges/` directory so the Java compiler can read them as files.

#### Scenario: Extraction on startup
- **WHEN** the server starts
- **THEN** for each challenge, it creates `.java-runtime/challenges/challenge-{id}/starter/Solution.java` with the starterCode content and `.java-runtime/challenges/challenge-{id}/tests/visible-tests.json` with the testCases content

#### Scenario: Test run uses extracted files
- **WHEN** a user runs tests for challenge id 1
- **THEN** the Java runtime reads from `.java-runtime/challenges/challenge-1/` for compilation and test evaluation

### Requirement: Mutable data persistence
The server SHALL write back to `challenges.json` when notes, scores, time, or status are updated. Writes SHALL be atomic (write to temp file, then rename).

#### Scenario: Saving notes updates the file
- **WHEN** user saves notes for challenge id 1
- **THEN** the server updates the `notes` field for challenge 1 in `challenges.json` and writes the file atomically

#### Scenario: Score update after submission
- **WHEN** a user submits a passing solution for challenge id 1
- **THEN** the server updates `bestScore`, `attempts`, `status`, and `completedAt` in `challenges.json`
