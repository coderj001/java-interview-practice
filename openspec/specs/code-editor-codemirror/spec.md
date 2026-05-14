# code-editor-codemirror Specification

## Purpose
TBD - created by archiving change ui-redesign-home-workspace. Update Purpose after archive.
## Requirements
### Requirement: CodeMirror 6 editor with Java syntax
The challenge workspace SHALL use CodeMirror 6 as the code editor with Java language support, replacing the plain textarea.

#### Scenario: Editor loads with starter code
- **WHEN** user opens a challenge workspace
- **THEN** CodeMirror 6 renders with the challenge's starterCode, Java syntax highlighting active, and dark theme matching DESIGN.md colors

#### Scenario: Editor content is used for test runs
- **WHEN** user clicks "Run Tests"
- **THEN** the system reads the current CodeMirror editor content and sends it to the run-tests API

### Requirement: Vim keymap toggle
The editor SHALL support an optional Vim keymap mode, togglable via a toolbar button.

#### Scenario: Vim mode off by default
- **WHEN** the editor loads
- **THEN** Vim mode is disabled and the editor uses standard keybindings

#### Scenario: Toggling Vim mode on
- **WHEN** user clicks the "VIM" toggle button in the editor toolbar
- **THEN** Vim keymap activates with normal/insert/visual modes and the toggle shows active state

#### Scenario: Toggling Vim mode off
- **WHEN** user clicks the "VIM" toggle button while Vim is active
- **THEN** standard keybindings are restored

### Requirement: Editor theme matches design system
The editor theme SHALL use colors from DESIGN.md: surface-deep background, on-surface text, primary-container for cursor, and JetBrains Mono font.

#### Scenario: Theme consistency
- **WHEN** the editor renders
- **THEN** background is `#020617` (surface-deep), text is `#dae2fd` (on-surface), and font is JetBrains Mono

