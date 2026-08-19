# Task 4: Add resilient reading progress

Implement only Task 4 from `docs/superpowers/plans/2026-08-17-local-mvp.md` and obey its Global Constraints.

Create `assets/js/progress.js` and `assets/js/site.js`, extend verifier/tests and generator. Expose `window.CourseProgress` with exact methods `read`, `visit`, `complete`, `clear`; use key `ordinary-self-progress-v1`; validate parsed data and catch every storage failure. Generate `data-page-kind="course"` and correct `data-course-slug` on all eight pages. Use enhancement-only controls hidden until initialization, explicit mark-complete buttons, completed-state updates, and a fixed slug-to-relative-URL Continue map. Reading and links must work without scripts or storage.

Preserve prior build and checks; rebuild generated pages. Do not initialize Git. Write exact evidence/self-review to `.superpowers/sdd/2026-08-17-local-mvp/task-4-report.md`.
