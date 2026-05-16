## 1. CSS Standardization

- [x] 1.1 Identify the container, padding, and typography CSS classes used for the `Test` panel in `web-ui/public/styles.css` (or `web-ui/src/index.css`).
- [x] 1.2 Extract or refactor these styles into reusable utility classes (e.g., `.panel-content`, `.panel-section`) if they are currently tightly coupled to `#test-content` alone.

## 2. Review Panel Update

- [x] 2.1 Update the DOM generation logic for the `Review` panel (e.g., in `interview-session.js` or server-side templates) to apply the standardized `.panel-content` classes.
- [x] 2.2 Verify that markdown-rendered feedback in the `Review` panel is visually aligned with the new structure.

## 3. Hints Panel Update

- [x] 3.1 Update the DOM generation logic for the `Hints` panel to apply the standardized panel CSS classes.
- [x] 3.2 Ensure any nested elements (like individual hint cards) use typography that matches the Test panel's output blocks.

## 4. Notes Panel Update

- [x] 4.1 Update the DOM generation logic for the `Notes` panel to apply the standardized panel CSS classes.
- [x] 4.2 Verify the textarea or content area fits the newly styled container properly.

## 5. Verification

- [ ] 5.1 Load a challenge in the browser and visually confirm seamless switching between Test, Review, Hints, and Notes tabs.
