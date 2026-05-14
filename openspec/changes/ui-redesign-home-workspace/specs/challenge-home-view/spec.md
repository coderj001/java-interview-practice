## ADDED Requirements

### Requirement: Challenge table display
The home view SHALL render all challenges from `challenges.json` in a table with columns: number (#), name, level (as colored chip), tags (as chips), score, status, and a "Start" action button.

#### Scenario: Home page loads with challenges
- **WHEN** user navigates to `#/home` or the root URL
- **THEN** the system displays a table with one row per challenge from `challenges.json`, sorted by challenge id ascending

#### Scenario: Level chip colors
- **WHEN** a challenge has level "beginner"
- **THEN** the level chip uses success-mint color
- **WHEN** a challenge has level "intermediate"
- **THEN** the level chip uses warning-amber color
- **WHEN** a challenge has level "advanced"
- **THEN** the level chip uses error-rose color

#### Scenario: Status display
- **WHEN** a challenge has status "not-started"
- **THEN** the status column shows "Not Started" with muted styling
- **WHEN** a challenge has status "in-progress"
- **THEN** the status column shows "In Progress" with primary color
- **WHEN** a challenge has status "completed"
- **THEN** the status column shows "Completed" with success-mint color

### Requirement: Start button initiates challenge session
The home table SHALL have a "Start" button per challenge row. Clicking it SHALL navigate to the challenge workspace and begin time tracking.

#### Scenario: Starting a new challenge
- **WHEN** user clicks "Start" on a challenge with status "not-started"
- **THEN** the system sets status to "in-progress", records the current timestamp as session start, and navigates to `#/challenge/:id`

#### Scenario: Resuming a challenge
- **WHEN** user clicks "Start" on a challenge with status "in-progress"
- **THEN** the system records the current timestamp as session start and navigates to `#/challenge/:id`

### Requirement: Overall progress display
The home view SHALL display an overall progress indicator showing the percentage of challenges completed.

#### Scenario: Progress calculation
- **WHEN** 2 of 3 challenges have status "completed"
- **THEN** the progress indicator shows "67%" with a visual progress bar
