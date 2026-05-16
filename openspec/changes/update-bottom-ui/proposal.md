## Why

The current bottom UI panel contains tabs for `Test`, `Review`, `Hints`, and `Notes`. The `Test` tab recently received a UI update that improved its layout, structured output, and overall user experience. However, the other tabs (`Review`, `Hints`, and `Notes`) still use older, unpolished designs. This change ensures a consistent, high-quality visual language and user experience across all tabs in the bottom panel.

## What Changes

- Redesign the `Review` panel to match the structured and polished aesthetics of the `Test` panel.
- Redesign the `Hints` panel to provide clearer, visually distinct hint presentation matching the design system.
- Redesign the `Notes` panel to align with the new standard layout.
- Standardize the container, padding, background colors, and typographic hierarchy across all bottom panel views.

## Capabilities

### New Capabilities
<!-- None -->

### Modified Capabilities
- `web-ui-workspace-layout`: The internal layout structure and CSS styling for the bottom workspace panels (Review, Hints, Notes) are being updated to be consistent with the Test panel's UI.

## Impact

- **Affected Code**: `web-ui/src/index.html`, `web-ui/src/index.css`, `web-ui/src/ui/workspace.js`, `web-ui/src/ui/app.js` and other UI rendering scripts.
- **Affected System**: Frontend Web UI workspace presentation layer.
- **Dependencies**: No external dependency changes; this is purely a CSS/HTML/JS DOM manipulation alignment.
