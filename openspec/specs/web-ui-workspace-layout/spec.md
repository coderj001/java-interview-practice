## Purpose

TBD
## Requirements
### Requirement: The Node host lives in the web-ui workspace
The system MUST place the active Node.js server, package metadata, templates, and browser assets under `web-ui/`.

#### Scenario: Start the browser host
- **WHEN** a developer starts the web application
- **THEN** the active Node entry point MUST be loaded from the `web-ui/` workspace

#### Scenario: Inspect browser host ownership
- **WHEN** a developer inspects the repository layout
- **THEN** the files that serve the UI and HTTP API MUST be grouped under `web-ui/`

### Requirement: Web UI reorganization preserves the current browser workbench contract
Moving the Node host into `web-ui/` MUST NOT remove the existing browser workbench capabilities. The UI SHALL use client-side hash routing to present two views: a home view (`#/home`) with a challenge table and a challenge workspace view (`#/challenge/:id`).

#### Scenario: Open the browser workbench
- **WHEN** a user opens the application after the redesign
- **THEN** the UI MUST display the home view with a challenge table listing all challenges

#### Scenario: Navigate to challenge workspace
- **WHEN** a user clicks "Start" on a challenge in the home table
- **THEN** the UI MUST navigate to `#/challenge/:id` showing the challenge workspace with code editing, test execution, submission, review, and hint actions

#### Scenario: Navigate back to home
- **WHEN** a user clicks a back/home navigation element from the challenge workspace
- **THEN** the UI MUST return to the home view at `#/home`

#### Scenario: Access API routes
- **WHEN** the browser client requests challenge or submission endpoints
- **THEN** the Node host MUST continue serving the workbench API behavior

#### Scenario: Design system adoption
- **WHEN** the UI renders any view
- **THEN** all styling MUST follow the DESIGN.md specification: dark mode surface colors, Hanken Grotesk for UI text, JetBrains Mono for code/labels, glassmorphism elevation for panels

