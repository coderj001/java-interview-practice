## ADDED Requirements

### Requirement: Interviewer can assign multiple challenges to one interview session
The system MUST allow the interviewer to select multiple challenge IDs for a new or draft interview session.

#### Scenario: Create session with challenge list
- **WHEN** interviewer creates a session with an ordered list of challenge IDs
- **THEN** the system stores the full ordered list as assigned challenges for that session

#### Scenario: Reject empty assignment
- **WHEN** interviewer creates or updates a session with no challenge IDs
- **THEN** the system rejects the request with a validation error

### Requirement: Interviewer controls challenge start state
The system MUST require an explicit interviewer action to start an assigned challenge, and MUST mark only started challenges as visible to interviewee detail views.

#### Scenario: Start assigned challenge
- **WHEN** interviewer starts one assigned challenge in a session
- **THEN** the system marks that challenge state as started and publishes updated session state

#### Scenario: Non-interviewer cannot start challenge
- **WHEN** an interviewee or unrelated user requests challenge start
- **THEN** the system rejects the request as unauthorized
