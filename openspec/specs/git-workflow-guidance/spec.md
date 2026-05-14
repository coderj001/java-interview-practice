## Purpose

TBD

## Requirements

### Requirement: Return Git workflow guidance after submission
The system MUST provide copy-ready Git commands for add, commit, and push after saving a solution.

#### Scenario: Submission saved successfully
- **WHEN** a solution is persisted without error
- **THEN** the API MUST return recommended `git add`, `git commit`, and `git push` commands

#### Scenario: Non-git directory
- **WHEN** the repository is not initialized as a Git repository
- **THEN** the API MUST return guidance indicating Git commands are unavailable and why
