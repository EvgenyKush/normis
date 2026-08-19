# Final fixes report — local MVP

Date: 2026-08-18  
Workspace: `C:\Users\Surface\Projects\normis`  
Git: not initialized; no repository initialization was performed.

## Status

All requested final-review fixes are implemented in canonical sources, regenerated deterministically, and covered by fresh automated and focused browser evidence.

## Fixes delivered

1. **Quiz initial focus and scroll**
   - `OrdinaryQuiz.mount()` renders the introduction without calling `focus()` on first mount.
   - Explicit Start, Back/Next, reset, close/reopen, and result transitions retain their existing focus management.
   - Regression: `OrdinaryQuiz leaves initial page focus and scroll position untouched, then focuses explicit step changes`.

2. **Accessible chart caveats and assumptions**
   - The build owns a deterministic filename-to-note map for all five charts.
   - Each generated chart now has a normal visible `figcaption` containing the alt description plus its caveat/assumption.
   - Chart 01 preserves exactly: `Данные иллюстративные: типовое соотношение динамик, а не конкретная страна.`
   - Chart 02 preserves exactly: `Иллюстративная модель: долг 300 тыс., ставка 25% годовых, платёж — минимальные 3,5% от остатка ежемесячно.`
   - Charts 03–05 state their numerical or schematic assumptions explicitly.
   - Caption text is explicitly Forest Ink; live computed style was `rgb(26, 51, 0)`, 14px, opacity 1.

3. **Supplied landing-copy fidelity**
   - `content/landing.html` again carries the full supplied program descriptions, takeaways, hero promises, quiz lead, terms wording, CTA note, and footer copy from `site/index.html`, with only the two later-approved behavior-accuracy substitutions documented below.
   - The current source-template/build architecture and all placeholders are retained.
   - The build regression extracts every substantive supplied paragraph, explicitly maps the two approved substitutions, and requires every other paragraph verbatim in generated `index.html`; the three supplied promise chips are checked separately.

4. **README workflow**
   - README now identifies the real generated entry point (`index.html`), canonical inputs, supplied `site/` reference, generated outputs, exact project root, build command, full test command, verifier, and syntax workflow.
   - The obsolete instruction to open `site/index.html` as the working prototype was removed.

5. **Progress-state hardening**
   - Progress accepts exactly eight slugs: `index`, `module-1` through `module-6`, and `finale`.
   - Unknown/prototype-like stored values are removed, and invalid visit/complete calls are no-ops.
   - Both course and landing Continue maps use an own-property lookup, so inherited properties cannot become URLs.

6. **Acceptance/report accuracy**
   - `tests/manual-acceptance.md` now reports 35 tests, records the corrected fresh-mount focus result, includes chart/copy/progress evidence, distinguishes the focused post-fix recheck from the earlier full-page sweep, and leaves direct-file/keyboard/no-JavaScript limitations explicitly labeled.
   - The SDD ledger records this final fix wave and its current evidence.

## Red/green evidence

The first focused run after adding regressions reported 16 tests total, 11 passed and 5 failed. The failures were the expected missing behaviors:

- the fresh quiz mount focused its introduction `H3` instead of leaving focus untouched;
- untrusted `__proto__`, `constructor`, and `toString` progress slugs survived normalization;
- landing and course Continue URL lookups resolved prototype properties;
- the generated landing still contained rewritten promise chips, so the supplied-copy/fidelity build test failed before reaching its later chart assertions.

After source changes and a rebuild, the focused run reported 16 passed and 0 failed.

## Fresh final verification

Run from `C:\Users\Surface\Projects\normis`:

```text
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\build-site.ps1
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\build-site.ps1
Deterministic rebuild: PASS (9 generated HTML files unchanged)

node --test
tests 35
pass 35
fail 0

node scripts\verify-site.mjs
Static asset inventory: PASS
Course page graph: PASS
Progress contract: PASS
Landing and quiz contract: PASS
Offline and document policy: PASS
Local MVP verification: PASS

node --check <all assets/js/*.js, scripts/*.mjs, tests/*.mjs>
JavaScript syntax: PASS (9 files)
```

## Focused browser evidence

- Fresh 1280px landing navigation: `BODY` remained focused, `scrollY: 0`, hero top `93px`, client/scroll width `1265/1265`.
- Explicit Start: active element became the first-question `H3`; live status was `Вопрос 1 из 8.`
- 320px landing: client/scroll width `305/305`; zero visible elements exceeded the client bounds.
- 768px Modules 3, 4, and 6: client/scroll width `753/753` on each page.
- Five captions were displayed as normal blocks with non-zero height, Forest Ink `rgb(26, 51, 0)`, 14px text, and opacity 1.
- Browser diagnostics: zero warnings/errors.

## Concerns and limits

- The in-app browser still blocks a live `file://` run and does not expose reliable JavaScript-disabled or synthetic keyboard-only acceptance controls. Those cases remain `LIMITED`, with automated/static evidence only.
- The earlier fidelity-versus-accuracy concern is resolved by the two explicit reviewed substitutions: the program lede no longer promises expandable cards, and the quiz lede describes exactly eight situations.
- No deployment, server runtime, package installation, or Git operation was added.

## Follow-up — approved landing-copy accuracy substitutions

The user resolved the sole fidelity-versus-accuracy conflict without expanding product behavior. Two canonical sentences changed:

1. Program lede:
   - Supplied reference: `Часть I вскрывает механизмы, часть II строит практику, часть III разбирается с деньгами, финал возвращает домой. Каждый блок — идея, ценность, практика. Нажми, чтобы раскрыть.`
   - Approved generated copy: `Часть I вскрывает механизмы, часть II строит практику, часть III разбирается с деньгами, финал возвращает домой. Каждый блок — идея, ценность, практика.`
2. Quiz lede:
   - Supplied reference: `Восемь житейских ситуаций и один финальный системный вопрос. Отвечай как есть — вердикт не оценка, а карта, где припаркован твой автопилот.`
   - Approved generated copy: `Восемь житейских ситуаций. Отвечай как есть — вердикт не оценка, а карта, где припаркован твой автопилот.`

The new regression contains exactly those two source-to-approved mappings. It requires both inaccurate originals to be absent from generated `index.html` and every other substantive supplied paragraph to remain verbatim.

Focused red evidence before the canonical edit:

```text
node --test --test-name-pattern="landing preserves supplied paragraphs with only the two approved behavior-accuracy substitutions" tests\build-course-pages.test.mjs
tests 1
pass 0
fail 1
failure: generated landing still contained `Нажми, чтобы раскрыть.`
```

Focused green evidence after the two-line canonical edit and rebuild:

```text
tests 1
pass 1
fail 0
```

Fresh complete follow-up verification:

```text
Deterministic rebuild: PASS (9 generated HTML files unchanged)
tests 35
pass 35
fail 0
Local MVP verification: PASS
JavaScript syntax: PASS (9 files)
Approved landing substitutions: PASS
```

`task-6-report.md` is now explicitly marked as a historical record superseded by this final report, so its earlier pre-final-review no-product-failure statement cannot be read as the current acceptance result.
