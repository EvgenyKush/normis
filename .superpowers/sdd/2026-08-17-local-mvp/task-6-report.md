# Task 6 — offline, responsive, and end-to-end acceptance report

Date: 2026-08-18

> Historical Task 6 record. Superseded for final acceptance by `final-fixes-report.md`. In particular, the pre-final-review statement below that no generated product failure was found is not a current final claim; the later final-review wave corrected product behavior and content.

## Scope delivered

- Extended `scripts/verify-site.mjs` with final document policy checks for absolute local filesystem URLs, root-local references that break direct-file use, missing image `alt`, duplicate IDs, external scripts/resources, and module scripts.
- Expanded URL coverage across the explicit regression-backed surface: `src`, `href`, `action`, `formaction`, `poster`, `data`, `code`, `archive`, `background`, `cite`, `manifest`, `ping`, SVG `href`/`xlink:href`, duplicate URL attributes, every `srcset`/`imagesrcset` candidate, meta refresh, resource/navigation-capable `srcdoc`, and SVG `url(...)` presentation attributes. Any URI scheme, protocol-relative URL, root-absolute URL, Windows absolute path, or backslash URL fails unless it is an HTTPS `fonts.googleapis.com/css` or `/css2` stylesheet link.
- Added CSS policy checks for a real `prefers-reduced-motion: reduce` media query, system/generic fallback termination for every declared font stack (including resolved custom-property aliases), and external/absolute URLs in runtime CSS, inline `style` attributes, and `<style>` blocks. Google Fonts is not permitted through CSS `@import`; its sole allowance is the HTML stylesheet link.
- Added verifier regression tests covering every new rule, including commented-out reduced-motion CSS, CSS custom-property font resolution, external CSS URLs, Windows/file URLs, and the Google Fonts allowance.
- Created `tests/manual-acceptance.md` with dated environment, status, exact measurements, behavioral evidence, and browser-policy limitations.
- No generated product HTML/CSS/JS failure was found, so no product behavior or content was changed.

## Test-first evidence

The first focused run after adding the Task 6 document/CSS/resource tests failed as expected:

```text
node --test tests/verify-static-assets.test.mjs
tests 15
pass 12
fail 3

- duplicate IDs / missing alt / unsafe resources / module scripts were not rejected
- reduced-motion and font-fallback policy was not enforced
- non-Google external stylesheets were not rejected
```

After the verifier implementation, the same file reported 15 passed and 0 failed. A self-review then identified CSS `url()`/`@import` as another external-resource path. Its focused test failed first, then passed after adding the CSS reference check:

```text
node --test --test-name-pattern="requires reduced-motion CSS" tests/verify-static-assets.test.mjs
tests 1
pass 1
fail 0
```

## Fresh deterministic and automated verification

Run from `C:\Users\Surface\Projects\normis`:

```text
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/build-site.ps1
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/build-site.ps1
Deterministic rebuild: PASS (9 generated HTML files unchanged)

node scripts/verify-site.mjs
Static asset inventory: PASS
Course page graph: PASS
Progress contract: PASS
Landing and quiz contract: PASS
Offline and document policy: PASS
Local MVP verification: PASS

node --test
tests 31
pass 31
fail 0

node --check <all assets/js/*.js, scripts/*.mjs, tests/*.mjs>
JavaScript syntax: PASS (9 files)
```

## Browser acceptance evidence

The in-app browser rendered the site from an approved loopback-only static server. Every page was loaded at every target width.

| Width | Pages | Client/scroll width | Landing quiz | Horizontal overflow / out-of-bounds elements |
| --- | ---: | --- | ---: | --- |
| 320 | 9 | 305 / 305 | 289px | 0 / 0 |
| 768 | 9 | 753 / 753 | 721px | 0 / 0 |
| 1280 | 9 | 1265 / 1265 | 768px | 0 / 0 |

- The sweep covered the landing hero, quiz container, all reader navigation, every list, the longest heading (Module 6, 73 characters), and all five chart figures.
- All five chart images reported `complete: true`, non-empty alternatives, and `naturalWidth: 1440`.
- Browser resource inspection on landing and Module 6 found only same-origin project CSS, JavaScript, and PNG URLs.
- Browser console inspection returned zero warnings/errors.
- Live quiz flow checked introduction → questions 1–8 → result, disabled/enabled Next state, Back answer preservation, and focus on every step heading. Final result was the canonical `5 из 8` 3–5 interpretation.
- Live progress flow checked Module 1 completion, Module 2 completion, reload recovery (`2`, `Прочитано`, Continue `module-3.html`), and recovered landing Continue (`course/module-2.html`, the last visited chapter).

## Direct-file, keyboard, storage-failure, and no-JavaScript evidence

- Direct `file:///C:/Users/Surface/Projects/normis/index.html` navigation was blocked by the browser URL policy. Per the brief, no bypass was attempted. Structural proof found 19/19 classic relative scripts, relative local links/resources, no external runtime resource, and no module script.
- The in-app key injector focused native quiz controls but did not dispatch Tab/Enter/Space/arrow activation. The complete live quiz flow therefore used browser clicks, while automated tests and markup verification establish native labelled radios/buttons, gating, answer preservation, and focus behavior. This is a test-surface limitation, not an observed product failure.
- The browser exposes no safe storage-disable or JavaScript-disable controls. Storage-failure behavior passed focused fault-injection tests. Static no-JavaScript proof confirmed 9 pages with substantial `<main>` content (minimum 1,404 visible characters), native reader navigation on 8/8 pages, 5/5 chart descriptions, and the landing `<noscript>` quiz link.

## Runtime inventory

```text
9 HTML files
3 CSS files
3 classic JavaScript files
5 PNG chart files
0 project-root node_modules/vendor directories
```

All runtime files live inside the project. Node and PowerShell are verification/build tools only; opening the generated site requires neither.

## Self-review

- The verifier checks all nine generated HTML documents, all three runtime CSS files, and follows local targets only to regular files.
- Duplicate IDs are checked per document; empty `alt` remains valid for decorative images while a missing attribute fails.
- Ordinary external anchor `href` navigation is deliberately rejected, as are external scripts and fetched resources, because this is an autonomous offline package. The only external exception is an HTTPS `fonts.googleapis.com/css` or `/css2` `link[rel~="stylesheet"]`.
- Font-family aliases are resolved before checking their terminal fallback, avoiding a false pass on `font-family: var(--font-body)` when the referenced stack is unsafe.
- CSS comments cannot satisfy the reduced-motion check or hide an external-resource failure.
- No Git command or repository initialization was used.

## Fix round 1 — comprehensive URL-bearing attributes and embedded CSS

The review findings were verified: the original Task 6 pass inspected only `href`/`src` plus standalone CSS, so alternate HTML attributes, individual `srcset` candidates, SVG links, duplicate URL attributes, inline styles, and `<style>` blocks could evade the policy.

Regression fixtures were added first. Before implementation, the focused verifier run reported 14 passed and 3 failed; the new page-graph external-link assertion, comprehensive HTML attribute fixture, and embedded-CSS fixture all failed for the intended missing-policy reason. A later no-space `srcset` case also failed before its parser fix.

The completed verifier now:

- decodes numeric and common URL-relevant HTML entities before classification;
- preserves and checks duplicate URL attributes instead of silently keeping only the last one;
- rejects `ftp:`, `data:`, `blob:`, `file:`, `javascript:`, all other URI schemes, protocol-relative URLs, root-absolute URLs, drive-letter paths, UNC/relative backslash paths, and entity-obfuscated schemes;
- checks the complete required attribute set and each `srcset` candidate, including candidates without whitespace after commas;
- checks `url()` and `@import` in standalone CSS, inline styles, and style blocks;
- resolves font custom properties and requires a terminal system/generic fallback in standalone and embedded CSS;
- allows external content only when the element is a `link`, `rel` contains `stylesheet`, the protocol is HTTPS, the exact hostname is `fonts.googleapis.com`, and the path is `/css` or `/css2`.

Fresh fix-round verification on 2026-08-18:

```text
Deterministic rebuild: PASS (9 generated HTML files unchanged)
Local MVP verification: PASS
tests 30
pass 30
fail 0
JavaScript syntax: PASS (9 files)
```

No generated site file required remediation; the clean site passes the strengthened verifier.

## Fix round 2 — secondary HTML/CSS URL surfaces and font shorthand

The new review fixture failed before implementation because `imagesrcset`, `ping`, refresh metadata, `srcdoc`, SVG presentation attributes, and `font` shorthand were not part of the enumerated policy. The exact focused red evidence was:

```text
node --test --test-name-pattern="reviewer adversarial" tests/verify-static-assets.test.mjs
tests 1
pass 0
fail 1
first missing assertion: imagesrcset data: candidate was not rejected
```

The adversarial fixture combines:

- comma-separated `imagesrcset` with relative, `data:`, and HTTPS candidates;
- space-separated HTTPS and FTP `ping` URLs;
- an entity-encoded `iframe[srcdoc]` containing an external image;
- `meta[http-equiv="refresh"]` targeting a `blob:` URL;
- SVG `fill`, `stroke`, `filter`, `clip-path`, `mask`, and `marker-*` attributes using `data:`, protocol-relative, HTTPS, root-absolute, drive-letter, `blob:`, FTP, and `file:` URLs;
- unsafe `font` shorthand and custom `--font-*` declarations in both `<style>` and inline `style`.

The verifier now parses every `srcset`/`imagesrcset` candidate, splits `ping` URLs, checks refresh targets, conservatively rejects nonempty `srcdoc` containing resource/navigation-capable markup or URLs, scans the enumerated SVG presentation attributes through the CSS URL policy, and validates resolved font shorthand/custom declarations. Ordinary external anchors remain intentionally disallowed.

Fresh fix-round verification on 2026-08-18:

```text
Deterministic rebuild: PASS (9 generated HTML files unchanged)
Local MVP verification: PASS
tests 31
pass 31
fail 0
JavaScript syntax: PASS (9 files)
```

The manual acceptance statement now describes the exact enumerated static surfaces rather than claiming exhaustive HTML/CSS parsing.

## Concerns

- Live direct-file, JavaScript-disabled, storage-disabled, and synthetic keyboard-only runs are constrained by the in-app browser capabilities/policy. They are labeled `LIMITED` in the manual acceptance record rather than reported as complete live passes, and each is paired with the strongest available static or automated evidence.
