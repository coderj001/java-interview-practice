## ADDED Requirements

### Requirement: Submitted solutions are saved inside the owning challenge folder
The system MUST save each submitted solution under the corresponding challenge directory using a deterministic path.

#### Scenario: First save for a challenge
- **WHEN** a user submits a solution for challenge `24`
- **THEN** the system MUST write the file to `challenges/challenge-24/solutions/<user>.java`

#### Scenario: Resubmit the same challenge
- **WHEN** the same user submits challenge `24` again
- **THEN** the system MUST update the same deterministic file path inside `challenges/challenge-24/solutions/`

### Requirement: Git guidance targets the root repository
The system MUST generate Git guidance relative to the project root even though saved solutions live inside challenge-specific directories.

#### Scenario: Repository is available
- **WHEN** a submission is saved and the project root is a Git repository
- **THEN** the system MUST return Git guidance that stages and commits the new challenge-local solution path from the root repository

#### Scenario: Repository is unavailable
- **WHEN** a submission is saved outside a Git repository
- **THEN** the system MUST return a clear non-git explanation instead of nested-repository guidance
