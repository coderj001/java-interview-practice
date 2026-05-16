## ADDED Requirements

### Requirement: Interviewee sees dedicated session home with assigned challenge list
The system MUST show interviewee a session home page that lists assigned challenges and each challenge state.

#### Scenario: Open interviewee session home
- **WHEN** interviewee opens an active interview session
- **THEN** the system displays assigned challenges with status such as pending, started, or completed

### Requirement: Challenge content is gated until challenge start
The system MUST hide challenge question content for challenges that are not started.

#### Scenario: Open pending challenge
- **WHEN** interviewee opens a challenge that is assigned but still pending
- **THEN** the system shows a locked or waiting state and does not return question content

#### Scenario: Open started challenge
- **WHEN** interviewee opens a challenge that the interviewer has started
- **THEN** the system returns challenge question content and starter workspace as normal
