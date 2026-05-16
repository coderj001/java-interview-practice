## ADDED Requirements

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
