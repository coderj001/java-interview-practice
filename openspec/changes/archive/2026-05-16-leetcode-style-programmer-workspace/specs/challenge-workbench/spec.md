## ADDED Requirements

### Requirement: Workspace feedback panels
The challenge workspace SHALL present test results, AI review output, AI hints, and notes in a dedicated feedback area.

#### Scenario: Run tests shows test feedback
- **WHEN** a learner clicks run tests from the challenge workspace
- **THEN** the system displays the formatted test result summary and per-test details in the feedback area

#### Scenario: Request review shows review feedback
- **WHEN** a learner requests an AI review from the challenge workspace
- **THEN** the system displays the review response in the feedback area without replacing the editor content

#### Scenario: Request hint shows hint feedback
- **WHEN** a learner requests the next hint from the challenge workspace
- **THEN** the system displays the hint response in the feedback area without replacing the editor content

#### Scenario: Notes remain editable
- **WHEN** a learner edits notes in the feedback area
- **THEN** the notes content is persisted using the existing notes save behavior

### Requirement: Workspace preserves challenge controls
The redesigned challenge workspace MUST preserve existing challenge workbench controls and state behavior.

#### Scenario: Existing challenge actions still work
- **WHEN** a learner opens a challenge in the redesigned workspace
- **THEN** they can navigate home, see the timer, run tests, submit, request review, request hints, toggle Vim mode, and edit notes

#### Scenario: Submission still updates progress
- **WHEN** a learner submits from the redesigned workspace
- **THEN** scoring and challenge progress are updated using the existing submission behavior
