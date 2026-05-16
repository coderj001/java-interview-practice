## ADDED Requirements

### Requirement: Interview sessions SHALL log submit snapshots
The system SHALL create an immutable submission snapshot when interviewee submits code in interview mode.

#### Scenario: Candidate submits solution
- **WHEN** interviewee triggers submit for the assigned challenge
- **THEN** the system SHALL store submission timestamp, code snapshot, execution output, and resulting status for that session

### Requirement: Interviewer SHALL view code/output only after submit
The system SHALL expose interviewee code/output to interviewer only via stored submission snapshots.

#### Scenario: Interviewer checks session before any submit
- **WHEN** interviewer requests submission logs and no submission exists
- **THEN** the system SHALL return empty submission history and SHALL NOT reveal live draft code

#### Scenario: Interviewer inspects submitted attempt
- **WHEN** at least one submission exists
- **THEN** interviewer console SHALL show submission status and provide access to submitted code and output payload

### Requirement: Submission visibility SHALL be role-scoped
The system SHALL enforce interviewer-only access to submission log APIs.

#### Scenario: Interviewee requests submission log endpoint
- **WHEN** interviewee role calls interviewer submission log API
- **THEN** the system SHALL reject the request as forbidden
