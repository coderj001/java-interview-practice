## ADDED Requirements

### Requirement: Role-separated interview session surfaces
The system SHALL provide distinct interviewer and interviewee session interfaces with different permissions.

#### Scenario: Interviewer opens session console
- **WHEN** an interviewer opens a session they own
- **THEN** the system SHALL display timer control actions (`start`, `pause`, `resume`, `adjust`, `end`)

#### Scenario: Interviewee opens session workspace
- **WHEN** an interviewee opens a session
- **THEN** the system SHALL display the timer state as read-only and SHALL NOT expose timer mutation controls

### Requirement: Single-owner timer control authorization
The system SHALL enforce that only the session's interviewer owner can mutate timer state.

#### Scenario: Owner mutates timer
- **WHEN** the interviewer owner calls a timer mutation endpoint
- **THEN** the system SHALL apply the change and emit a corresponding session timer event

#### Scenario: Non-owner attempts mutation
- **WHEN** any non-owner actor calls a timer mutation endpoint
- **THEN** the system SHALL reject the request with an authorization error and SHALL NOT change timer state
