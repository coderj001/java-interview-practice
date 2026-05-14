## ADDED Requirements

### Requirement: Progress-based profile badges
The system MUST generate user badges from challenge progress and keep badge state updated as users complete challenges.

#### Scenario: User completes milestone
- **WHEN** a user reaches a configured completion milestone
- **THEN** the system MUST issue or upgrade the corresponding badge

### Requirement: Publicly embeddable badge surface
The system MUST expose a stable endpoint for rendering a user's current badge state for external profiles.

#### Scenario: External profile requests badge
- **WHEN** an external page requests the user badge endpoint
- **THEN** the system MUST return the current badge rendering for that user
