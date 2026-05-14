## Purpose

TBD

## Requirements

### Requirement: Per-challenge content lives in a dedicated challenge folder
The system MUST store each challenge under `challenges/challenge-<id>/` as the canonical location for challenge-owned files.

#### Scenario: Load a seeded challenge from the filesystem
- **WHEN** the application loads challenge `1`
- **THEN** it MUST resolve challenge-owned assets from `challenges/challenge-1/`

#### Scenario: Distinguish challenge-owned files from runtime code
- **WHEN** a developer inspects the repository layout
- **THEN** challenge metadata, prompts, starter code, tests, and saved solutions MUST be grouped under the corresponding `challenges/challenge-<id>/` directory

### Requirement: Each challenge folder exposes the required challenge assets
Each `challenges/challenge-<id>/` directory MUST contain machine-readable challenge metadata, a starter solution file, and a challenge-local solutions directory.

#### Scenario: Required files exist for a challenge
- **WHEN** the application validates challenge `4`
- **THEN** `challenges/challenge-4/` MUST include a metadata file, `starter/Solution.java`, and `solutions/`

#### Scenario: Optional authored content is colocated with the challenge
- **WHEN** a challenge includes prompt or visible-test assets
- **THEN** those files MUST live inside the same `challenges/challenge-<id>/` directory
