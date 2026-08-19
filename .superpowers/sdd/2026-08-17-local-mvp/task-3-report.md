# Task 3 report — deterministic course pages

## Changed files

- `scripts/build-site.ps1` — deterministic Windows PowerShell-compatible Markdown converter, canonical chapter splitter, collision-safe Cyrillic/Latin heading IDs, chart-path normalization, semantic table conversion, and eight-page reader generator.
- `scripts/verify-site.mjs` — preserves Tasks 1–2 checks and adds the required page list, course document structure checks, root/overview navigation checks, and local `href`/`src` resolution.
- `tests/verify-static-assets.test.mjs` — adds required-page, page-structure, local-target, and planned Task 5 landing-target fixtures.
- `tests/build-course-pages.test.mjs` — runs the real PowerShell generator and verifies deterministic output, all semantic shells, heading IDs, page boundaries, monotonic source-content preservation, list/table conversion, and canonical figure locations.
- `course/index.html`, `course/module-1.html` through `course/module-6.html`, and `course/finale.html` — generated UTF-8 reader pages.

## Test-first evidence

Before the verifier implementation, the expanded verifier suite failed for the two new contracts:

```text
node --test tests/verify-static-assets.test.mjs
ℹ tests 6
ℹ pass 4
ℹ fail 2
```

The failures were the missing required-page result and all absent page-structure results. After implementing those verifier checks, the suite passed and the direct verifier failed at the expected next boundary:

```text
Missing: course/index.html
Missing: course/module-1.html
Missing: course/module-2.html
Missing: course/module-3.html
Missing: course/module-4.html
Missing: course/module-5.html
Missing: course/module-6.html
Missing: course/finale.html
```

Before creating the generator, the generator integration test failed because `scripts/build-site.ps1` did not exist. Review-found regressions were also observed failing before remediation: the source table was not semantic, a literal suffixed heading could collide with a generated suffix, chapter `<h1>` elements lacked IDs, and the future landing target caused a broken-reference result.

## Final verification

Commands run from `C:\Users\Surface\Projects\normis`:

```text
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/build-site.ps1
Course pages generated: 8
```

Exit code: `0`.

```text
node --check scripts/verify-site.mjs
```

Exit code: `0` (no output).

```text
node --test tests/*.test.mjs
✔ builds deterministic semantic pages from the canonical Markdown
✔ heading ID suffixes cannot collide with literal suffixed headings
✔ reports a required path when it is a directory instead of a file
✔ requires the exact core design tokens and a non-yellow primary button
✔ ignores commented tokens and rejects yellow primary backgrounds in CSS equivalents
✔ rejects a primary-button gradient that reaches yellow through a custom-property alias
✔ requires all eight generated course pages
✔ validates course structure, navigation, and resolved local references
✔ permits the planned Task 5 landing target to be absent while retaining its link contract
ℹ tests 9
ℹ pass 9
ℹ fail 0
```

Exit code: `0`.

```text
node scripts/verify-site.mjs
Static asset inventory: PASS
Course page graph: PASS
```

Exit code: `0`.

The integration test hashes all eight outputs, rebuilds, and confirms identical SHA-256 values. It also compares every non-heading source line against its canonical output segment in monotonic order.

## Self-review

- The generator exposes the required `Convert-InlineMarkdown`, `Convert-BlockMarkdown`, and `Write-CoursePage` functions and reads only `content/course.md` as course-content input.
- Supported source constructs include ATX headings, paragraphs, unordered and ordered lists, blockquotes, thematic breaks, tables, emphasis, strong emphasis, inline code, links, and images. Source text is escaped before inline markup is applied.
- The introduction, modules 1–6, and finale are split at explicit canonical headings. The eight generated files contain exactly one `<main>` and one `<h1>`, and all headings have deterministic, unique lowercase Cyrillic/Latin IDs.
- The five source chart references remain in source order and map to normalized `../assets/charts/...` paths. Each becomes a `.chart-figure` with source alt text and a matching caption; the Module 4 prose following its inline image remains after the figure.
- Each shell includes a skip link, relative shared styles, site navigation, chapter metadata, an article, a native openable `<details>` course TOC, and previous/next chapter navigation. Optional Task 4 shared scripts are emitted automatically once their files exist, so Task 3 does not create out-of-scope JavaScript placeholders or broken `src` targets.
- Every page contains a root landing link and a course-overview link. Because root `index.html` is created by Task 5, the verifier phase-allows only that exact absent future target; all other local targets must resolve. A dedicated fixture protects both the required link and this plan-order exception.
- The original `Static asset inventory: PASS` direct-run output is retained for backward compatibility, with a separate course-graph success line.
- Independent read-only review found no remaining Critical or Important issues after remediation.
- No Git repository was initialized and no Git operation was performed.

## Controller fix round 1

The generator now computes reading metadata from each chapter body after Markdown conversion. The exact deterministic formula is:

```text
visibleWords = count of [Unicode letter-or-number]+ tokens, allowing internal hyphen, apostrophe, or right apostrophe
readingMinutes = max(1, ceil(visibleWords / 180))
```

HTML tags are removed and entities are decoded before counting. Every generated page exposes both values as `<span class="reading-time" data-word-count="…">N мин чтения</span>`. The integration test independently extracts the visible article body, applies the same documented lexical rule, and verifies both the word count and minutes for all eight pages.

Canonical hierarchy and order were corrected as follows:

- the exact Part I, II, and III source labels appear before their corresponding module `<h1>` as non-heading `.chapter-eyebrow` paragraphs;
- part labels are no longer moved into the body after module titles;
- source subsection headings are promoted relative to the page `<h1>` so ordinary chapter sections use `<h2>`;
- nested headings after an in-body source `<h2>` retain their depth, including Module 6’s `<h2>` test section and its `<h3>` result explanation;
- all eight outlines are checked for skipped levels, and focused assertions protect the canonical part/title order.

Local-reference validation now follows targets only when they are regular files. The sole Task 5 allowance applies only when `lstat` reports `ENOENT` for root `index.html`. A directory, dangling/invalid entry, permission error, I/O error, or other non-file target fails. Regression coverage includes an ordinary directory target, a directory occupying the future landing path, and a focused `EPERM` metadata error.

The focused inline converter test also confirms that `<`, `&`, and quotes are escaped before strong emphasis, links, and inline code are rendered.

### Fix-round test-first evidence

Before implementation, the expanded suite produced three expected failures:

```text
✖ builds deterministic semantic pages from the canonical Markdown
  index.html does not skip heading levels: 1,3
✖ validates course structure, navigation, and resolved local references
  missing reading time was not reported
✖ rejects local targets that exist as directories, including the planned landing path
  a directory at ../index.html was incorrectly tolerated
ℹ tests 10
ℹ pass 7
ℹ fail 3
```

### Fix-round final verification

Commands run from `C:\Users\Surface\Projects\normis`:

```text
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/build-site.ps1
node --check scripts/verify-site.mjs
node --check tests/verify-static-assets.test.mjs
node --check tests/build-course-pages.test.mjs
node --test tests/*.test.mjs
node scripts/verify-site.mjs
```

Output:

```text
Course pages generated: 8
✔ builds deterministic semantic pages from the canonical Markdown
✔ heading IDs remain collision-safe and inline Markdown escapes before rendering
✔ reports a required path when it is a directory instead of a file
✔ requires the exact core design tokens and a non-yellow primary button
✔ ignores commented tokens and rejects yellow primary backgrounds in CSS equivalents
✔ rejects a primary-button gradient that reaches yellow through a custom-property alias
✔ requires all eight generated course pages
✔ validates course structure, navigation, and resolved local references
✔ permits the planned Task 5 landing target to be absent while retaining its link contract
✔ rejects local targets that exist as directories, including the planned landing path
✔ does not treat a landing-target metadata error as genuine absence
ℹ tests 11
ℹ pass 11
ℹ fail 0
Static asset inventory: PASS
Course page graph: PASS
```

Exit code: `0`.

The `EPERM` regression failed before the final verifier tightening because every `lstat` error was treated as absence. After narrowing the exception to `error.code === 'ENOENT'`, the focused three-case root-target suite and the complete suite both pass.
