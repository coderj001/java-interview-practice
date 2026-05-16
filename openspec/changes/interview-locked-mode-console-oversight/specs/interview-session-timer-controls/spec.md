## ADDED Requirements

### Requirement: Interviewer SHALL have multi-increment timer adjustments
The system SHALL support interviewer timer adjustment controls for `+1`, `+5`, and `+10` minutes.

#### Scenario: Interviewer increases time budget
- **WHEN** interviewer applies one of the supported increments
- **THEN** the system SHALL increase remaining and total budget by the requested increment and publish updated authoritative state

### Requirement: Session state SHALL support progress bar rendering
The system SHALL expose timer progress primitives needed for consistent progress bar rendering across roles.

#### Scenario: Client renders timer progress
- **WHEN** client fetches session state or receives timer SSE event
- **THEN** payload SHALL include enough fields to compute/display elapsed time, remaining time, and total budget consistently

### Requirement: Progress bar SHALL be visible in both session roles
Both interviewer and interviewee session UIs SHALL render timer progress from authoritative state.

#### Scenario: Session is running
- **WHEN** timer state is running and authoritative updates are received
- **THEN** interviewer and interviewee interfaces SHALL update progress bar and remaining time display accordingly
