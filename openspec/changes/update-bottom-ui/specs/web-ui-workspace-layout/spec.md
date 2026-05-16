## ADDED Requirements

### Requirement: Bottom feedback panel styling is consistent
The system SHALL display the content for the `Test`, `Review`, `Hints`, and `Notes` tabs using a unified visual design structure. All panels MUST share standard background styling, consistent padding, typographic treatments, and container layouts derived from the `Test` panel design.

#### Scenario: Switching between feedback tabs
- **WHEN** the user switches between `Test`, `Review`, `Hints`, and `Notes` tabs
- **THEN** the active panel content is displayed within identically structured containers to ensure a visually seamless transition

#### Scenario: Dynamic HTML rendering in feedback panels
- **WHEN** a feedback panel renders dynamic HTML (such as rendered markdown for reviews or hints)
- **THEN** the injected HTML MUST adopt the typography and spacing rules defined for the feedback panel container
