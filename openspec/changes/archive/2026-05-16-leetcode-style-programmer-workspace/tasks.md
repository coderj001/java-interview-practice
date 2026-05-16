## 1. Workspace Structure

- [x] 1.1 Refactor `renderWorkspace()` into named render helpers for header, problem pane, editor pane, feedback tabs, and mobile navigation.
- [x] 1.2 Replace the vertical workspace markup with desktop problem/editor regions plus a feedback area.
- [x] 1.3 Keep existing action IDs or update event binding so home, timer, Vim, run tests, submit, review, hint, and notes handlers still attach correctly.

## 2. Feedback Behavior

- [x] 2.1 Add client state for the active feedback panel and active mobile workspace panel.
- [x] 2.2 Render tests, review, hints, and notes as feedback panels instead of a raw vertical stack.
- [x] 2.3 Automatically switch to the relevant feedback panel after run tests, review, or hint completes.
- [x] 2.4 Keep notes debounce and blur persistence working from the feedback notes panel.

## 3. Styling

- [x] 3.1 Add desktop CSS grid styles for the LeetCode-style problem pane, coding pane, and feedback region.
- [x] 3.2 Add stable editor sizing so CodeMirror remains usable without being pushed below the prompt.
- [x] 3.3 Add mobile tab/segmented navigation styles so problem, code, and feedback regions fit within narrow viewports.
- [x] 3.4 Preserve the existing dark visual language and typography from `DESIGN.md`.

## 4. Verification

- [x] 4.1 Run existing web UI tests or targeted Node tests that cover challenge rendering and workflow behavior.
- [x] 4.2 Start the local web UI and manually verify a challenge page on desktop width: problem pane, editor pane, run tests, submit, review, hint, notes, and timer.
- [x] 4.3 Verify mobile width behavior: no horizontal overflow, workspace panel switching works, and editor/test feedback remain usable.
- [x] 4.4 Run `npx @fission-ai/openspec@latest status --change leetcode-style-programmer-workspace` and confirm the change is apply-ready.
