## Context

The change introduces a UI refresh that must use `DESIGN.md` as the canonical visual baseline. Current UI behavior works functionally, but visual consistency is not enforced at requirement level, which risks incremental drift across pages and components. The update touches shared styling primitives and workspace-level layout behavior in the `web-ui` frontend.

## Goals / Non-Goals

**Goals:**
- Establish a single source of truth for UI tokens and component styling by mapping implementation to `DESIGN.md`.
- Ensure workspace layout remains responsive and usable across desktop, tablet, and mobile breakpoints.
- Preserve existing workbench behavior while updating presentation and layout consistency.

**Non-Goals:**
- No backend/API contract changes.
- No feature expansion of challenge/workbench workflows beyond existing capabilities.
- No redesign of domain behavior such as evaluation, hints, or submission logic.

## Decisions

1. Token-first styling baseline
The UI will define or align shared tokens (colors, typography, spacing, radii) to the values in `DESIGN.md`, then consume those tokens in page and component styles.
Alternative considered: direct per-component restyling without token alignment. Rejected because it increases drift and maintenance cost.

2. Responsive layout conformance in workspace views
Workspace composition will explicitly follow documented breakpoint behavior, margins, and gutters from `DESIGN.md`.
Alternative considered: preserve existing responsive rules as-is. Rejected because the change objective is design-baseline alignment, not just cosmetic tweaks.

3. Incremental component conformance
Primary buttons, inputs, cards, chips, and list rows will be updated first because they carry most of the visible system identity and are reused broadly.
Alternative considered: full component-library rewrite. Rejected as high-risk and unnecessary for this change scope.

## Risks / Trade-offs

- [Risk] Token mapping may conflict with existing ad-hoc styles in specific screens. -> Mitigation: prioritize shared primitives and resolve conflicts screen-by-screen with visual checks.
- [Risk] Responsive changes could regress usability on small screens. -> Mitigation: validate desktop/tablet/mobile viewport behavior during implementation.
- [Trade-off] Strict conformance to `DESIGN.md` may require additional CSS refactors now. -> Mitigation: accept near-term refactor cost to reduce long-term style drift.

## Migration Plan

1. Introduce or align shared token definitions in the `web-ui` styling layer.
2. Update layout containers to follow breakpoint, margin, and gutter expectations.
3. Refit core reusable components (buttons, inputs, cards, chips, list rows).
4. Validate key workbench screens across desktop, tablet, and mobile.
5. Rollback strategy: revert UI token/layout commits while leaving backend behavior untouched.

## Open Questions

- Should typography assets (e.g., `Hanken Grotesk`, `JetBrains Mono`) be bundled locally or loaded via existing external asset strategy?
- Are all current workbench pages expected to fully conform in this change, or should lower-priority pages be deferred to a follow-up change?
