## Purpose

TBD

## Requirements

### Requirement: Node API for challenge and submission workflow
The system MUST provide Node.js HTTP endpoints for challenge listing and solution submission.

#### Scenario: List challenges
- **WHEN** a client requests challenge catalog
- **THEN** the API MUST return challenge metadata including difficulty and title

#### Scenario: Submit solution
- **WHEN** a client posts challenge solution code
- **THEN** the API MUST validate input and process save/evaluate pipeline
