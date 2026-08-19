# Editorial Review and Fact-Checking Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce a fully proofread, stylistically edited, fact-checked course and landing page while preserving the project’s authorial voice, structure, anti-marketing ethics, and generated-site integrity.

**Architecture:** Canonical text is edited only in `content/course.md` and `content/landing.html`; generated HTML is rebuilt, never hand-edited. Editorial work proceeds in three layers—correction, literary editing, then evidence-based factual revision—with claim inventories and decision records feeding one consolidated editorial report. Automated structural tests guard against lost sections, drifted quiz text, broken internal links, and unintended product promises.

**Tech Stack:** UTF-8 Markdown and HTML, PowerShell deterministic generator, Node.js built-in test runner, internet research using primary/official sources, existing static-site verifier.

**Spec:** `docs/superpowers/specs/2026-08-18-editorial-review-design.md`

## Global Constraints

- `content/course.md` is the canonical course text; `content/landing.html` is the canonical landing template.
- Generated `index.html` and `course/*.html` must never be edited manually.
- Preserve all three parts, six modules, practices, eight quiz situations, finale, five chart placements, heading order, and internal-link targets.
- Preserve dry irony and the project’s anti-marketing stance; do not add urgency, scarcity, diagnoses, guaranteed transformation, or absent product behavior.
- Correct grammar, punctuation, diction, repetition, rhythm, and heavy paragraphs, but do not change a thesis, example, recommendation, or degree of certainty without recording it as a substantive edit.
- Verify psychological, medical, behavioral, social-media, gambling, generational, happiness, housing, credit, and personal-finance claims using current primary research, systematic reviews, or official sources as of 2026-08-18.
- Distinguish `подтверждено`, `уточнено`, `смягчено`, `авторское наблюдение`, and `удалено`; distinguish lack of evidence from contradictory evidence.
- General health and finance material must not be presented as diagnosis, treatment, or personalized advice.
- The eight quiz situations must remain exactly synchronized between canonical Markdown and `assets/js/quiz.js`.
- Every source used for a substantive factual decision must appear as a direct Markdown link in `docs/editorial/2026-08-18-editorial-report.md`.
- The workspace is not a Git repository; do not initialize Git or invent commit steps.

---

## File Map

- `content/course.md`: edited canonical course.
- `content/landing.html`: edited canonical landing template.
- `docs/editorial/baseline.json`: pre-edit structural and textual metrics.
- `docs/editorial/claims-part-1.md`: claim inventory for Part I.
- `docs/editorial/claims-parts-2-3.md`: claim inventory for Parts II–III, tests, and finale.
- `docs/editorial/2026-08-18-editorial-report.md`: substantive edit register, fact-check statuses, sources, uncertainty, and final metrics.
- `scripts/editorial-baseline.mjs`: deterministic metric collector and structural comparator.
- `tests/editorial-integrity.test.mjs`: structure, quiz, promises, and report-contract checks.
- `scripts/build-site.ps1`: existing generator; modified only if edited Markdown exposes a genuine parser limitation.
- `assets/js/quiz.js`: synchronized derived quiz wording.

---

### Task 1: Establish editorial baselines and report contracts

**Files:**
- Create: `scripts/editorial-baseline.mjs`
- Create: `docs/editorial/baseline.json`
- Create: `docs/editorial/2026-08-18-editorial-report.md`
- Create: `tests/editorial-integrity.test.mjs`

**Interfaces:**
- Produces: `collectEditorialMetrics(courseText, landingText): EditorialMetrics` where `EditorialMetrics` contains `parts`, `modules`, `headings`, `practices`, `quizSituations`, `finaleHeadings`, `chartReferences`, `paragraphs`, `words`, and ordered `headingTexts`.
- Produces report anchors: `# Редакторский отчёт`, `## Метод и объём`, `## Существенные литературные правки`, `## Реестр фактологических утверждений`, `## Медицинская и финансовая безопасность`, `## Источники`, `## Спорные решения и неопределённость`, `## Итоговая статистика`.

- [ ] **Step 1: Write failing baseline-contract tests**

Add Node tests that import `collectEditorialMetrics`, require exact keys, assert three parts, six module headings, eight numbered quiz situations, five chart references, and the finale headings found in the current canonical Markdown. Require all report section headings above.

- [ ] **Step 2: Run the focused test and confirm failure**

Run: `node --test tests/editorial-integrity.test.mjs`

Expected: failure because the collector, baseline, and report do not exist.

- [ ] **Step 3: Implement the deterministic metric collector**

Parse UTF-8 text without rewriting it. Count headings by Markdown syntax, identify module headings with `^## Модуль [1-6]`, quiz situations with `^\*\*[1-8]\.`, chart references with Markdown image syntax, and practices with headings or bold lead-ins beginning `Практика`. Export the function and provide a CLI that writes stable, two-space-indented JSON.

- [ ] **Step 4: Generate the immutable pre-edit baseline**

Run: `node scripts/editorial-baseline.mjs --write docs/editorial/baseline.json`

Expected: valid UTF-8 JSON containing the current counts, ordered headings, paragraph count, and word count.

- [ ] **Step 5: Create the report skeleton with explicit row schema**

In the substantive-edit table use columns `Раздел | Было | Стало | Причина`. In the fact register use `ID | Раздел | Исходный тезис | Статус | Редакторское решение | Источники`. IDs use `F-001`, `F-002`, and so on. Do not add empty placeholder rows; an empty section states that it will be populated by the applicable task.

- [ ] **Step 6: Run focused and existing suites**

Run: `node --test tests/editorial-integrity.test.mjs`

Run: `node --test`

Expected: all tests pass and the site remains unchanged.

---

### Task 2: Correct and literary-edit Part I while inventorying claims

**Files:**
- Modify: `content/course.md`
- Create: `docs/editorial/claims-part-1.md`
- Modify: `docs/editorial/2026-08-18-editorial-report.md`
- Modify: `tests/editorial-integrity.test.mjs`

**Interfaces:**
- Consumes: baseline metrics and report row schemas from Task 1.
- Produces: edited text from the beginning through the line immediately before `# ЧАСТЬ II`; claim rows `P1-001…` with fields `location`, `claim`, `risk` (`low|medium|high`), `domain`, and `search_terms`.

- [ ] **Step 1: Add Part I preservation checks before editing**

Require the Part I boundary headings, every existing Part I subheading in baseline order, all Part I practice lead-ins, and unchanged module numbering. Add checks prohibiting urgency/scarcity phrases introduced by editing.

- [ ] **Step 2: Run preservation checks on the unedited text**

Run: `node --test tests/editorial-integrity.test.mjs`

Expected: pass, establishing the pre-edit guard.

- [ ] **Step 3: Perform mechanical correction of Part I**

Read the complete Part I. Correct spelling, punctuation, agreement, government, quotation marks, dashes, numeric formatting, inconsistent terminology, and accidental repetitions. Preserve meaning and record only changes that affect meaning or tone in the report.

- [ ] **Step 4: Perform literary editing of Part I**

Shorten overloaded sentences, split unreadable paragraphs, restore logical connections, and remove non-functional repetition. Preserve dry irony, serious handling of addiction/help, all examples, and all practices. For every altered thesis, example, recommendation, or degree of certainty, add a `Было/Стало/Причина` row.

- [ ] **Step 5: Build the Part I claim inventory**

List every externally checkable psychological, medical, addiction, social-media, marketing, gambling, age, or generational claim. Quote enough source wording to locate it, assign risk and domain, and provide focused search terms. High-risk includes causal, universal, quantitative, diagnostic, treatment, or safety claims.

- [ ] **Step 6: Run structural tests and inspect the diff semantically**

Run: `node --test tests/editorial-integrity.test.mjs`

Run: `node scripts/editorial-baseline.mjs --compare docs/editorial/baseline.json --allow-text-change`

Expected: structural invariants pass; textual metrics may differ and are printed without failure.

---

### Task 3: Correct and literary-edit Parts II–III, tests, and finale while inventorying claims

**Files:**
- Modify: `content/course.md`
- Create: `docs/editorial/claims-parts-2-3.md`
- Modify: `docs/editorial/2026-08-18-editorial-report.md`
- Modify: `tests/editorial-integrity.test.mjs`

**Interfaces:**
- Consumes: the edited Part I and Task 1 report schemas.
- Produces: edited text from `# ЧАСТЬ II` through EOF; claim rows `P2-001…`; unchanged eight-situation numbering and score-band logic.

- [ ] **Step 1: Add preservation checks for Parts II–III and finale**

Require all baseline headings in order, module headings 2–6, five chart references, all practices, eight quiz situations, the three score bands `0–2`, `3–5`, `6–8`, and both finale subsections.

- [ ] **Step 2: Run the new guards before editing**

Run: `node --test tests/editorial-integrity.test.mjs`

Expected: pass.

- [ ] **Step 3: Perform mechanical correction**

Correct Parts II–III, tests, and finale using the same conventions as Task 2. Normalize repeated key terms such as `достаточно`, `плато`, `автопилот`, `критическое мышление`, `авторство`, and `версия Pure` without flattening deliberate variation.

- [ ] **Step 4: Perform literary editing**

Improve paragraph length, transitions, list parallelism, rhythm, and clarity. Preserve all exercises and the distinction between structural circumstances and personal agency. Record every substantive change in the report.

- [ ] **Step 5: Build the remaining claim inventory**

Capture claims about happiness, loneliness, relationships, habits, skill plateaus, housing affordability, salaries, credit, interest, minimum payments, spending, and financial well-being. Include chart assumptions and every numerical model. Assign risk/domain/search terms.

- [ ] **Step 6: Run structural and baseline comparison tests**

Run: `node --test tests/editorial-integrity.test.mjs`

Run: `node scripts/editorial-baseline.mjs --compare docs/editorial/baseline.json --allow-text-change`

Expected: all structural invariants pass and all textual changes are measurable.

---

### Task 4: Research and adjudicate the complete factual claim inventory

**Files:**
- Modify: `docs/editorial/claims-part-1.md`
- Modify: `docs/editorial/claims-parts-2-3.md`
- Modify: `docs/editorial/2026-08-18-editorial-report.md`

**Interfaces:**
- Consumes: claim rows from Tasks 2–3.
- Produces: fact-register rows `F-001…` with one allowed status, exact proposed wording, source links, publication year, source type, and a concise evidence note.

- [ ] **Step 1: Deduplicate and prioritize claims**

Merge overlapping claims without losing locations. Research high-risk medical, addiction, causal, and financial claims first; then medium-risk generalizations; finally low-risk contextual claims. Keep metaphors and openly subjective judgments outside the factual register unless they imply an empirical claim.

- [ ] **Step 2: Research psychological and health claims**

Search current primary/official sources. Prefer systematic reviews/meta-analyses, WHO or national public-health guidance, and peer-reviewed primary research. For each claim, record whether evidence supports association, causation, a small/heterogeneous effect, or no reliable conclusion.

- [ ] **Step 3: Research social-media, marketing, gambling, and age claims**

Use systematic reviews, regulator publications, original platform/industry evidence only when methodologically appropriate, and peer-reviewed research. Avoid deriving universal individual effects from population averages.

- [ ] **Step 4: Research happiness, relationships, loneliness, and skill claims**

Verify direction and magnitude separately. Treat popular summaries such as “money does not buy happiness” or universal plateau models as hypotheses requiring scoped wording, not slogans that automatically count as evidence.

- [ ] **Step 5: Research housing, credit, and finance claims**

Use official statistical agencies, central banks, consumer-finance regulators, and disclosed mathematical calculations. Distinguish an illustrative model from a jurisdiction-specific fact. Recalculate every displayed credit example with named rate, compounding period, payment rule, and duration.

- [ ] **Step 6: Populate the fact register and sources**

Every claim receives exactly one status: `подтверждено`, `уточнено`, `смягчено`, `авторское наблюдение`, or `удалено`. Add direct Markdown links near each decision and a deduplicated source list grouped by domain. Do not quote more than necessary; summarize evidence in original language.

- [ ] **Step 7: Audit evidence completeness**

Check that every high- and medium-risk inventory row maps to a fact-register ID and at least one suitable source or an explicit “надёжных данных недостаточно” decision. Confirm no source is a search-results URL and every link directly supports its associated decision.

---

### Task 5: Apply fact-checked revisions and safety language

**Files:**
- Modify: `content/course.md`
- Modify: `docs/editorial/2026-08-18-editorial-report.md`
- Modify: `tests/editorial-integrity.test.mjs`

**Interfaces:**
- Consumes: exact proposed wording and status for every `F-*` row.
- Produces: canonical course text whose substantive factual changes map one-to-one to report rows.

- [ ] **Step 1: Add tests for high-risk decisions**

For each medical/financial claim marked `уточнено`, `смягчено`, or `удалено`, add a focused assertion that the unsafe original wording is absent and the approved scoped wording or disclaimer is present. Assertions use distinctive phrases, not entire paragraphs.

- [ ] **Step 2: Run focused tests and confirm they fail**

Run: `node --test tests/editorial-integrity.test.mjs`

Expected: failure on the still-unapplied approved wording.

- [ ] **Step 3: Apply claims in risk order**

Apply medical/addiction changes first, then financial/numerical changes, then remaining psychological/social claims. Do not add citations inline throughout the course unless comprehension or safety requires it; report links remain the consolidated evidence layer.

- [ ] **Step 4: Recalculate and verify numeric examples**

Use a small deterministic calculation inside the Node test or verifier for each credit/payment example. Assert displayed totals within the stated rounding rule. If a graph remains illustrative, ensure surrounding prose names that limitation.

- [ ] **Step 5: Verify every applied change against the register**

Search the canonical text for each `Было` phrase where the status requires replacement. Confirm the `Стало` formulation appears in its intended location and no unrelated occurrence was replaced.

- [ ] **Step 6: Run the full editorial integrity suite**

Run: `node --test tests/editorial-integrity.test.mjs`

Expected: all high-risk wording and calculation checks pass.

---

### Task 6: Edit the landing page and synchronize the quiz

**Files:**
- Modify: `content/landing.html`
- Modify: `assets/js/quiz.js`
- Modify: `docs/editorial/2026-08-18-editorial-report.md`
- Modify: `tests/editorial-integrity.test.mjs`
- Modify: existing landing/quiz tests as required.

**Interfaces:**
- Consumes: final edited module descriptions and canonical eight situations from `content/course.md`.
- Produces: landing promises consistent with the actual product; quiz objects exactly equal the canonical course situations.

- [ ] **Step 1: Add landing truthfulness and synchronization guards**

Require no timer/deadline/scarcity/guaranteed-transformation language, no absent interaction promises, six module descriptions consistent with their canonical headings, and exact deep equality between all 24 quiz fields and the Markdown situations.

- [ ] **Step 2: Run guards before editing**

Run: `node --test tests/editorial-integrity.test.mjs tests/quiz.test.mjs tests/site.test.mjs`

Expected: current synchronization passes; any approved wording drift introduced in Task 5 fails until synchronized.

- [ ] **Step 3: Correct and literary-edit the landing template**

Apply grammar, rhythm, repetition, and clarity edits without increasing pressure or claims. Preserve the required build placeholders exactly. Record substantive copy changes and any changed product promise in the report.

- [ ] **Step 4: Synchronize quiz wording from the canonical course**

Update `assets/js/quiz.js` to match all eight edited situations exactly. Preserve in-memory behavior, scoring bands, close/reopen lifecycle, focus behavior, and native radio controls.

- [ ] **Step 5: Run focused landing and quiz tests**

Run: `node --test tests/editorial-integrity.test.mjs tests/quiz.test.mjs tests/site.test.mjs tests/build-course-pages.test.mjs`

Expected: all copy, behavior, placeholder, and fidelity contracts pass.

---

### Task 7: Rebuild, finalize the report, and perform independent editorial review

**Files:**
- Modify: generated `index.html`
- Modify: generated `course/*.html`
- Modify: `docs/editorial/2026-08-18-editorial-report.md`
- Modify: `tests/manual-acceptance.md`

**Interfaces:**
- Consumes: final canonical text, fact register, baseline metrics, existing build/verifier.
- Produces: deterministic edited local MVP and a complete, auditable editorial report.

- [ ] **Step 1: Rebuild all generated pages**

Run: `powershell -ExecutionPolicy Bypass -File scripts/build-site.ps1`

Expected: eight course pages and one landing page generated successfully.

- [ ] **Step 2: Generate final metrics and populate report statistics**

Run the metric collector without overwriting the baseline. Record before/after word and paragraph counts, number of substantive literary edits, fact-register count by status, number of sources, and number of medical/financial safety changes.

- [ ] **Step 3: Validate report completeness**

Add tests that reject empty required report sections, invalid statuses, duplicate fact IDs, claim rows without sources/explicit insufficiency, source links pointing to search pages, and substantive edit rows missing a reason.

- [ ] **Step 4: Run complete automated verification**

Run: `node --test`

Run: `node scripts/verify-site.mjs`

Run syntax checks for every `.js` and `.mjs` file under `assets`, `scripts`, and `tests`.

Expected: zero failures, `Local MVP verification: PASS`, and all syntax checks pass.

- [ ] **Step 5: Perform visual and reading smoke checks**

Inspect the landing and every course page at 320, 768, and 1280 CSS pixels using the approved browser surface or a safe local static server if direct `file://` is policy-blocked. Check long edited headings, paragraph rhythm, lists, chart captions, quiz copy, overflow, and console errors. Do not claim a live `file://` check if policy blocks it.

- [ ] **Step 6: Conduct independent editorial review**

The reviewer samples every module and reads every substantive-edit row. They verify that no meaning changed without documentation, every factual status matches its cited evidence, medical/financial wording is appropriately scoped, the voice remains recognizable, and the landing/test agree with the course. All Critical/Important findings must be fixed and re-reviewed.

- [ ] **Step 7: Update manual acceptance and final status**

Record the date, commands, browser limitations, responsive results, report-review result, and remaining uncertainties in `tests/manual-acceptance.md`. The final handoff distinguishes verified facts, editorial judgments, and unverified browser surfaces.

---

## Completion Evidence

Retain:

- the immutable pre-edit `docs/editorial/baseline.json`;
- both claim inventories;
- the complete editorial report with direct source links;
- successful full test, verifier, build, and syntax output;
- before/after metrics;
- independent editorial-review verdict and any fix-round evidence;
- an explicit list of browser or research limitations that could not be removed.
