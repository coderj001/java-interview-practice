## ADDED Requirements

### Requirement: Interviewer SHALL assign challenge for locked interview sessions
The system SHALL allow the interviewer role to select a challenge from the existing challenge catalog and bind it to the interview session before the session is running.

#### Scenario: Interviewer selects challenge before start
- **WHEN** interviewer assigns a valid challenge id while session phase is `draft` or `ready`
- **THEN** the system SHALL persist the selected challenge on the session and include it in session state payloads

#### Scenario: Challenge reassignment is blocked after run begins
- **WHEN** interviewer attempts to reassign challenge after session phase reaches `running`
- **THEN** the system SHALL reject the request with a validation error and SHALL keep existing assignment unchanged

### Requirement: Interviewee SHALL be restricted to assigned challenge view
The interviewee interface SHALL render only assigned challenge context and basic session information in interview mode and SHALL NOT expose challenge catalog navigation.

#### Scenario: Interviewee opens interview session
- **WHEN** interviewee loads a valid session with assigned challenge
- **THEN** the UI SHALL display assigned challenge title/details, timer information, and coding workspace actions only

#### Scenario: Interviewee attempts challenge browsing in interview mode
- **WHEN** interviewee is on interview session routes
- **THEN** the UI SHALL NOT provide challenge list navigation or challenge switching controls
