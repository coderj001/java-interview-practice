## Purpose

TBD
## Requirements
### Requirement: Browser-based Java challenge workspace
The system MUST provide an interactive browser workspace where a learner can open a challenge, write Java code in a CodeMirror 6 editor, view markdown-rendered challenge details, run tests, submit a final solution, take notes, and request AI hints/reviews.

#### Scenario: Learner runs tests before submission
- **WHEN** a learner selects a challenge and clicks run tests
- **THEN** the system MUST compile and execute challenge tests and display pass/fail results in the workspace

#### Scenario: Learner submits final solution
- **WHEN** a learner clicks submit for a challenge
- **THEN** the system MUST evaluate the solution, update scoring (bestScore, attempts), and persist results to `challenges.json`

#### Scenario: Challenge details rendered as markdown
- **WHEN** a learner opens a challenge workspace
- **THEN** the challenge details field MUST be rendered as formatted HTML using `marked`

#### Scenario: User notes are editable and persisted
- **WHEN** a learner types in the notes textarea and stops typing for 2 seconds or navigates away
- **THEN** the notes content MUST be saved to the challenge's `notes` field in `challenges.json`

#### Scenario: Timer visible in workspace
- **WHEN** a learner is in the challenge workspace after clicking "Start"
- **THEN** a running timer MUST be visible in the workspace header showing elapsed time for the current session

