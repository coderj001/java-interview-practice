## ADDED Requirements

### Requirement: CodeMirror is the primary coding surface
The challenge workspace SHALL present CodeMirror as the primary interaction area in the coding pane.

#### Scenario: Editor has stable workspace height
- **WHEN** a learner opens a challenge workspace
- **THEN** the CodeMirror editor is displayed with enough stable height for active coding without being pushed below the problem statement

#### Scenario: Editor toolbar is colocated with editor
- **WHEN** a learner views the coding pane
- **THEN** editor-related controls, including Vim mode and code execution actions, are visually grouped with the editor

#### Scenario: Editor content remains source of truth
- **WHEN** a learner runs tests, submits, requests review, or requests a hint
- **THEN** the system sends the current CodeMirror editor content to the existing endpoint for that action
