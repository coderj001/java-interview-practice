## ADDED Requirements

### Requirement: Interview sessions SHALL expose assigned challenge content
The system SHALL include assigned challenge metadata and details in interview session state so interview pages can render the question.

#### Scenario: Session state includes challenge fields
- **WHEN** a client requests interview session state
- **THEN** the response SHALL include assigned challenge `id`, `title`, and `details`

### Requirement: Interviewee page SHALL render assigned question
The interviewee interface SHALL display the assigned challenge/question when session state is loaded.

#### Scenario: Interviewee opens valid session
- **WHEN** interviewee loads a session with an assigned challenge
- **THEN** the UI SHALL render the challenge title and details from session state

### Requirement: Interviewer page SHALL show assigned challenge context
The interviewer interface SHALL display the assigned challenge context for facilitation.

#### Scenario: Interviewer opens valid session
- **WHEN** interviewer loads a session with an assigned challenge
- **THEN** the UI SHALL render challenge identifier and title alongside timer controls
