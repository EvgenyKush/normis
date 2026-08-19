# Task 1 implementation report: editorial baselines and report contracts

## Scope completed

Implemented only Task 1 of the editorial-review plan. The canonical course Markdown, landing template, generated HTML, quiz data, and existing site behavior were not edited.

## Files changed

- `scripts/editorial-baseline.mjs` — exports `collectEditorialMetrics(courseText, landingText)`, exports a structural comparator, and provides a CLI for writing and comparing JSON baselines.
- `docs/editorial/baseline.json` — immutable pre-edit snapshot.
- `docs/editorial/2026-08-18-editorial-report.md` — required report headings, both prescribed table headers, and explicit future-task fill notices without empty data rows.
- `tests/editorial-integrity.test.mjs` — focused collector and report-contract tests.
- `.superpowers/sdd/2026-08-18-editorial-review/task-1-report.md` — this implementation record.

## Metric definitions

- `parts`: Markdown headings matching `# ЧАСТЬ I.`, `# ЧАСТЬ II.`, or `# ЧАСТЬ III.`.
- `modules`: Markdown headings matching `## Модуль 1` through `## Модуль 6`.
- `headings`: all Markdown headings, regardless of level; `headingTexts` preserves their source order with Markdown markers removed.
- `practices`: headings or standalone bold lead-ins beginning with `Практика`.
- `quizSituations`: lines matching `**1.` through `**8.` only inside the canonical `## Тесты:` block.
- `finaleHeadings`: Markdown headings from `# ФИНАЛ` through EOF.
- `chartReferences`: Markdown image references in the course source.
- `paragraphs`: course prose blocks, excluding headings, rules, standalone images, lists, and tables, plus non-empty `<p>` elements in the landing template.
- `words`: Unicode word tokens in visible course Markdown and visible landing HTML; image/link targets and HTML scripts/styles do not count.

The frozen baseline records: 3 parts, 6 modules, 69 headings, 8 practices, 8 quiz situations, 5 finale headings, 5 chart references, 323 paragraphs, and 23,540 words.

## Commands and output

1. `node --test tests/editorial-integrity.test.mjs`

   Initial red run failed as intended with `ERR_MODULE_NOT_FOUND` for `scripts/editorial-baseline.mjs`.

2. `node scripts/editorial-baseline.mjs --write docs/editorial/baseline.json`

   Output: `Editorial baseline written: C:\Users\Surface\Projects\normis\docs\editorial\baseline.json`

3. `node --test tests/editorial-integrity.test.mjs`

   Output: 2 tests passed, 0 failed.

4. `node --test`

   Output: 37 tests passed, 0 failed.

5. `node --check scripts/editorial-baseline.mjs`

   Output: exit 0, no diagnostics.

6. `node --check tests/editorial-integrity.test.mjs`

   Output: exit 0, no diagnostics.

7. `node scripts/editorial-baseline.mjs --compare docs/editorial/baseline.json`

   Output: JSON with `"differences": []` and identical baseline/current metrics.

## Self-review and concerns

- The collector reads source text only and the baseline was generated before any canonical-prose edits.
- The `--allow-text-change` comparison deliberately still protects structural counts and ordered heading text; later tasks that intentionally change a heading will need to treat that as a structural decision rather than silently accepting it.
- Paragraph and word totals are deterministic editorial metrics, not browser-layout measurements; they are defined above so later comparisons remain interpretable.

## Fix round 1: baseline and CLI contract coverage

The focused integrity suite now reads `docs/editorial/baseline.json` directly. It rejects a missing or malformed file through the normal file/JSON reads; asserts the exact metric-key order; checks the no-BOM, stable two-space UTF-8 serialization; and deep-compares every stored metric, including ordered headings, with a fresh collector run against the untouched canonical Markdown and landing template.

The same suite now launches the CLI in an isolated temporary directory. It asserts the exact `--write` status/output and serialized bytes, then checks that `--compare` exits 0 with `differences: []` for the freshly written baseline and exits 1 with `differences: ["parts"]` for a deliberately altered temporary copy. The real baseline is only read by this fix round.

### Fix-round commands and output

8. `node --test tests/editorial-integrity.test.mjs`

   Output: 4 tests passed, 0 failed. This includes the real-baseline serialization test and isolated `--write`/`--compare` CLI test.

9. `node --test`

   Output: 39 tests passed, 0 failed.

## Fix round 2: immutable snapshot versus editable prose

The prior fresh-metrics equality check has been replaced. `docs/editorial/baseline.json` is now protected as an exact frozen artifact: the test reads it directly, checks UTF-8/no BOM, prescribed key order, two-space serialization, and SHA-256 `f6c3243cbfbba713d3024a1be5025508d2d3aaa3ecad5ac1ba94f2f8129a3fba`. A missing, corrupt, reordered, or modified snapshot fails this test without relying on mutable course prose.

Current canonical sources are instead compared with `compareEditorialMetrics(..., { allowTextChange: true })`. This preserves all structural counts and the ordered heading text while explicitly allowing `paragraphs` and `words` to change during editorial work. Regression assertions demonstrate that a prose-only source mutation changes the word metric without invalidating the frozen structural contract, whereas renaming a part heading invalidates it through the `parts` difference.

### Fix-round commands and output

10. `node --test tests/editorial-integrity.test.mjs`

    Output: 5 tests passed, 0 failed.

11. `node --test`

    Output: 40 tests passed, 0 failed.
