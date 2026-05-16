## MODIFIED Requirements

### Requirement: Challenge evaluation endpoint uses sandbox runtime service
The API SHALL evaluate submitted Java code by forwarding payloads to the sandbox runtime service and returning normalized results.

#### Scenario: Sandbox runtime reachable
- **WHEN** `POST /api/run-tests` receives valid challenge and code payload
- **THEN** the API SHALL call the sandbox runtime with timeout, memory, and network policy inputs
- **AND** SHALL return compile/test outcomes in the existing response shape

#### Scenario: Sandbox runtime unavailable
- **WHEN** sandbox runtime is unreachable or times out
- **THEN** the API SHALL return an error response with actionable runtime failure details

### Requirement: Submission endpoint persists code and returns git workflow guidance
The API SHALL save submitted code to the challenge folder in the root repository and include git workflow guidance in the response.

#### Scenario: Successful submission
- **WHEN** `POST /api/submit` receives valid payload and sandbox evaluation succeeds
- **THEN** the API SHALL persist `Solution.java` in the challenge's `my-solution` path
- **AND** SHALL include git workflow guidance generated from the root repository state

#### Scenario: Submission in non-git directory
- **WHEN** the repository root is not a valid git repository
- **THEN** the API SHALL still save the submission and SHALL return guidance fallback text without git metadata

## ADDED Requirements

### Requirement: Session timer control endpoints
The API SHALL provide HTTP endpoints for interviewer-owned timer control actions.

#### Scenario: Owner starts timer
- **WHEN** the session owner calls the timer start endpoint with a valid expected version
- **THEN** the API SHALL transition timer state to running, increment version, and emit a timer SSE event

#### Scenario: Owner pauses timer
- **WHEN** the session owner calls the timer pause endpoint with a valid expected version
- **THEN** the API SHALL transition timer state to paused, increment version, and emit a timer SSE event

### Requirement: Session snapshot and SSE endpoints
The API SHALL expose snapshot and SSE endpoints for session timer synchronization.

#### Scenario: Snapshot fetch
- **WHEN** a client calls the session snapshot endpoint
- **THEN** the API SHALL return the current authoritative timer fields and session metadata

#### Scenario: SSE subscription
- **WHEN** a client subscribes to the session events endpoint
- **THEN** the API SHALL stream timer lifecycle events in event order

### Requirement: Timer mutation authorization and version checks
The API SHALL reject unauthorized or stale timer mutations.

#### Scenario: Unauthorized mutation request
- **WHEN** a non-owner actor calls a timer mutation endpoint
- **THEN** the API SHALL respond with authorization error and SHALL NOT mutate state

#### Scenario: Stale expected version
- **WHEN** a timer mutation request contains an outdated expected version
- **THEN** the API SHALL reject the mutation as a conflict and SHALL return the current version
