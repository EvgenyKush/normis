# Task 5 — landing page and accessible quiz report

## Scope delivered

- `content/landing.html` is now the maintainable canonical landing template rather than a copy of the full course. It contains the supplied composition and message order—hero → dictionary → program → compatibility → conditions → quiz → final CTA—plus explicit placeholders for shared assets, normalized course targets, Continue, quiz root, and noscript quiz text.
- `scripts/build-site.ps1` reads that template, substitutes a fixed placeholder map, rejects unresolved placeholders, and deterministically writes root `index.html` alongside the eight existing course pages. It has no separately embedded landing document.
- The landing uses only shared `theme.css` and `site.css`, links directly to `course/index.html`, links each module/finale to its normalized relative page, includes a hidden-by-default Continue enhancement, and states the canonical promises “Без таймеров”, “Без искусственного дефицита”, and “Без навязанной срочности”.
- Created `assets/js/quiz.js`, exposing `window.OrdinaryQuiz.mount(rootElement)`. Its eight objects contain only `title`, `autopilot`, and `critical`; state is the in-memory `{step, answers}` closure and the file contains no storage API.
- The quiz renders introduction step 0, questions 1–8, then result; disables Next until an answer exists; preserves answers through Back; supports reset; renders the canonical 0–2, 3–5, and 6–8 interpretations; updates polite status/result regions; and focuses the current step heading. All eight titles and both reactions now match `content/course.md` byte-for-byte at the string level.
- A native “Закрыть тест” button enters an in-memory closed state. Close moves focus to the stable native “Вернуться к тесту” button at the quiz root; reopening restores the prior step/answer and returns focus to its heading. Reset and close/reopen do not trap focus.
- Quiz choices are native, labelled radio inputs with one shared name per rendered question. All actions are native buttons. There is no dialog, focus trap, global keyboard interception, or forced scroll lock.
- The landing retains meaningful static content without JavaScript and provides a `<noscript>` link to the complete eight-situation text in `course/module-6.html`.
- `assets/js/site.js` mounts the quiz independently of progress storage and maps a saved landing Continue target to the correct `course/*.html` relative URL.
- `scripts/verify-site.mjs` now requires root `index.html` and `assets/js/quiz.js` as regular files, removes the former missing-landing exemption, validates all landing-template placeholders and generated landing structure/live regions/noscript/local links, counts exactly eight question objects, requires `OrdinaryQuiz.mount`, native same-name radios, semantic close/reopen controls, and rejects quiz storage use. It independently evaluates the isolated question array and compares all 24 fields with the eight canonical Markdown situations.
- Shared CSS now covers the full landing/quiz composition and prevents an empty horizontal scrollbar at narrow widths. No yellow primary CTA was introduced.

## TDD evidence

Initial landing/quiz red run:

```text
node --test tests/quiz.test.mjs tests/verify-static-assets.test.mjs
tests 14
pass 9
fail 5

- OrdinaryQuiz.mount was undefined in all three behavior tests
- index.html was not yet required
- landing/quiz verifier failures were not yet produced
```

Landing generation/bootstrap red run:

```text
node --test tests/build-landing.test.mjs tests/site.test.mjs
tests 2
pass 0
fail 2

- generated index.html did not exist
- landing bootstrap did not mount the quiz
```

Responsive regressions were also observed red before the CSS fixes: the build test rejected `body { min-width: 20rem }`, then rejected the absent supported root overflow boundary. The final landing assertions were folded into the existing generator test so only one test file writes generated pages.

Round-one review fixes began with this red run:

```text
node --test tests/build-course-pages.test.mjs tests/quiz.test.mjs tests/site.test.mjs
tests 11
pass 8
fail 3

- ProjectRootOverride was absent, so an isolated source-template build could not run
- semantic “Закрыть тест” was absent
- canonical Markdown equality showed drift in questions 1, 2, 4, 5, 7, and 8
```

Verifier defense-in-depth also failed red before implementation:

```text
node --test tests/verify-static-assets.test.mjs
tests 12
pass 10
fail 2

- close/reopen controls were not verifier-enforced
- canonical quiz-copy drift was not rejected
```

## Final automated verification evidence

Run from the project root on 2026-08-17:

```text
node --test
tests 25
pass 25
fail 0
```

The complete suite was run twice consecutively after the round-one fixes. Both runs reported 25 passing tests and 0 failures.

```text
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/build-site.ps1
Course pages generated: 8
Landing page generated: 1

node --check assets/js/quiz.js
node --check assets/js/site.js
node --check scripts/verify-site.mjs
# all three exited 0 with no diagnostics

node scripts/verify-site.mjs
Static asset inventory: PASS
Course page graph: PASS
Progress contract: PASS
Landing and quiz contract: PASS
```

Automated quiz coverage includes native labelled/same-name radio pairs on all eight steps, disabled/enabled Next state, heading focus, Back answer preservation, reset focus recovery, close/reopen state and focus, polite result output, all three canonical score bands, and exact equality with the canonical Markdown. Bootstrap coverage verifies quiz mounting and Continue normalization for `index`, modules 1–6, and `finale`. A temporary isolated-project build proves that editing a safe heading in `content/landing.html` propagates to its generated `index.html`.

## Browser evidence

The generated page was exercised in the in-app browser through a local preview:

- Complete eight-question flow returned: `Обнаружено автопилотов: 3 из 8. 3–5 — норма живого человека...`.
- After advancing and using Back, the prior `autopilot` choice remained checked, Next remained enabled, and the question heading held focus.
- At every transition and at the result, the active element was the rendered `H3` step heading.
- Final responsive measurements after a fresh-origin load:

```text
320:  clientWidth 305, scrollWidth 305, quizWidth 289
768:  clientWidth 753, scrollWidth 753, quizWidth 721
1280: clientWidth 1265, scrollWidth 1265, quizWidth 768
```

The client widths exclude the browser's 15px classic scrollbar gutter; matching client/scroll widths confirm no horizontal page overflow at all three targets.

## Self-review

- One `<h1>` is generated; section headings follow the preserved order and the quiz heading hierarchy remains inside the landing outline.
- Course content and all eight existing generated pages remain unchanged in structure and continue passing their source-order, link, heading, chart, and progress tests.
- Landing and course URLs are relative; all landing `href`/`src` targets are verifier-checked as regular files.
- The generator reads the landing source itself; an isolated fixture edit propagates, and missing or unresolved placeholders fail the build/verifier instead of silently falling back to hard-coded copy.
- Quiz answers cannot persist across reloads because `quiz.js` has no access to `localStorage`, `sessionStorage`, or IndexedDB, and the verifier rejects those APIs in that file.
- The quiz uses no custom key handlers: keyboard behavior is delegated to native button/radio semantics, including radio arrow-key behavior. Focus movement is limited to the new step heading after an open-state render; reset returns focus to the introduction heading, close focuses the reopen button, and reopening focuses the restored step heading.
- Continue initialization and quiz initialization are independent, so blocked/malformed progress storage cannot prevent quiz use or landing reading.
- At 320px, all grids collapse to one column, the quiz fieldset has `min-width: 0`, and the root hides only empty horizontal gutter overflow after element bounds were confirmed within the 320px layout viewport.
- No Git commands or repository initialization were used.

## Concerns

- The in-app browser security policy blocks `file://` navigation, so a live direct-file browser smoke test could not be performed in this task. Direct-file compatibility is covered structurally by classic non-module scripts, relative-only local references, no external runtime dependency, successful generation, and the static link verifier. The live interaction/layout checks used `http://127.0.0.1` only as a browser test surface.
- Browser-control key injection did not activate native controls in this browser surface, so keyboard contracts are evidenced by native-control markup plus automated DOM/state/focus tests rather than a live synthetic-key run. No product code intercepts or replaces native keyboard behavior.
- The in-app browser was unavailable when reconnecting for the round-one close/reopen smoke test. The earlier landing/quiz flow and responsive evidence above remains valid; the new close/reopen interaction is covered by the focused real-DOM state/focus harness and verifier contracts.
