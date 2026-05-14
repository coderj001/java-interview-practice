## ADDED Requirements

### Requirement: The Node host lives in the web-ui workspace
The system MUST place the active Node.js server, package metadata, templates, and browser assets under `web-ui/`.

#### Scenario: Start the browser host
- **WHEN** a developer starts the web application
- **THEN** the active Node entry point MUST be loaded from the `web-ui/` workspace

#### Scenario: Inspect browser host ownership
- **WHEN** a developer inspects the repository layout
- **THEN** the files that serve the UI and HTTP API MUST be grouped under `web-ui/`

### Requirement: Web UI reorganization preserves the current browser workbench contract
Moving the Node host into `web-ui/` MUST NOT remove the existing browser workbench capabilities.

#### Scenario: Open the browser workbench
- **WHEN** a user opens the application after the reorganization
- **THEN** the UI MUST still provide challenge selection, code editing, test execution, submission, review, and hint actions

#### Scenario: Access API routes after the move
- **WHEN** the browser client requests challenge or submission endpoints
- **THEN** the Node host MUST continue serving the existing workbench API behavior from the reorganized workspace
