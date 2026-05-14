## Purpose

TBD

## Requirements

### Requirement: Save submitted solutions to local repository
The system MUST save each submitted solution in the local repository using deterministic file paths.

#### Scenario: First submission save
- **WHEN** a user submits a solution for a challenge
- **THEN** the system MUST write code to `solutions/<challengeId>/<user>.java`

#### Scenario: Existing solution update
- **WHEN** a user resubmits the same challenge
- **THEN** the system MUST update the same deterministic file path
