## Why

The current UI does not explicitly enforce a consistent visual system across screens, which leads to drift in layout, typography, and component styling. We need a defined UI update anchored to `DESIGN.md` so future UI changes remain coherent and measurable.

## What Changes

- Apply a UI refresh to the web interface using `DESIGN.md` as the source of truth for color, typography, spacing, shape, and component styling.
- Define requirement-level behavior for how design tokens and layout rules are applied in UI surfaces.
- Update existing UI capability requirements to ensure responsive behavior and visual consistency with the documented design base.

## Capabilities

### New Capabilities
- `design-md-ui-baseline`: Establishes requirements for using `DESIGN.md` as the canonical UI design baseline, including token usage and component styling rules.

### Modified Capabilities
- `web-ui-workspace-layout`: Update workspace layout requirements to align with the grid, spacing, and responsive rules defined in `DESIGN.md`.

## Impact

- Affected code: `web-ui` frontend styles, theme tokens, shared UI components, and page-level layout composition.
- Affected specs: new capability spec for the design baseline and a delta spec for `web-ui-workspace-layout`.
- No backend/API contract changes are expected.
