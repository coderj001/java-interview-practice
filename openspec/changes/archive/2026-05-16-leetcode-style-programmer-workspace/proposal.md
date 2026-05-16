## Why

The current challenge workspace is a single vertical stack, which forces programmers to scroll between the problem statement, editor, actions, notes, test results, and AI output. A coding interview workspace should keep the prompt, code, and feedback visible together so users can iterate without losing context.

## What Changes

- Replace the vertical challenge workspace with a LeetCode-style programmer layout.
- Show challenge details in a persistent problem pane and the CodeMirror editor in a primary coding pane on desktop.
- Move code actions into an editor-oriented toolbar so run, submit, review, hint, and Vim toggle stay near the editor.
- Present test results, AI review, hints, and notes in a dedicated feedback area instead of a long page stack.
- Preserve existing routes, APIs, scoring, timer, notes persistence, AI provider selection, and CodeMirror behavior.
- Add responsive behavior so mobile users can switch between problem, code, and feedback views without horizontal overflow.

## Capabilities

### New Capabilities
- None

### Modified Capabilities
- `challenge-workbench`: challenge workspace layout and feedback presentation change while preserving run, submit, notes, timer, review, and hint behavior.
- `web-ui-workspace-layout`: browser challenge route changes from a vertical stack to a responsive split-pane workspace.
- `code-editor-codemirror`: editor presentation changes so CodeMirror is the primary coding surface in a programmer-focused pane.

## Impact

- `web-ui/public/app.js`: workspace rendering, action binding, feedback panel rendering, and mobile view state.
- `web-ui/public/styles.css`: split-pane desktop layout, responsive mobile tabs, editor sizing, and feedback panels.
- `web-ui/views/index.ejs`: only if top-level shell structure needs minor support; no route/API changes expected.
- No new external dependencies are required for the minimal version.
