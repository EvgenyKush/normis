# Task 5: применение фактологических решений и safety language

## Статус

Task 5 выполнена в разрешённых границах. Все `F-001…F-453` сверены с реестром, audit, exact anchors и integrated span patches; канонический `content/course.md` приведён к утверждённым course-ready формулировкам без повторного применения уже внесённых изменений.

Изменены только разрешённые файлы:

- `content/course.md`;
- `tests/editorial-integrity.test.mjs`;
- `docs/editorial/2026-08-18-editorial-report.md`;
- этот отчёт.

Не изменялись landing template, `assets/js/quiz.js`, production generator, CSS, generated HTML, PNG binaries, остальные tests и immutable baseline. Git не инициализировался; subagents не запускались.

### Полный учёт решений

| Статус факта | Применено | Без изменения | PNG — ожидает Task 7 | Всего |
| --- | ---: | ---: | ---: | ---: |
| `уточнено` | 141 | 0 | 2 | 143 |
| `авторское наблюдение` | 75 | 0 | 6 | 81 |
| `удалено` | 218 | 0 | 5 | 223 |
| `смягчено` | 3 | 0 | 0 | 3 |
| `подтверждено` | 0 | 2 | 1 | 3 |
| **Итого** | **437** | **2** | **14** | **453** |

- Без изменения: `F-185`, `F-405`.
- PNG pending: `F-435`, `F-436`, `F-437`, `F-438`, `F-439`, `F-440`, `F-441`, `F-442`, `F-443`, `F-449`, `F-450`, `F-451`, `F-452`, `F-453`.
- Заблокированных и иных неприменённых решений: **0**.
- `F-444…F-448` применены удалением канонической ссылки на PNG 01; сам защищённый binary не менялся.

Реестр содержит 453 последовательных F-ID; inventories — 459 P-строк (`P1: 222`, `P2: 237`, включая 20 embedded-PNG rows). Из 305 exact anchors 285 относятся к canonical Markdown и 20 к protected PNG. Все 284 изменяющих course-якоря потреблены; `A-C-501` для `F-185` остался без изменения. Тест также проверяет все 219 применённых non-deletion решений по отличительным начальным и конечным фрагментам утверждённой формулировки. Cosmetic separators `.;` и `;;` в audit: 0.

## PNG ruling и доступность

| PNG | Каноническое действие Task 5 | Binary | Связанные pending F-ID |
| --- | --- | --- | --- |
| 01 housing | Markdown reference удалён; на том же концептуальном месте вставлен доступный текст: «Доступность жилья нужно сравнивать по конкретной стране, периоду и показателю; без них числовая кривая вводит в заблуждение». | Не изменён; больше не используется каноном | нет: `F-444…F-448` применены удалением reference |
| 02 minimum payment | Сохранён conceptual location; доступная подпись раскрывает recurrence, opening-balance base, 180 месяцев, exclusions, month 80 и totals. | Не изменён | `F-435`, `F-436`, `F-441`, `F-442` |
| 03 price slicing | Сохранён conceptual location; alt/caption дают `990 × 24 = 23 760` и прямо говорят, что комиссии и проценты в иллюстрации не заданы. | Не изменён | `F-437`, `F-438` |
| 04 better/enough | Сохранён conceptual location; surrounding caption содержит exact authorial limitation, новые labels/legend и отсутствие числовых осей. | Не изменён | `F-449…F-453` |
| 05 growth/plateau | Сохранён conceptual location; surrounding caption называет схему возможной траекторией, перечисляет labels и снимает общий уровень/срок/числовые деления. | Не изменён | `F-439`, `F-440`, `F-443` |

В каноне осталось 4 image references; reference PNG 01 отсутствует. Все 14 pending rows отмечены именно как bitmap work Task 7, при этом их исправленная модель или ограничение уже доступны текстом рядом с retained image.

## High-risk red/green coverage

Inventories содержат 433 high-risk P-строки (`P1: 216`, `P2: 217`). Каждая имеет F mapping, audit row и не имеет статуса `заблокировано`. Exact-anchor consumption покрывает все меняющие исходные spans.

Отдельный risk-ordered контракт охватывает 128 medical/addiction и financial/numeric решений из диапазонов `F-029…F-110` и `F-350…F-406`: 62 scoped replacements и 66 deletions. Дополнительно зафиксированы характерные unsafe originals и обязательные safety/disclaimer phrases.

Task была возобновлена после прерванного частичного применения, поэтому исторический pre-application red output не воспроизводился откатом: это нарушило бы требование не перезапускать и не применять patches повторно. Вместо фиктивного red-лога добавлен воспроизводимый mutation contract: восемь unsafe insertions и десять removals approved wording выполняются в памяти, и guards обязаны отвергнуть все 18 вариантов.

Финальный focused run:

```powershell
node --test --test-name-pattern "Task 5 audit|every changing canonical anchor|every applied non-deletion|high-risk medical|red controls|every medical/addiction|credit calculations" tests/editorial-integrity.test.mjs
```

```text
tests 7
pass 7
fail 0
cancelled 0
skipped 0
todo 0
exit 0
```

Контракт проверяет:

- 453 audit statuses и точные pending/no-change ID;
- потребление всех 284 changing course anchors;
- mapping всех 433 high-risk inventory rows;
- наличие approved wording для всех 219 применённых non-deletion решений;
- 128 risk-ordered medical/addiction/financial/numeric решений;
- отсутствие восьми характерных unsafe originals и наличие десяти safety/numeric phrases;
- чувствительность к 18 in-memory red controls;
- точные расчёты и пять доступных conceptual locations: accessible replacement PNG 01 плюс retained PNG 02–05.

## Расчёты

Для credit-card illustration тест считает без промежуточного округления:

```text
B₀ = 300 000
r = 0,25 / 12
Jₘ = rBₘ₋₁
Mₘ = 0,035Bₘ₋₁
Bₘ = Bₘ₋₁ + Jₘ − Mₘ
```

Результат с округлением display values до двух знаков:

| Точка | Остаток | Накопленные проценты | Сумма платежей |
| --- | ---: | ---: | ---: |
| Месяц 80 | 95 807,86 | 300 282,56 | — |
| Месяц 180 | 23 001,23 | 407 351,14 | 684 349,91 |

Модель явно исключает новые покупки, комиссии, штрафы и floor payment. Второй deterministic check: `990 × 24 = 23 760`; проценты и комиссии в этой арифметической иллюстрации не заданы.

## Метрики до/после

Task 5 input берётся из финального Task 3 handoff; immutable baseline показан отдельно.

| Метрика | Frozen baseline | Task 5 input | После Task 5 |
| --- | ---: | ---: | ---: |
| parts | 3 | 3 | 3 |
| modules | 6 | 6 | 6 |
| headings | 69 | 69 | 69 |
| practices | 8 | 8 | 8 |
| quiz situations | 8 | 8 | 8 |
| finale headings | 5 | 5 | 5 |
| chart references | 5 | 5 | 4 |
| paragraphs | 323 | 359 | 320 |
| words | 23 540 | 23 637 | 16 797 |

Количество headings сохранено. Единственная heading-text difference — утверждённое удаление недоказанного «вымирающие навыки» по `F-281`: теперь `Скука и умение быть с собой`. Изменение chart references с 5 на 4 — обязательное удаление PNG 01. Поэтому baseline compare предсказуемо возвращает только `chartReferences` и `headingTexts`; остальные structural fields совпадают.

Deletion joins вычитаны после применения: repeated blank-line runs — 0, trailing whitespace — 0, `.;`/`;;` в canonical — 0, dangling `Три эффекта:` — 0.

## Protected-file hashes

Из 27 файлов Task 4 protected manifest изменились ровно два разрешённых:

| Файл | До Task 5 | После Task 5 |
| --- | --- | --- |
| `content/course.md` | `d8c4cf5cf1542dc44b835db3f9917b0f48d3bf9f33f9f06c2b735130995b2104` | `f5ef1fb23c0810bc373924f276522928dea557a5bd44885999235ac7585a51c0` |
| `tests/editorial-integrity.test.mjs` | `9fdf9a8816b20cc358882fbd44be93a6049e9089587fa2f539f9a5885b3b4716` | `e57ecef5bc794c0f34d2aa50bc4108ba0eb4dc1e93f0a883ea4c2d4a611a3a34` |

Оставшиеся 25 manifest entries побайтово неизменны (`before = after`):

| Файл | SHA-256 |
| --- | --- |
| `content/landing.html` | `3034c6b68637db8ef234bb860d49946d63c8a6fc5babdf385a7fade6fa3bd775` |
| `assets/js/quiz.js` | `b4453288cd1a3fdc14955d8d942785052f9dfcb6b62ac657e70a93d8550ea59a` |
| `scripts/build-site.ps1` | `302ed6bb5f645a890a37c24b2125f639f30659cf4e475fc69b2084f034154c93` |
| `scripts/editorial-baseline.mjs` | `143ad0b858974ee0c720c32417a4173fc1bdbe197689672ee5710eb6f233a64f` |
| `docs/editorial/baseline.json` | `f6c3243cbfbba713d3024a1be5025508d2d3aaa3ecad5ac1ba94f2f8129a3fba` |
| `index.html` | `5a2a2b7173af44fc418fe69ab9a29e6664a90691aeb79745008b52d3641c5c62` |
| `course/index.html` | `8d66bbedeea16e02a12419a0e5af7cd1e3cdf05f94a709dab8f9b5f978e3d9e4` |
| `course/module-1.html` | `d108edfe1b75b1a1a07d622b2f2e27bd2970d382d8a4e2407453b79311484655` |
| `course/module-2.html` | `38fda72994593fb402a6333869a4e8dc7151fced5be721f571882c93bda48371` |
| `course/module-3.html` | `678e0b184d4d6426bba5a0649b6c057af68e230732edf2e02d71d7931aa00751` |
| `course/module-4.html` | `298e878f51ed94ef63e2089ca56d62b79290003a6beb2c778a55f24d3f856d05` |
| `course/module-5.html` | `ac5d2ba50e1fc13a928e5d46c5d0a7dbf12b3bc0b26dfdd404370a1a8078a301` |
| `course/module-6.html` | `b7945e8b72ca7f0088129a4a1ed9464b5cdb532efbc3318c9887d4251be03e1e` |
| `course/finale.html` | `fa91d3c6c2be5ed312a5bcfa55433655715b4efd867f5baa565128f57e65cb5c` |
| `assets/charts/01-housing-vs-salaries.png` | `2e620720391ad727afd94bf31c93c80a3e162e8fb634e3240714166e5df8415f` |
| `assets/charts/02-minimum-payment.png` | `7c80b20cc36a97b0f26a84e5d8ab0092f5674fefe5347215b157eec9d53d50a1` |
| `assets/charts/03-price-slicing.png` | `7c35ace80d4d55a54ee1f90b12b7e8d237f346b5a02c2a0c067bb86c946f2550` |
| `assets/charts/04-better-vs-enough.png` | `b5efb77cfc8551c860a61192e58ede38563b93f28cfd2acdfd1fc1990c3982fe` |
| `assets/charts/05-growth-vs-plateau.png` | `ca955bf596836cfef1e8b302bddb42b210a7cbc225455ba209286c49190ecd6b` |
| `tests/build-course-pages.test.mjs` | `319dc55914b406ce0f994e597b2678c196233adfe727cca1d0e500ff8ae1ac55` |
| `tests/manual-acceptance.md` | `f5547e79ae3ab850c06101017c6d65f2d11500295387a48cb2f0ffabeadabaa4` |
| `tests/progress.test.mjs` | `1cca7b25842c5fcec761b908464fffa72993c04f8dae5769520c3efc163f94df` |
| `tests/quiz.test.mjs` | `fa8908d0394a23922937b595c2aec6479e1c2a7008418b3c405c9a145f041b98` |
| `tests/site.test.mjs` | `8379e1b4fdc6e7a8e71c8f88a0532b6db21fe1d2f7d6b846ab9aa5712591afec` |
| `tests/verify-static-assets.test.mjs` | `7464e0a83537a97aef191ee2cb628616db7920afe187f70f0197237f8b56f181` |

Дополнительный разрешённый audit artifact: `docs/editorial/2026-08-18-editorial-report.md` — SHA-256 `86c13d6ea96de587bdda5a815b09db1ca553e147b6bebaa7922c238b026535ed`.

## Команды и результаты

### Editorial integrity

```powershell
node --test tests/editorial-integrity.test.mjs
```

```text
tests 32
pass 32
fail 0
cancelled 0
skipped 0
todo 0
exit 0
```

### Полный nonmutating suite

```powershell
node --test
```

```text
tests 68
pass 66
fail 2
cancelled 0
skipped 0
todo 0
exit 1

FAIL tests/build-course-pages.test.mjs: builds deterministic semantic course and landing pages
  stale assertion expects the pre-Task-5 PNG 04 figcaption
FAIL tests/quiz.test.mjs: OrdinaryQuiz question wording exactly matches the canonical Markdown situations
  assets/js/quiz.js is intentionally untouched and still has pre-Task-5 wording

SNAPSHOT_FILES_BEFORE=80
SNAPSHOT_FILES_AFTER=80
WORKSPACE_MUTATIONS=0
```

Обе failures являются ожидаемым downstream handoff, а не неучтённым Task 5 defect. План прямо назначает quiz synchronization Task 6, а generated-page rebuild/finalization — Task 7. Изменять эти файлы в Task 5 запрещено.

### Baseline compare

```powershell
node scripts/editorial-baseline.mjs --compare docs/editorial/baseline.json --allow-text-change
```

```text
exit 1
differences: ["chartReferences", "headingTexts"]
baseline: chartReferences=5, paragraphs=323, words=23540
current:  chartReferences=4, paragraphs=320, words=16797
```

Обе structural differences авторизованы: removal PNG 01 и `F-281`.

### Site verifier

```powershell
node scripts/verify-site.mjs
```

```text
exit 1
assets/js/quiz.js: question wording differs from content/course.md
```

Это тот же ожидаемый Task 6 handoff; verifier не обнаружил иной ошибки до этой точки.

### Syntax

```powershell
node --check <каждый .js/.mjs под assets, scripts и tests>
```

```text
checked=11
failures=0
```

### Self-review

```text
course lines=893
multi_blank_runs=0
trailing_whitespace=0
canonical_.;_or_;;=0
dangling_three_effects=0
png01_references=0
retained_chart_references=4
audit_.;_or_;;=0
protected_manifest_files=27
protected_manifest_changed=2 (оба разрешены)
```

## Concerns / handoff

1. Внутренний bitmap text PNG 02–05 ещё содержит 14 старых claim-bearing элементов. Канонические captions уже доступны и исправлены; binaries должны быть отредактированы и визуально проверены в Task 7 по перечисленным F-ID.
2. Canonical quiz wording изменилось по решениям `F-*`, а `assets/js/quiz.js` запрещён для Task 5. Task 6 должна синхронизировать все 24 поля; до этого полный suite и `verify-site.mjs` закономерно красные.
3. Generated HTML намеренно не пересобирался. Один build test hard-codes старый PNG 04 caption; соответствующий consumer/test должен быть синхронизирован в разрешённой последующей задаче, затем Task 7 пересоберёт pages.
4. Immutable baseline compare остаётся non-zero только по двум утверждённым structural/text-list differences; baseline не перезаписывался.
5. Исторический red run до частичного применения не сохранился после interruption; 18 repeatable in-memory negative controls документируют чувствительность safety guards без рискованного отката канона.
