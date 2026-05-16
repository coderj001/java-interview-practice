## Context

The bottom panel in the web UI provides multiple tabs (`Test`, `Review`, `Hints`, `Notes`) for the user during a challenge. The `Test` tab was recently updated to a more structured, polished UI. However, the other tabs currently retain an outdated or generic design. This creates an inconsistent user experience and visually jarring transitions when switching tabs.

## Goals / Non-Goals

**Goals:**
- Unify the visual language of the `Review`, `Hints`, and `Notes` tabs with the new `Test` tab design.
- Apply consistent padding, background colors, typography, and container structures across all bottom panel tabs.
- Ensure any dynamic content injected into these tabs matches the established CSS class patterns.

**Non-Goals:**
- Changing the underlying behavior or backend logic for how Reviews, Hints, or Notes are generated.
- Redesigning the entire workbench or editor layout.
- Adding new tabs or features.

## Decisions

- **CSS Alignment:** We will update `web-ui/public/styles.css` to define shared classes (e.g., `panel-content`, `panel-section`) that mirror the `Test` tab structure and apply them to the other panels.
- **HTML/DOM Update:** The DOM generation for `Review`, `Hints`, and `Notes` (likely in `interview-session.js` or `views/interviewee.ejs`) will be refactored to use the newly standardized CSS classes.
- **Why?** Reusing CSS classes ensures maintainability and immediately brings the other tabs up to the same visual standard without duplicating styles.

## Risks / Trade-offs

- **Risk:** Existing raw HTML content (e.g., from markdown rendering) might look incorrect within the new structured containers.
  - *Mitigation:* Ensure the new CSS handles generic HTML elements (`<p>`, `<ul>`, `<pre>`) gracefully within the panel context, or wrap the content in a specific typography class.
- **Trade-off:** Standardizing the layout might constrain some tab-specific custom designs in the future, but consistency is prioritized over uniqueness for these utility panels.
