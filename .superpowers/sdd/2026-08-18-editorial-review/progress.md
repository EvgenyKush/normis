# SDD ledger — plan: docs/superpowers/plans/2026-08-18-editorial-review.md

Execution note: the workspace is intentionally not a Git repository. Reviews inspect task-owned files and reports directly; no commit-range package exists.

## Preflight scan

| Scope | Producer → consumer / internal check | Finding |
|---|---|---|
| Task 1 | metric collector → Tasks 2, 3, 7 | Clean; exact metric keys are declared. |
| Tasks 1, 2, 3, 5, 6 | shared `tests/editorial-integrity.test.mjs` | Sequential ownership required; each task preserves earlier assertions. |
| Tasks 2 and 3 | sequential edits to `content/course.md` | Clean; Part I and Parts II–EOF have explicit non-overlapping boundaries. |
| Tasks 2 and 3 | claim inventories → Task 4 | Clean; both inventories declare fields and unique prefixes. |
| Task 4 | fact register → Task 5 exact wording | Clean; Task 5 consumes status and proposed wording recorded by Task 4. |
| Tasks 1–7 | shared editorial report | Sequential append/update required; row schemas fixed in Task 1. |
| Task 5 | edited canonical quiz situations → Task 6 quiz synchronization | Clean; exact deep equality is the interface. |
| Task 6 | canonical sources → Task 7 generator | Clean; generated HTML remains derived and is rebuilt only in Task 7/focused tests. |
| Task 1 | tests versus collector/report files | Internally consistent. |
| Task 2 | preservation guards versus Part I edits | Internally consistent; structure is immutable while prose may change. |
| Task 3 | preservation guards versus Parts II–final edits | Internally consistent. |
| Task 4 | research scope versus source hierarchy | Internally consistent; primary/official sources are mandatory. |
| Task 5 | failing high-risk assertions versus approved register wording | Internally consistent; red state exists before application. |
| Task 6 | landing/quiz edits versus fidelity/synchronization tests | Internally consistent; approved copy changes must be explicit. |
| Task 7 | generated outputs, report completion, and final review | Internally consistent; full verification follows regeneration. |

Preflight result: no conflicts requiring a ruling.

Task 1: fix round 1/5 (2 addressed, 1 new open — baseline and CLI coverage; future prose equality overconstrained)
Task 1: fix round 2/5 (1 addressed, 0 open — frozen snapshot separated from structural comparison)
Task 1: complete (review clean)

Task 2: fix round 1/5 (6 addressed, 2 open — generated restoration, inventory completeness, Russian correction, report rows, preservation tests; universal risk and generator scope remained)
Task 2: fix round 2/5 (1 addressed, 1 open — production generator restored; universal risk validator remained incomplete)
Task 2: fix round 3/5 (1 addressed, 0 open — universal policy and Unicode-aware mutation coverage)
Task 2: complete (review clean)

Task 3: fix round 1/5 (5 Important and 2 Minor addressed; duplicate/missing self-irony claim remained)
Task 3: fix round 2/5 (remaining inventory and idiom findings addressed)
Task 3: complete (review clean)

Task 4: fix round 1/5 (source metadata and major cluster repairs; semantic boilerplate remained)
Task 4: fix round 2/5 (mapping rebuilt; overbroad scaffolds remained)
Task 4: fix round 3/5 (named factual findings resolved; modal/deletion wrappers remained)
Task 4: fix round 4/5 (claim-specific wording resolved; Task-5 application contract remained)
Task 4: fix round 5/5 (F-001 schema, exact anchors, integrated span patches, jargon resolved)
Task 4: minor (deferred): 80 audit-note cells have cosmetic trailing separator punctuation.
Task 4: complete (review clean; 24/25 production tests, with one stale Markdown-only source assertion explicitly deferred to Task 5)

Ruling: Fact-checking discovered unsupported claim-bearing text embedded in raster charts. Apply report decisions to canonical references in Task 5 and preserve each conceptual location with an accessible textual replacement when a PNG is deleted; defer any retained-PNG rendering adjustment and visual QA to Task 7. This prioritizes factual accuracy and accessibility over preserving every original bitmap. Cost if wrong: two chart positions may become text-first figures rather than the originally promised PNG presentation.


Ruling (2026-08-18, user): the external package at OneDrive/files holds a fuller source (six sections absent from the canon). Merge only what is missing; do NOT revisit the prior pass's deletions (224 of 462 decisions were closed as "удалено", reducing the course from 23 540 to 16 797 words). Cost if wrong: the shipped course keeps the reduced argumentation of the earlier fact-check pass.

Merge task (added): complete — six sections merged with the same editorial treatment (18 registered scoping edits), 31 M-* claims inventoried, four direct sources, F-281 heading decision preserved against the fuller source, structural guards updated, malformed swap-table row repaired.

Task 6: complete (quiz regenerated from canon; landing email-course promise, diagnostic eyebrow, English "enough", week entry and finale card corrected; all changes registered as approved substitutions).

Task 7: complete (rebuild to 9 pages incl. course/week.html; report gains merge, sources, landing and statistics sections; report-completeness and merged-inventory guards added; 72/72 tests, verifier PASS, 11/11 syntax; manual acceptance updated).
Task 7: review — self-review only; no independent reviewer was dispatched (session policy forbids unrequested subagents). Full-styling visual QA remains LIMITED: the preview renders local files as data: snapshots without relative CSS.
