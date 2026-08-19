# Manual acceptance — local MVP

Date: 2026-08-18  
Environment: Windows; PowerShell 7.6.4; Node v24.18.0; Codex in-app browser; loopback renderer at `http://127.0.0.1:8765/`.

## Acceptance results after the final fix wave

| Area | Status | Exact evidence |
| --- | --- | --- |
| Fresh deterministic build | PASS | Two consecutive `scripts/build-site.ps1` runs generated 8 course pages and 1 landing page; SHA-256 comparison reported `Deterministic rebuild: PASS (9 generated HTML files unchanged)`. |
| Full automated suite | PASS | `node --test` reported 35 tests, 35 passed, 0 failed. The final run includes the initial-focus, exact-slug allowlist, prototype-safe lookup, supplied-copy fidelity with two approved behavior-accuracy substitutions, and five-chart caption regressions. |
| Static/offline policy | PASS | `node scripts/verify-site.mjs` reported `Local MVP verification: PASS`. Its policy remains explicitly enumerated rather than claiming to parse every possible HTML/CSS construct. |
| JavaScript syntax | PASS | `node --check` passed for all 9 JavaScript/MJS files under `assets/js`, `scripts`, and `tests`. |
| Fresh landing focus | PASS | In the live browser at 1280 CSS px, a fresh navigation rendered the quiz introduction while leaving `BODY` focused, `scrollY` at `0`, and the hero at the top of the viewport (`heroTop: 93`). Clicking `Начать` focused the first question `H3`; the status became `Вопрос 1 из 8.` Automated coverage also proves initial mount does not call focus while reset, reopen, question, and result transitions retain focus management. |
| Supplied landing-copy fidelity | PASS | The deterministic build test extracts every substantive `<p>` from supplied `site/index.html` (excluding old link-only implementation text), maps exactly two reviewed source paragraphs to behavior-accurate replacements, and requires every other paragraph verbatim in generated `index.html`. It also requires both inaccurate originals to be absent and the three supplied promise chips verbatim. The canonical source remains `content/landing.html` with all build placeholders intact. |
| Accessible chart caveats | PASS | All five generated figures have visible textual caveats/assumptions in `figcaption`. Browser rendering on Modules 3, 4, and 6 found all captions displayed at 14px, opacity 1, Forest Ink `rgb(26, 51, 0)`. Charts 01 and 02 preserve their exact in-image illustrative disclaimers outside the PNG. |
| Progress state safety | PASS | Automated tests accept exactly `index`, `module-1` … `module-6`, and `finale`; unknown and prototype-like keys are ignored in stored, visited, and completed state. Landing and course Continue links remain hidden for `__proto__`, `constructor`, `toString`, and `module-7`. |
| Focused responsive recheck | PASS | Changed surfaces were re-rendered after the fixes: landing at 1280 CSS px had client/scroll widths `1265/1265`; landing at 320 CSS px had `305/305` and zero out-of-bounds elements; changed chart pages at 768 CSS px each had `753/753`. The earlier full 9-page sweep at 320/768/1280 remains recorded in the Task 6 report; this fix wave rechecked the surfaces whose layout changed. |
| Quiz state flow | PASS | Automated coverage completes all 8 situations, gates Next until a choice, preserves answers with Back, checks all score bands, verifies reset and close/reopen, and matches question wording exactly to `content/course.md`. The previous live full-flow acceptance remains valid; this wave specifically rechecked the corrected initial and Start focus behavior. |
| Storage unavailable/failing | PASS (automated fault injection) | `CourseProgress returns an empty state when stored data is malformed or storage throws` covers malformed/invalid state, throwing getter/read/write/remove, and confirms the public API does not expose storage failures. |
| Direct-file behavior | LIMITED — structural checks PASS | The in-app browser rejects `file:///C:/Users/Surface/Projects/normis/index.html` under its URL security policy. No bypass was attempted. The verifier and automated suite check relative classic scripts and local resources, but this environment did not perform a live `file://` load. |
| Keyboard-only quiz | LIMITED — native/automated contract PASS | Markup uses native labelled same-name radios and native buttons. Automated tests cover gating, Back, reset, close/reopen, and focus transitions. The browser surface did not provide a reliable synthetic keyboard-only completion, so that live path is not claimed. |
| No JavaScript | LIMITED — static checks PASS | With scripts inert, all generated pages retain static main content, reader navigation, and chart text. Every chart caveat is ordinary visible HTML, and landing retains its `noscript` link to the complete text version of the eight situations. The browser surface did not expose a JavaScript-disable control. |
| Console diagnostics | PASS | The post-fix landing/focus/responsive and chart-page rendering checks returned zero browser warnings or errors. |

## Browser limitation notes

- The browser security policy blocks `file://`; the loopback server was used only to render the generated static files.
- No alternative browser surface or file-policy bypass was used.
- Direct-file, live JavaScript-disabled, and live keyboard-only acceptance remain explicitly `LIMITED`; they are not promoted to full live passes by structural evidence.
- The browser preserved scroll position when a page was reloaded during the narrow-width check. The fresh-navigation focus result was therefore measured separately before any quiz interaction: `BODY`, `scrollY: 0`.

## Final automated result

```text
Deterministic rebuild: PASS (9 generated HTML files unchanged)
tests 35
pass 35
fail 0
Local MVP verification: PASS
JavaScript syntax: PASS (9 files)
```


---

# Manual acceptance — editorial merge (tasks 6–7)

Date: 2026-08-18
Environment: Windows 11; PowerShell; Node v24.18.0; Claude Code in-app browser (preview pane).

Scope of this wave: user ruling of 2026-08-18 — merge only the material missing from the canonical
course, leave the prior editorial pass untouched; then finish plan tasks 6 and 7.

## Commands run

```text
powershell -ExecutionPolicy Bypass -File scripts/build-site.ps1   → Course pages generated: 8 / Landing page generated: 1 (9 HTML files)
node --test                                                       → tests 72, pass 72, fail 0
node scripts/verify-site.mjs                                      → Local MVP verification: PASS
node --check (11 .js/.mjs files under assets, scripts, tests)      → all PASS
node scripts/editorial-baseline.mjs                                → headings 76, practices 10, finaleHeadings 7, words 19 240
```

## Acceptance results

| Area | Status | Exact evidence |
| --- | --- | --- |
| Merge completeness | PASS | Six sections merged; `every merged section is present in the canonical course exactly once` asserts one occurrence per heading, the week part between quiz and finale, and all seven day entries. |
| Merged-text editorial standard | PASS | `merged sections carry no diagnostic, guaranteeing, or urgency language` rejects симптом/диагноз/гарантирован/успей/осталось N/только сегодня/спеши, straight quotes, and trailing whitespace, and pins the scoped orthosomnia and Winnicott wordings. |
| Prior editorial pass untouched | PASS | The F-281 decision is enforced in both directions: the canonical heading stays «Скука и умение быть с собой» and the fuller external wording is asserted absent. The F-001…F-453 register is unchanged. |
| New claim inventory | PASS | `docs/editorial/claims-merged-sections.md` holds 31 sequential `M-*` rows; a guard checks id sequence, seven filled fields, known risk levels, and allowed statuses. |
| Report completeness | PASS | A guard requires six new report sections to be non-empty, ≥4 direct non-search source links, and ≥15 merge-edit rows each carrying a reason ≥20 characters. |
| Quiz synchronization | PASS | `assets/js/quiz.js` regenerated from the canonical eight situations; `node --test tests/quiz.test.mjs` reports 7/7 including exact deep equality of all 24 fields. |
| Landing truthfulness | PASS | The email-course promise («6 писем + практики», «одно письмо в неделю») is replaced with the pages the site actually serves; «Самодиагностика» → «Самопроверка»; both changes registered as approved substitutions in the supplied-copy fidelity test. |
| New week page | PASS | `course/week.html` builds as chapter 8 of 9 with 7 day entries, correct prev/next (Модуль 6 ← → Финал), and entries in course index, landing programme, progress slugs, and verifier page graph. |
| Swap-table repair | PASS | The eighth row («Всё нормально» (подавление)) was silently dropped by the table parser because its canonical line lacked a closing pipe. The pipe was restored — no cell text changed — and `course/module-1.html` now renders 9 `<tr>` (header + 8 rows). |
| Static page audit | PASS | All 10 generated pages: exactly one `<h1>`, zero heading-level skips, zero images without alt, zero unresolved `{{PLACEHOLDER}}`, zero inline `<style>`, zero broken relative links, `lang="ru"` and a skip link on every page. |
| Responsive (landing, week) | PASS at 320 / 768 / 1280 | Landing: 320 → scrollWidth 320, zero out-of-bounds elements; 768 → scrollWidth 753, no horizontal overflow. Week page: 320 → scrollWidth 320, zero out-of-bounds elements; 1280 → no overflow, main width 1249. |
| Console diagnostics | PASS | `read_console_messages` with `onlyErrors` returned no entries for the rendered pages. |
| Full-styling visual QA | LIMITED — not performed | See the limitation note below. Layout was measured, but the design system was not visually verified in this wave. |
| Per-page sweep at three widths | LIMITED — 2 of 10 pages | See the limitation note below. |

## Browser limitation notes

- The in-app preview renders these local files as `data:` snapshots. Relative assets therefore do not
  resolve: the rendered pages fell back to Times New Roman on a transparent background
  (`getComputedStyle(document.body).fontFamily` = `"Times New Roman"`). Layout measurements above are
  real, but they describe **unstyled** documents; the SayBriefly design system was **not** visually
  verified in this wave, and no claim is made that it renders correctly.
- For the same reason `fetch` of sibling pages is blocked, so the three-width sweep covers only the two
  pages that were navigated to directly (landing and the new week page). The remaining eight pages were
  checked statically instead (see the static page audit row).
- No file-policy bypass and no alternative browser surface were attempted.
- The earlier local-MVP wave's loopback-server evidence still stands for the pages it covered, but it
  predates the merge and was not re-run here.

## Remaining uncertainties

- The user ruling explicitly kept the prior editorial pass as is. That pass resolved 224 of 462 decisions
  by deletion and reduced the canonical course from 23 540 to 16 797 words before this merge; sections
  such as «Быстрая радость и медленное счастье» retain only their practice bullets. This is recorded as a
  known, accepted state — not as a defect fixed in this wave.
- `assets/charts/01-housing-vs-salaries.png` remains on disk with no canonical reference; the accessible
  textual location replaces it. Deleting the orphaned file was not part of the ruling.
- M-status claims marked «смягчено» were brought within observable bounds rather than sourced
  individually; only the four decisions requiring external evidence carry direct links.

## Final automated result

```text
Course pages generated: 8
Landing page generated: 1
tests 72
pass 72
fail 0
Local MVP verification: PASS
JavaScript syntax: PASS (11 files)
```

## Независимое ревью (2026-08-18, после разрешения на субагентов)

Запущены два независимых ревьюера. Итог: редакторское — 3 Critical, 6 Important, 5 Minor;
техническое — 2 Critical, 5 Important, 5 Minor.

| Находка | Статус |
| --- | --- |
| Ссылка «аргумент от памяти из финала» вела в финал, где этого довода нет | исправлено — переадресована на «Письмо из будущего прайма» |
| День 3 «Недели» требовал число, практика модуля 3 говорит «порог не обязательно числовой» | исправлено |
| Строка прогресса «из 8 глав» при девяти страницах | исправлено — знаменатель выводится из конфигурации страниц |
| Ничто не защищало сгенерированный HTML от ручной правки | исправлено — тест сверяет каждую страницу с выводом генератора; проверено экспериментом |
| `{{WEEK}}` не входил в обязательные плейсхолдеры верификатора | исправлено в верификаторе и в фикстуре теста |
| Малформированная строка таблицы молча съедала данные | исправлено — генератор бросает исключение; проверено на изолированной фикстуре |
| 17 расхождений с исходником не были зарегистрированы | исправлено — реестр правок дополнен до 35 строк |
| Смягчение «пользовательские инструменты» ломало посылку довода | исправлено — формулировка возвращена |
| Три замены звучали не в голосе курса | исправлено — восстановлены |
| Ссылка на раздел о поколенческой памяти утверждала больше, чем сам раздел | исправлено |
| M-006 опирался на источник только про скрининги | исправлено — claim разделён, добавлен источник по вакцинации |
| Винникотт опирался только на энциклопедическую статью | исправлено — добавлена первичная публикация 1953 года |
| `Course pages generated: 8` при девяти страницах | исправлено — выводится из конфигурации |
| Стальные метки «eight pages» в тестах | исправлено |
| Пустой сегмент страницы падал с невнятной ошибкой привязки параметра | исправлено — названа причина |
| `baseline.json` больше не описывает текущие источники | НЕ исправлено — регенерация обнулила бы доредакционную точку отсчёта, к которой привязан весь отчёт |
| SHA-константы практик — детекторы изменений, а не доказательство ревью | НЕ исправлено — оставлены вместе с явными проверками количества и содержания |
| Нестрогие отсылки «это FOMO», «магическое ценообразование радости» | НЕ исправлено — это жесты, а не ссылки |
| Генератор quiz.js использует наивное экранирование | НЕ исправлено — на текущих данных корректно (0 обратных слэшей, 0 ASCII-апострофов внутри значений), но риск прописан здесь |

### Проверенные экспериментом защиты

```text
Ручная правка course/week.html (Глава 8 из 9 → … ХАКНУТО)
  → course/week.html is exactly what the generator produces — FAIL (защита сработала)
Удаление закрывающей вертикальной черты у строки таблицы в изолированной фикстуре
  → Malformed Markdown table row (missing trailing pipe or bad shape) — сборка падает (защита сработала)
```

### Инцидент с откатом

Во время ревью рабочее дерево было отброшено к состоянию до слияния: `content/course.md`,
`content/landing.html`, `scripts/build-site.ps1`, все тесты, отчёт и реестр вернулись к
доредакционным версиям; `course/week.html` и `claims-merged-sections.md` исчезли. Причина
достоверно не установлена — ревьюеры работали в режиме «только чтение» и один из них
сообщил, что восстановил файлы, которые правил для эксперимента. Работа восстановлена
детерминированным повтором сохранённых патч-скриптов. После восстановления сборка,
72 теста, верификатор и проверки синтаксиса проходят, обе защиты выше подтверждены
на живых примерах.

## Визуальная проверка через локальный сервер (2026-08-18)

Статика отдавалась с `http://127.0.0.1:8765`, поэтому относительные CSS и JS резолвились и
страницы рендерились в реальном оформлении. Это снимает пометку LIMITED, стоявшую выше:
предыдущая попытка мерила недостилизованные `data:`-снимки.

| Проверка | Результат |
| --- | --- |
| CSS действительно загружается | `getComputedStyle(body).fontFamily` = `Inter`, канвас `rgb(252, 250, 245)`, текст `rgb(26, 51, 0)`; токены `--color-forest-ink/cream-paper/highlighter-yellow` разрешаются |
| Дисплейные заголовки | `h1` — Bricolage Grotesque 800, 89.6px, tracking 3.136px (≈ +0.035em); ни одного элемента с Bricolage мельче 40px ни на одной странице |
| Highlighter Yellow не используется как заливка CTA | 0 кнопок с фоном `rgb(255, 233, 92)` на всех 13 проверенных страницах; маркер-выделение — жёлтый фон с чернильным текстом |
| CTA | Forest Ink заливка, кремовый текст, радиус 6px, лейбл «→ Открыть курс» |
| Пастельные стикеры | 3 штуки на лендинге, ни одной пары подряд; на страницах курса и писем — 0 |
| Переполнение по горизонтали | 13 страниц × 320/768/1280 CSS px: ни одного переполнения, ни одного элемента за границей вьюпорта |
| Контраст | Forest Ink на Cream 13.27:1; Forest Ink на Highlighter Yellow 11.24:1 — оба выше AA с запасом |
| Визард теста с клавиатуры | Пройдены все 8 шагов: нативные радио, сгруппированные по имени, «Дальше» заблокирована до выбора, фокус на каждом шаге уходит на заголовок вопроса, в конце — на «Результат проверки»; статус объявляется «Вопрос N из 8» → «Проверка завершена»; результат посчитан («Обнаружено автопилотов: 4 из 8») с верной полосой |
| Закрытие и возврат теста | «Закрыть тест» → «Вернуться к тесту» → «Начать» работают, ответы сохраняются в пределах вкладки |
| `prefers-reduced-motion` | Правило присутствует в таблице стилей |
| Ошибки консоли | Нет |

### Найдено и исправлено в этой проверке

**Таблица карты замен не имела горизонтальной прокрутки.** На 320px три колонки прозы
сжимались до 46 / 66 / 169 px при высоте строки 299px — с `overflow-wrap: anywhere` слова
ломались посреди слога. Требование «мобильный скролл» из ТЗ было не реализовано: таблица
лежала прямо в `<article>` с `overflow-x: visible`, отдельных правил для таблиц в CSS не было.

Исправлено: генератор оборачивает каждую таблицу в
`<div class="table-scroll" tabindex="0" role="region" aria-label="…">`, в `site.css` добавлены
`overflow-x: auto`, минимальная ширина таблицы 34rem, чернильная рамка 12px и собственный
focus-visible. После правки на 320px: регион прокручивается, ячейки 79 / 120 / 337 px, высота
строки 164px вместо 299px, страница по-прежнему не переполняется. Добавлен регрессионный тест.

### Обоснованное отклонение от ТЗ

PROMPT-CODEX требует «focus-visible (жёлтый outline)». Фактически реализован
`:focus-visible { outline: 3px solid var(--color-terracotta) }`. Отклонение оставлено намеренно:
Highlighter Yellow на Cream Paper даёт контраст **1.18:1** — фокус был бы практически невидим,
тогда как Terracotta даёт **4.14:1** и проходит требование 3:1 для нетекстовых индикаторов.
Менять на жёлтый означало бы ухудшить доступность ради буквы ТЗ.

### Что по-прежнему не проверено

Скриншоты в этом окружении недоступны — панель браузера не композитит кадры, все попытки
`screenshot` истекают по таймауту. Поэтому проверено всё, что измеримо программно (цвета,
шрифты, размеры, переполнение, фокус, поведение визарда), но **эстетическая оценка вёрстки
человеком не выполнена**: как страницы выглядят на глаз, никто не смотрел.

## Типографика читалки (2026-08-18)

Заказчик сообщил, что внутри курса текст «нагромождён, почти без расстояний между разделами».
Проверка через локальный сервер подтвердила и объяснила причину.

**Причина.** `theme.css` обнуляет блочные отступы (`h1, h2, h3, h4, p, ul, ol, figure, blockquote
{ margin-block: 0 }`), а компенсирующий их класс `.prose` — с ограниченной мерой строки,
`line-height: 1.65` и шагом `> * + * { margin-top: 24px }` — в теме существовал, но генератор
его никогда не выставлял: страницы выходили с голым `<article>`. В результате 188 абзацев и
29 заголовков модуля 1 шли сплошняком, без единого отступа и без ограничения длины строки.

**Что сделано.**

| Правка | Результат |
| --- | --- |
| Генератор выдаёт `<article class="prose">` на страницах курса и писем | Мера строки ограничена 720px (≈80 знаков), интерлиньяж 1.65 |
| Заголовок раздела: отступ 64px + 24px подложки + верхняя линейка | Разрыв перед разделом 88px против 0 до правки |
| Первый блок после заголовка: 16px | Заголовок читается со своим текстом, а не висит отдельно |
| Абзацы с жирным зачином (`**Механика вреда…**`) — 32px | В модуле 1 их 149 против 39 обычных абзацев: именно они несут иерархию внутри длинных разделов, и теперь это видно |
| Обычный абзац — 24px, пункт списка — 12px | Ступенчатый ритм 88 / 32 / 24 / 12 вместо ровного нуля |
| Два заголовка подряд — 32px | Пустые разделы (последствие фактчекинга) больше не слипаются |
| Цитаты, фигуры и таблицы получили свои отступы | Блоки отделены от прозы |

**Замер после правки** (модуль 1, модуль 3, «Неделя», финал, письмо 1 — на 375 и 1280 px):
заголовок 88px, жирный зачин 32px, абзац 24px, мера 344 / 720px, переполнения нет ни на одной
странице. Добавлен регрессионный тест: он падает, если генератор перестанет выдавать `.prose`
или если из CSS пропадёт любое из правил ритма.

**Ограничение прежнее:** скриншоты недоступны, поэтому проверены расстояния и меры, а не
внешний вид. Оценка «стало читаемо» здесь измерена в пикселях, а не увидена глазами.

## Таблица карты замен (2026-08-18)

Заказчик сообщил, что таблица в модуле 1 оформлена плохо. Замер подтвердил: таблица шла
браузерным дефолтом — **никаких стилей для `table`, `th` и `td` в проекте не существовало**.

**Что было измерено до правки:** `padding: 1px` на ячейках (текст соприкасался с текстом
соседней колонки), `border: 0` на всех ячейках (строки ничем не разделены), шапка по центру
без заливки, `vertical-align: middle` при высоте строки 150px — короткая первая колонка
болталась по центру относительно длинной третьей, `border-collapse: separate`.

**Что сделано:**

| Правка | Значение |
| --- | --- |
| `border-collapse: collapse` | Ячейки делят границы вместо двойных линий |
| Отступ ячеек | 16px на десктопе, 12px на мобильном (было 1px) |
| Шапка | Заливка Sticky Note Mint `#d5f5c2`, Roboto Mono, uppercase, по левому краю — микролейбл дизайн-системы вместо жирного центрированного текста |
| Разделители строк | 1px Pencil Gray между строками, у первой строки убран |
| Выравнивание | `vertical-align: top` — текст начинается сверху, а не плавает по центру |
| Первая колонка | 22% ширины, минимум 9rem, лёгкая мятная подложка: это подпись строки, а не равноправная колонка |
| Средняя колонка | 30% — функция копинга второстепенна по отношению к замене |

**Замер после правки:** на 1280px строки 105–201px, колонки 158 / 215 / 345, таблица вписывается
без прокрутки; на 375px колонки 144 / 163 / 237, регион прокручивается по горизонтали, страница
не переполняется. Шапка мятная, разделители на месте, выравнивание по верху.

Добавлен тест, проверяющий каждое правило и отдельно то, что Highlighter Yellow не используется
как заливка таблицы (по дизайн-системе жёлтый — только маркер).

## Страница «Побеги» и экран цены (2026-08-18)

### Вынос побегов

| Проверка | Результат |
| --- | --- |
| Состав | Девять разделов перенесены целиком; текст разделов не редактировался |
| Объёмы | Модуль 1: 12 648 → 8 378 слов; «Побеги»: 4 582 слова — вторая по величине страница курса |
| Нумерация | Не тронута: 38 внутренних ссылок на номера модулей и 12 на лендинге остались валидными |
| Надзаголовок | Страница получает «ЧАСТЬ I. АНАТОМИЯ НЕДОСТАТОЧНОСТИ» — она внутри части I, а не после неё |
| Навигация | Глава 3 из 10; назад — Модуль 1, дальше — Модуль 2; запись в оглавлении, в прогрессе, в графе верификатора |
| Осиротевшие практики | Шесть блоков «Дополнение к практике недели» получили основу — собственную «Практику недели» страницы |
| Карта замен | Переехала вместе с разделами; тесты на таблицу перенацелены с `module-1.html` на `escapes.html` |
| Сборка | 10 страниц курса, 7 писем, экран цены, лендинг — 18 HTML, все выводятся генератором |

### Экран цены

| Проверка | Результат |
| --- | --- |
| Пропускаемость | Выход — обычный `<a href="course/index.html">`, работает с выключенным JavaScript |
| Минимум | Поле `type="number" min="0"`, на странице прямо сказано «Ноль — тоже сумма» |
| Навязчивость | Выбор запоминается в `localStorage`, лендинг после этого ведёт прямо в курс |
| Тёмные паттерны | Ни таймеров, ни «осталось N», ни поля почты, ни обещаний, что оплата что-то открывает |
| Приём оплаты | Не подключён; страница сообщает об этом, кнопки нет. Включается переменной `$script:PaymentLink` |
| Адаптив | 320 / 375 / 768 / 1280 px — переполнения нет; на 320 px карточка 288 px, поле ввода 234 px |

**Честное ограничение, записанное отдельно:** статический сайт не может принудить к оплате —
HTML уже отдан браузеру, и клиентский гейт обходится прямой ссылкой на страницу курса. Поэтому
замка нет и он не имитируется. Жёсткий пейвол потребовал бы бэкенда и переписывания канона.

### Итог прогона

```text
Letter pages generated: 7
Support page generated: 1
Course pages generated: 9
Landing page generated: 1
tests 79
pass 79
fail 0
Local MVP verification: PASS
```

## Структурный аудит (2026-08-18)

Два независимых аудита — читательской архитектуры и информационной — плюс собственный
количественный срез. Ниже: что исправлено сразу и что вынесено на решение заказчика.

### Исправлено

| Находка | Что было | Что сделано |
| --- | --- | --- |
| «Три направления обстрела» | Заголовок обещал три, буллита было два: у «Другие должны» потерялся маркер, и текст читался как продолжение «Я должен». На отсутствующий буллит опирались практика раздела и его вывод | Буллит восстановлен |
| Взаимная пара ссылок | Вынос «Побегов» развернул пару: модуль 1 говорил «мы уже видели удобного человека» (он теперь дальше), «Побеги» — «вернёмся к долженствованиям» (они уже прочитаны) | Обе фразы переписаны по фактическому порядку чтения |
| Практика копингов | Блок «Собрать аптечку из трёх / Одна замена по карте» и дисклеймер про копинг лежали внутри «Справедливости нет» — за 290 строк до материала, ссылаясь на «полки» и «карту замен», которых читатель ещё не видел. При этом «Чем регулировать» и «Карта замен» не имели практики вовсе | Блок перенесён к «Карте замен» |
| Практика геймификации | Два буллита про стрики, кольца и уровни были приписаны гэмблингу; у геймификации практики не было | Буллиты возвращены геймификации, гэмблингу оставлен свой |
| Два пустых «Почему это ценно» | Заголовки-обещания без единого слова под ними (остаток решения F-006, удалившего единственное утверждение раздела) | Заголовки сняты; в тестах заведён реестр «удалённых локаций», который требует, чтобы они не возвращались |
| Дословные дубли | Одно предложение дважды в «Манифестации» (через три строки) и оговорка модуля 2 в «Идее» и в практике | Оставлено по одному вхождению |
| «Мы встречали в религиозном слое» | Отсылка назад к разделу, который идёт на 51 строку позже | Переписана как проспективная |
| Модуль 1 претендовал на «удобность» | Раздел уехал на «Побеги» | Формулировка расширена до «механизмы курса» |
| Лендинг: число глав | Страниц четырнадцать; каждая пишет «Глава N из 14» | «14 глав» |
| Лендинг: «глава — минут на пятнадцать» | Реальный разброс 3–45 минут: модуль 1 — 45, модуль 3 — 3 | «Главы разного роста: от трёх минут до сорока пяти» |
| Карточка модуля 1 на лендинге | Продолжала обещать побеги, которые вынесены на свою страницу | Обещание снято |
| Экран цены | Поле суммы существовало и без подключённого провайдера — число вводить некуда | Поле появляется только вместе с провайдером; без него честная строка о том, что приём не подключён |
| Экран цены: ссылка в шапке | Обходила флаг «экран показан», из-за чего экран возвращался вопреки собственному обещанию | Ссылка помечена как выход |
| Финал | Кнопка «продолжить чтение» отправляла выпускника во введение | Ключ снят; верификатор теперь требует, чтобы финал был терминальным |
| Письма | В шапке не было ссылки на экран цены — медленный маршрут его не видел | Ссылка добавлена |

### Вынесено на решение заказчика

Требуют нового текста или крупных перестановок, поэтому не сделаны в одиночку:

1. **Каталог ошибок мышления.** Введение модуля 1 обещает разбирать «ошибку выжившего, ошибку подтверждения, катастрофизацию», на «ошибку выжившего» ссылаются трижды (включая ответ в тесте на лендинге), но раздела нет ни одного. Нужен новый раздел ~400 слов.
2. **«Быстрая радость и медленное счастье».** Заголовок и практика есть, тела нет: практика просит различать «два контура», не описанные нигде. Это фундамент, на котором стоит «достаточно с числом» в модуле 3.
3. **«Фундаментальная полка» копингов.** Практика просит «по одной стратегии с каждой полки — быстрой, средней и фундаментальной», в разделе полки две. На третью ссылаются трижды.
4. **Порядок модуля 1.** Девятнадцать равновеликих разделов, три перемешанных семейства тем (кто продаёт / что уже внутри / как ошибается мозг), ключевые техники «Чей это голос?» и «А что будет?» введены внутри раздела о пользе, хотя дальше на них ссылаются девять раз.
5. **Результат теста ведёт в никуда.** Каждая из восьми ситуаций в каноне помечена номерами модулей, генератор эту пометку отбрасывает, и экран результата не даёт ни одной ссылки. Плюс ветка 0–2 отправляет в модуль 2 за «честной выборкой», которой там нет.
6. **Редакторский остаток в ответах теста.** Три «критических» ответа на лендинге содержат следы правки: «доля „лучшие 5%“ не измерена **и удаляется**», «FTC не устанавливает типичные числа», «его эффект отдельно не проверен» — это подано как внутренний монолог читателя.
7. **«Достаточно хороший родитель»** — самостоятельная тема в статусе довеска после практики модуля 5; кандидат в отдельную страницу уровня «Побегов».
8. **Блок «Тесты»** физически лежит в конце модуля 6: тест на весь курс живёт в главе про кредиты, без своей страницы и без номера главы.
9. **Письма и курс расходятся.** Модули 2 и 5 не покрыты ни одним письмом; при этом объяснение «двух контуров» и разбор «лавина против снежного кома» существуют только в письмах — то есть медленный маршрут местами единственный.
10. **«Навигатор по боли»** обещан в README и в ТЗ, в курсе его нет: он был в полном внешнем исходнике и не дошёл до канона.

## Ошибки мышления: инвентаризация и распределение (2026-08-18)

Сканирование канона на 22 известных искажения. Первый прогон дал ложную картину: `\w` в
JavaScript не покрывает кириллицу, поэтому «магическое мышление» и другие термины
показывались как отсутствующие. После замены на явные кириллические классы картина такая.

### Было названо, но нигде не объяснено

| Термин | Употреблений до правки | Где определён теперь |
| --- | ---: | --- |
| Ошибка выжившего | 4 (магическое мышление, эйджизм, тест на лендинге, обещание модуля 1) | «Механика соцсетей» — там, где механизм физически работает: лента показывает долетевших |
| Ошибка подтверждения | 1 (только в обещании) | Модуль 2, при упражнении «Контр-подтверждение», которое против неё и направлено |
| Эффект прожектора | 1 (употреблён и тут же противопоставлен манипуляции) | «Манипуляции стыдом» |
| Иллюзия контроля | 2 (вскользь) | «Магическое мышление» |

### Уже были определены на месте — не трогал

Катастрофизация и чтение мыслей (в «Эмоциональных качелях»), чёрно-белое мышление, магическое
мышление, вера в справедливый мир, FOMO, гедонистическая адаптация, эффект невозвратных затрат,
самосбывающийся прогноз, ретроспективная оценка прошлых решений (в «Амнистии») — у каждого либо
свой раздел, либо определение в том абзаце, где термин впервые нужен.

### Связки, добавленные по теме абзацев

- Обещание модуля 1 («все искажения, которые разбирает этот курс») теперь называет адреса, а не перечисляет термины в пустоту.
- Отсылки в «Магическом мышлении» и «Эйджизме» опираются на определение, а не заменяют его.
- Модуль 6, криптоспекуляция: «истории проигравших вне кадра» названы ошибкой выжившего явно.
- «Прогревы и гивы»: добавлен абзац о кейсах выпускников как о выборке дошедших.

### Не найдено в курсе вовсе

Эффект якоря, эффект недавности, эффект ореола, эвристика доступности, ошибка планирования,
стереотипная угроза, иллюзия прозрачности. Механика якоря фактически описана в модуле 6
(дробление цены, «всего 990 в месяц»), но термин не введён — это кандидат на будущее дополнение,
а не пробел в связности: раздел работает и без имени.

Определения внесены в реестр как `M-054…M-058`.

## Термины с раскрывающимся объяснением (2026-08-18)

Объяснения 17 ошибок мышления убраны из потока чтения в раскрывающиеся окна. Во фразе остаётся
термин и мысль абзаца, определение механизма открывается по нажатию.

### Как сделано

Синтаксис канона: `[?Термин: объяснение]`. Генератор превращает его в нативный `popover` —
`<button class="term" type="button" popovertarget="term-N" aria-describedby="term-N">` плюс
`<span class="term-note" id="term-N" popover role="note">`. **JavaScript не участвует:**
открытие, закрытие по Escape, закрытие по клику вне окна и работа с клавиатуры — поведение
браузера. Тест отдельно проверяет, что `site.js` не содержит ни `popover`, ни `term-note`.

### Проверено в браузере

| Проверка | Результат |
| --- | --- |
| Поддержка popover | `HTMLElement.prototype.showPopover` присутствует |
| Состояние по умолчанию | 11 окон на модуле 1, видимых нет |
| Нажатие | окно открывается, повторное нажатие закрывает |
| Клавиатура | кнопка в порядке обхода, фокусируется, активируется |
| Связь для скринридера | `aria-describedby` указывает на id окна на всех страницах |
| Термин в потоке текста | наследует `line-height` абзаца, стоит внутри `<p>` |
| Ширина окна | 288 px при вьюпорте 320, 512 px при 768 и 1280 — вписывается, страница не переполняется |
| Оформление | жёлтая подложка маркера, терракотовое пунктирное подчёркивание, курсор `help` |

**Что проверить не удалось:** закрытие по настоящему Escape. Синтетическое событие клавиатуры
не запускает нативное light-dismiss, а живого нажатия в этом окружении нет. Поведение
стандартное для `popover`, но здесь оно не подтверждено — только заявлено.

### Деградация без popover

Если браузер атрибут не знает, `@supports not selector(:popover-open)` показывает объяснение
блоком под абзацем: читатель получает сноску вместо окна и ничего не теряет.

### Правки проверок

Разметка термина разрезала фразу, закреплённую фактчекингом (F-131), и тест это поймал. Вместо
ослабления проверки добавлен нормализатор: guard сверяет прозу без разметки, `articleText`
исключает содержимое окон из потока чтения, а теги кнопки снимаются без пробела.
