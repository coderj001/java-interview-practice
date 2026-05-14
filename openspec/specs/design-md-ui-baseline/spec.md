# design-md-ui-baseline Specification

## Purpose
TBD - created by archiving change apply-ui-update-use-design-md-base. Update Purpose after archive.
## Requirements
### Requirement: Web UI SHALL use DESIGN.md token values as the visual baseline
The system MUST implement the web UI visual foundation from `DESIGN.md`, including named color tokens, typography scales, spacing rhythm, and corner radius values, as the default styling baseline.

#### Scenario: Render a standard workspace view
- **WHEN** a user opens the web UI
- **THEN** the page and primary containers MUST use the dark surface hierarchy defined in `DESIGN.md`
- **AND** core text styles MUST map to the defined typography families and sizes

### Requirement: Responsive layout SHALL follow the documented grid model
The system MUST apply the layout breakpoints and grid behavior from `DESIGN.md` for desktop, tablet, and mobile views.

#### Scenario: Resize from desktop to mobile
- **WHEN** the viewport changes across breakpoint ranges
- **THEN** the UI MUST transition from the desktop grid model to tablet and mobile models with documented gutters and margins

### Requirement: Core components SHALL follow DESIGN.md component styling rules
The system MUST style primary buttons, inputs, cards, chips, and list rows according to `DESIGN.md` component guidance so shared UI interactions are visually consistent.

#### Scenario: Inspect primary interactive controls
- **WHEN** a user views controls across workbench screens
- **THEN** buttons, inputs, cards, chips, and list rows MUST reflect the defined border, fill, focus, and state behaviors from `DESIGN.md`

