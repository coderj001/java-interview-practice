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

### Requirement: Challenge workspace uses programmer split layout
The challenge workspace SHALL present challenge reading and coding as separate workspace regions on desktop-sized viewports.

#### Scenario: Open challenge on desktop
- **WHEN** a user navigates to `#/challenge/:id` on a desktop-sized viewport
- **THEN** the workspace displays the challenge details in a problem pane and the CodeMirror editor in a coding pane without requiring vertical scrolling between them

#### Scenario: Challenge actions remain available
- **WHEN** a user is coding in the desktop workspace
- **THEN** run tests, submit, review, hint, and Vim controls remain available from the coding region

### Requirement: Challenge workspace adapts to mobile
The challenge workspace SHALL avoid horizontal split panes on mobile-sized viewports.

#### Scenario: Open challenge on mobile
- **WHEN** a user navigates to `#/challenge/:id` on a mobile-sized viewport
- **THEN** the workspace provides a tabbed or segmented navigation between problem, code, and feedback regions

#### Scenario: Mobile content avoids horizontal overflow
- **WHEN** a user switches between mobile workspace regions
- **THEN** the active region fits within the viewport without requiring horizontal scrolling

