# Task 4 — resilient reading progress report

## Scope delivered

- Created `assets/js/progress.js`, exposing `window.CourseProgress.read`, `visit`, `complete`, and `clear`.
- Uses only `ordinary-self-progress-v1`. Every localStorage getter, read, write, and removal path is contained by `try/catch` so storage cannot prevent reading.
- Validates parsed state (`lastSlug` is a string or null; `completed` is an array of strings), treats invalid or malformed data as empty state, and de-duplicates completion entries.
- Created `assets/js/site.js` to visit course pages, reveal enhancement-only controls after initialization, mark a chapter complete explicitly, refresh completion text/count, and set Continue from its fixed eight-entry relative URL map.
- Updated `scripts/build-site.ps1` to generate the two scripts, course identity data attributes, and hidden-by-default progress controls on all eight course pages.
- Extended `scripts/verify-site.mjs` and automated tests for the progress API, guarded storage, map, identity attributes, and generated hooks.

## TDD evidence

The initial red run was:

```text
node --test tests/progress.test.mjs
fail 3
- CourseProgress read method was undefined
- malformed-storage recovery returned undefined
- generated pages lacked data-page-kind/data-course-slug
```

The verifier-contract red run was:

```text
node --test tests/verify-static-assets.test.mjs
fail 1
- missing CourseProgress method contract checks
```

## Final verification evidence

Run from the project root on 2026-08-17:

```text
node --test
tests 14
pass 14
fail 0

powershell -NoProfile -ExecutionPolicy Bypass -File scripts/build-site.ps1
Course pages generated: 8

node scripts/verify-site.mjs
Static asset inventory: PASS
Course page graph: PASS
Progress contract: PASS
```

The complete suite was run twice consecutively after the final change; both runs reported 14 passing tests and 0 failures. The progress-specific tests cover normal visit/completion persistence, de-duplication, clear, malformed JSON, structurally invalid JSON, throwing storage methods, and a throwing `localStorage` getter. Generated-page coverage checks all eight correct slugs and hidden enhancement hooks.

## Self-review

- No progress behavior is required for reading or navigation: all content and chapter links remain native HTML.
- The generator uses `index`, `module-1` through `module-6`, and `finale` consistently for page attributes and the Continue map.
- The Continue URLs are relative to `course/`; the finale returns to `course/index.html`.
- `clear()` removes only the course progress key.
- Storage exceptions do not propagate from any public API method or site initialization.
- No Git commands or repository initialization were used.
- A final parallel-test run revealed two test files rebuilding the same `course/` directory simultaneously. The progress-hook assertions were moved into the existing generator test, leaving only one test writer; two consecutive full-suite runs then passed.

## Concerns

None found within Task 4 scope. Browser-width, keyboard-only, and JavaScript-disabled manual acceptance remains Task 6 work.
