# Task 2 report — shared design system

## Changed files

- `assets/css/variables.css` — canonical color, typography, spacing, layout, and shape tokens. The three required core values are declared exactly.
- `assets/css/theme.css` — reset, system-first typography, semantic links, visible focus, reduced-motion support, buttons, highlights, cards, prose, skip link, and `.sr-only` utility.
- `assets/css/site.css` — responsive landing, navigation, reader, TOC, chapter navigation, figures, progress, and quiz layouts.
- `scripts/verify-site.mjs` — preserves the Task 1 inventory checks and additionally validates the three exact token declarations and rejects Highlighter Yellow as the `.button--primary` background.
- `tests/verify-static-assets.test.mjs` — verifies the new token and primary-button verifier contract alongside the original directory-versus-file regression test.

## Test-first evidence

After the verifier contract was added and before CSS implementation, this command exited with code 1:

```text
node scripts/verify-site.mjs
Missing: assets/css/variables.css
Missing: assets/css/theme.css
Missing: assets/css/site.css
```

The Node contract test uses a fixture with only the Forest Ink declaration and a yellow primary-button background; it asserts that Cream Paper and Highlighter Yellow token failures, plus the primary-button failure, are all reported.

## Final verification

Commands run from `C:\Users\Surface\Projects\normis`:

```text
node --check scripts/verify-site.mjs
```

Exit code: `0` (no output).

```text
node --test tests/verify-static-assets.test.mjs
```

Output:

```text
✔ reports a required path when it is a directory instead of a file
✔ requires the exact core design tokens and a non-yellow primary button
ℹ tests 2
ℹ pass 2
ℹ fail 0
```

Exit code: `0`.

```text
node scripts/verify-site.mjs
```

Output:

```text
Static asset inventory: PASS
```

Exit code: `0`.

## Self-review

- Core required CSS contracts are present: `.shell`, `.button`, `.highlight`, `.site-nav`, `.reader-layout`, `.course-toc`, `.chapter-nav`, `.quiz`, and `.sr-only`.
- Primary CTA fill is Forest Ink; yellow is reserved for editorial highlights and non-CTA accents.
- Layout grids use `minmax(0, 1fr)`, flexible widths, wrapping controls, responsive side padding, and max-width media to protect the 320px target.
- The desktop TOC becomes sticky at 768px and remains a native `<details>`-compatible pattern on smaller screens.
- No page markup exists yet (Task 3), so browser rendering with the eventual generated pages cannot be performed in this task. The CSS is intentionally class-based and does not require JavaScript.

## Round 1 remediation

The verifier now strips CSS comments, parses declarations from rule bodies, checks the exact custom-property name/value pairs, recursively resolves custom-property aliases, and detects Highlighter Yellow in hex, RGB/RGBA, HSL/HSLA, and gradient background declarations. Nested rules inside at-rules are also inspected.

`assets/css/variables.css` now contains every supplied token declaration from `design/variables.css` with its original named value intact: font families, complete type/leading/tracking scale, weights, spacing, layout, radii, shadows, and surfaces. The existing style-only aliases remain additional, non-conflicting declarations.

Regression fixtures cover a commented Forest Ink declaration, `rgb(255 233 92)`, and a `linear-gradient()` that reaches yellow through a custom-property alias.

Commands run from `C:\Users\Surface\Projects\normis`:

```text
node --check scripts/verify-site.mjs
node --test tests/verify-static-assets.test.mjs
node scripts/verify-site.mjs
```

Output:

```text
✔ reports a required path when it is a directory instead of a file
✔ requires the exact core design tokens and a non-yellow primary button
✔ ignores commented tokens and rejects yellow primary backgrounds in CSS equivalents
✔ rejects a primary-button gradient that reaches yellow through a custom-property alias
ℹ tests 4
ℹ pass 4
ℹ fail 0
Static asset inventory: PASS
```

The following reference-token comparison also exited with code `0`:

```text
Reference tokens retained: PASS
```
