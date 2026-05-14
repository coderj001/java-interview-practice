# challenge-scoring Specification

## Purpose
TBD - created by archiving change ui-redesign-home-workspace. Update Purpose after archive.
## Requirements
### Requirement: Per-challenge scoring
The system SHALL track per-challenge scoring: best score (0-100 based on test pass percentage), number of attempts, and completion status.

#### Scenario: First passing submission
- **WHEN** user submits a solution that passes 8 of 10 tests
- **THEN** bestScore is set to 80, attempts incremented by 1, status remains "in-progress"

#### Scenario: Perfect score marks completion
- **WHEN** user submits a solution that passes all tests (100/100)
- **THEN** bestScore is set to 100, attempts incremented, status set to "completed", completedAt set to current timestamp

#### Scenario: Best score is preserved
- **WHEN** user previously scored 90 and submits a solution scoring 70
- **THEN** bestScore remains 90, attempts is still incremented

### Requirement: Time tracking per challenge
The system SHALL track cumulative time spent per challenge in milliseconds.

#### Scenario: Time accumulates across sessions
- **WHEN** user starts challenge, spends 5 minutes, navigates away, then returns and spends 3 minutes
- **THEN** timeSpentMs reflects 8 minutes total (480000ms)

#### Scenario: Timer starts on explicit action
- **WHEN** user clicks "Start" button on the home table
- **THEN** a session timer begins and is visible in the workspace header

#### Scenario: Timer saves on navigation
- **WHEN** user navigates away from the challenge workspace (back to home or page unload)
- **THEN** elapsed time since session start is added to timeSpentMs via API call

### Requirement: Overall progress calculation
The system SHALL calculate overall progress as the percentage of challenges with status "completed".

#### Scenario: Progress endpoint
- **WHEN** client requests challenge list
- **THEN** response includes overall progress percentage derived from completed/total challenges

