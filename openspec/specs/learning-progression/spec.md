## Purpose

TBD

## Requirements

### Requirement: Difficulty-tiered challenge catalog
The system MUST organize challenges into beginner, intermediate, and advanced tiers and expose tier metadata in the catalog.

#### Scenario: User filters by difficulty tier
- **WHEN** a user selects a difficulty filter in the challenge catalog
- **THEN** the system MUST return only challenges assigned to that tier

### Requirement: Per-challenge learning resources
The system MUST provide each challenge with explanation content and learning resources.

#### Scenario: User opens completed challenge explanation
- **WHEN** a user opens the explanation for a challenge
- **THEN** the system MUST display the challenge reasoning and linked learning resources
