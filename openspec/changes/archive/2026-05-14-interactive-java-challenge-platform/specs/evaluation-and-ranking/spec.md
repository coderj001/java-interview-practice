## ADDED Requirements

### Requirement: Automated evaluation with deterministic scoring
The system MUST automatically evaluate each submission against challenge test suites and produce a deterministic score.

#### Scenario: All tests pass
- **WHEN** evaluation completes with all required tests passing
- **THEN** the system MUST mark the submission as passed and assign full correctness points

#### Scenario: Partial pass
- **WHEN** evaluation completes with some tests failing
- **THEN** the system MUST assign a reduced score based on predefined scoring rules

### Requirement: Leaderboard ranking updates
The system MUST update relevant leaderboards when a submission score is finalized.

#### Scenario: Higher score replaces prior best
- **WHEN** a user receives a better score than their prior best for the same challenge
- **THEN** the leaderboard MUST update to reflect the improved rank
