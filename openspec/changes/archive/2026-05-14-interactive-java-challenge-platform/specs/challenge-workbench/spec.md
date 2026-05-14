## ADDED Requirements

### Requirement: Browser-based Java challenge workspace
The system MUST provide an interactive browser workspace where a learner can open a challenge, write Java code, run tests, and submit a final solution.

#### Scenario: Learner runs tests before submission
- **WHEN** a learner selects a challenge and clicks run tests
- **THEN** the system MUST compile and execute challenge tests and display pass/fail results in the workspace

#### Scenario: Learner submits final solution
- **WHEN** a learner clicks submit for a challenge
- **THEN** the system MUST create a submission record and transition it to evaluation
