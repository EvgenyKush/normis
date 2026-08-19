# Task 5: Rebuild the landing page and accessible quiz

Implement only Task 5 from `docs/superpowers/plans/2026-08-17-local-mvp.md` and obey its Global Constraints.

Generate root `index.html` from the preserved landing message/section order, shared CSS, normalized relative course links, Continue enhancement, and canonical anti-urgency promises. Create `assets/js/quiz.js`, integrate `site.js` and the build/verifier/tests. Expose `window.OrdinaryQuiz.mount(rootElement)`. Use eight question objects `{title, autopilot, critical}`, in-memory state only, introduction step 0, questions 1–8, result thereafter, disabled Next until answer, Back preserving answers, canonical score bands, polite live regions, focus moved to step heading, native radio/buttons, no focus trap, and noscript link to full test content.

Root landing must now be required as a regular file; remove its temporary missing-target exemption. Preserve all prior tests and generated pages. Do not initialize Git. Write exact evidence/self-review to `.superpowers/sdd/2026-08-17-local-mvp/task-5-report.md`.
