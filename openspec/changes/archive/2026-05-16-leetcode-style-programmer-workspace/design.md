## Context

The browser challenge workspace currently renders as one vertical stack inside `web-ui/public/app.js`: header, markdown details, action buttons, editor, notes, test output, and AI output. That preserves functionality, but it is inefficient for programmers because the problem statement, code, and feedback cannot stay visible together.

The redesign should use the existing hash route, CodeMirror editor, API endpoints, provider dropdown, timer, and notes persistence. The change is a presentation and client interaction update, not a backend or data model change.

## Goals / Non-Goals

**Goals:**
- Make `#/challenge/:id` feel like a coding interview workspace: problem on the left, editor on the right, feedback below or tabbed.
- Keep run, submit, review, hint, and Vim controls near the editor.
- Keep test output readable and visible after execution without replacing the editor.
- Make mobile usable with tabs instead of horizontal split panes.
- Preserve existing API contracts and challenge state persistence.

**Non-Goals:**
- Add a new editor dependency or replace CodeMirror.
- Add draggable pane resizing in the first implementation.
- Change challenge JSON schema, scoring, sandbox behavior, AI provider behavior, or routes.
- Redesign the home table or interviewer/interviewee session views unless required by shared styles.

## Decisions

### Decision 1: CSS Grid split pane on desktop
Use a CSS Grid workspace with a problem pane and coding pane at desktop widths.

Rationale: the app is plain EJS plus browser JavaScript, and a grid layout solves the main coding ergonomics problem without introducing a pane manager dependency. It also keeps the change small and reversible.

Alternative considered: draggable split panes. This is useful later, but it adds pointer handling, persisted sizing, and edge cases that are not required to fix the current vertical layout.

### Decision 2: Mobile switches to workspace tabs
At mobile widths, render the same workspace areas behind tabs such as Problem, Code, and Results.

Rationale: side-by-side panes do not work on small screens, and a stacked page reintroduces the original problem. Tabs keep one primary task visible at a time while preserving access to every function.

Alternative considered: keep desktop grid and allow horizontal scroll. That is poor for code editing and makes test output difficult to inspect.

### Decision 3: Feedback area owns tests, AI, hints, and notes
Move test output, AI review, hints, and notes into a dedicated feedback area with selectable panels.

Rationale: feedback is episodic. It should be easy to inspect after actions without pushing the editor down the page or replacing the problem statement. Notes belong there because they support the active challenge without needing a large permanent textarea.

Alternative considered: separate vertical sections under the editor. This preserves the current scroll problem.

### Decision 4: Keep existing APIs and state shape
The client should continue calling the same endpoints and using the existing `state` object where practical.

Rationale: this change is about programmer ergonomics. Avoiding backend and schema changes reduces risk and keeps existing tests relevant.

## Risks / Trade-offs

- CSS layout regressions on narrow screens -> Verify desktop and mobile breakpoints with the running web UI.
- Hidden feedback after an action -> Automatically select the relevant feedback panel after run, review, hint, or notes interaction.
- Editor height instability -> Give the coding pane and editor stable min-height and viewport-relative sizing.
- More DOM structure in `app.js` -> Keep rendering helpers small and avoid introducing a frontend framework for this change.
