## MODIFIED Requirements

### Requirement: Node API for challenge and submission workflow
The system MUST provide Node.js HTTP endpoints for challenge listing and solution submission, and MUST route evaluation execution through sandbox runtime with policy-aware execution controls.

#### Scenario: List challenges
- **WHEN** a client requests challenge catalog
- **THEN** the API MUST return challenge metadata including difficulty and title

#### Scenario: Submit solution
- **WHEN** a client posts challenge solution code
- **THEN** the API MUST validate input and process save/evaluate pipeline via sandbox runtime
- **AND** the API MUST return sandbox evaluation results or validation/runtime errors in a structured response

#### Scenario: Sandbox policy rejects execution request
- **WHEN** a run or submit request asks for execution parameters that violate sandbox policy
- **THEN** the API MUST return a clear client-facing error indicating the request was rejected by execution policy
