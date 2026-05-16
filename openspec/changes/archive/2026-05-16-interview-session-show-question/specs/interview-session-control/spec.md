## ADDED Requirements

### Requirement: Session creation validates and stores assigned challenge
Interview session creation SHALL require a valid challenge id and bind it to the created session.

#### Scenario: Create session with valid challenge
- **WHEN** a request creates an interview session with an existing challenge id
- **THEN** the system SHALL create the session and persist that challenge assignment

#### Scenario: Create session with invalid challenge
- **WHEN** a request creates an interview session with a missing or unknown challenge id
- **THEN** the system SHALL reject the request with a validation error and SHALL NOT create a session
