import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const rootDir = path.resolve(import.meta.dirname, '..');
const buildScript = path.join(rootDir, 'scripts', 'build-site.ps1');
const buildFixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'normis-build-pages-'));
fs.mkdirSync(path.join(buildFixtureRoot, 'content'), { recursive: true });
fs.copyFileSync(path.join(rootDir, 'content', 'course.md'), path.join(buildFixtureRoot, 'content', 'course.md'));
fs.copyFileSync(path.join(rootDir, 'content', 'landing.html'), path.join(buildFixtureRoot, 'content', 'landing.html'));
fs.copyFileSync(path.join(rootDir, 'content', 'письма.md'), path.join(buildFixtureRoot, 'content', 'письма.md'));
fs.copyFileSync(path.join(rootDir, 'content', 'support.html'), path.join(buildFixtureRoot, 'content', 'support.html'));
fs.mkdirSync(path.join(buildFixtureRoot, 'scripts'), { recursive: true });
const fixtureBuildScript = path.join(buildFixtureRoot, 'scripts', 'build-site.ps1');
fs.copyFileSync(buildScript, fixtureBuildScript);
// The generator emits an asset <script> tag only when the file exists, so the fixture must
// mirror assets/js for its output to be comparable with the committed pages.
fs.mkdirSync(path.join(buildFixtureRoot, "assets", "js"), { recursive: true });
for (const asset of fs.readdirSync(path.join(rootDir, "assets", "js"))) {
  fs.copyFileSync(path.join(rootDir, "assets", "js", asset), path.join(buildFixtureRoot, "assets", "js", asset));
}
test.after(() => fs.rmSync(buildFixtureRoot, { recursive: true, force: true }));
const pageNames = [
  'index.html',
  'module-1.html',
  'escapes.html',
  'module-2.html',
  'module-3.html',
  'module-4.html',
  'module-5.html',
  'beauty.html',
  'health.html',
  'module-6.html',
  'sex.html',
  'grief.html',
  'week.html',
  'finale.html',
];

test('production generator retains its original no-override interface', () => {
  const productionGeneratorBytes = fs.readFileSync(buildScript);
  const productionGenerator = productionGeneratorBytes.toString('utf8');
  assert.match(productionGenerator, /^\uFEFF?\[CmdletBinding\(\)\]\r?\nparam\(\)/u);
  assert.doesNotMatch(productionGenerator, /ProjectRootOverride/u);
  assert.equal(
    crypto.createHash('sha256').update(productionGeneratorBytes).digest('hex'),
    'c0ab60fba5008be7ddf660a5d56fdc8f8f7298e0a5f41a8bddd560648c5c53e9',
    'the production generator stays byte-for-byte at its reviewed revision (week page and letters family added)',
  );
});

function runBuild() {
  return spawnSync('powershell', [
    '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', fixtureBuildScript,
  ], { cwd: buildFixtureRoot, encoding: 'utf8' });
}

function readPage(name) {
  return fs.readFileSync(path.join(buildFixtureRoot, 'course', name), 'utf8');
}

function pageHashes() {
  return new Map(pageNames.map((name) => [
    name,
    crypto.createHash('sha256').update(readPage(name)).digest('hex'),
  ]));
}

function normalizeWhitespace(value) {
  return value.replace(/\s+/gu, ' ').trim();
}

function visibleText(value) {
  return normalizeWhitespace(value
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'"));
}

function substantiveLandingParagraphs(html) {
  const withoutCode = html
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
  return [...withoutCode.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)]
    .map((match) => visibleText(match[1]))
    .filter((paragraph) => paragraph && !/^читать в курсе →$/iu.test(paragraph));
}

function articleText(html) {
  const article = (/<article\b[^>]*>([\s\S]*?)<\/article>/i.exec(html)?.[1] ?? '')
    // Объяснения терминов живут в popover: они есть в DOM, но не в потоке чтения.
    .replace(/<span class="term-note"[\s\S]*?<\/span>/g, '');
  return normalizeWhitespace(article
    // Кнопка термина — часть предложения: её теги снимаются без пробела.
    .replace(/<\/?(?:strong|em|code|a|button)\b[^>]*>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'"));
}

function visibleWords(html) {
  const text = normalizeWhitespace(html
    .replace(/<[^>]+>/g, ' ')
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'"));
  return text.match(/[\p{L}\p{N}]+(?:[-’'][\p{L}\p{N}]+)*/gu) ?? [];
}

function sourceLineText(line) {
  if (/^\s*$|^#{1,6}\s+|^\s*((\*\s*){3,}|(-\s*){3,}|(_\s*){3,})\s*$/.test(line)) return '';
  if (/^\|(?:\s*:?-+:?\s*\|)+$/.test(line)) return '';
  return normalizeWhitespace(line
    .replace(/!\[[^\]]*\]\([^)]+\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^\s*>\s?/, '')
    .replace(/^\s*(?:[-+*]|\d+\.)\s+/, '')
    .replace(/^\||\|$/g, ' ')
    .replace(/\|/g, ' ')
    // [?Термин: объяснение] рендерится кнопкой с термином; объяснение уезжает в popover
    .replace(/\[\?([^:\]]+):\s*[^\]]+\]/gu, '$1')
    .replace(/\*\*|__|[*`]/g, ''));
}

function assertSourceOrder(html, lines, label) {
  const visible = articleText(html);
  let cursor = 0;
  for (const line of lines) {
    const expected = sourceLineText(line);
    if (!expected) continue;
    const found = visible.indexOf(expected, cursor);
    const actualAtCursor = visible.slice(cursor).trimStart().slice(0, expected.length);
    const difference = [...expected].findIndex((character, index) => character !== [...actualAtCursor][index]);
    assert.notEqual(found, -1, `${label} preserves source line after ${cursor} (first at ${visible.indexOf(expected)}, diff ${difference}): ${expected.slice(Math.max(0, difference - 30), difference + 60)} | actual: ${actualAtCursor.slice(Math.max(0, difference - 30), difference + 60)}`);
    cursor = found + expected.length;
  }
}

test('builds deterministic semantic course and landing pages', () => {
  const firstBuild = runBuild();
  assert.equal(firstBuild.status, 0, `${firstBuild.stdout}\n${firstBuild.stderr}`);
  assert.deepEqual(
    fs.readdirSync(path.join(buildFixtureRoot, 'course')).sort(),
    [...pageNames].sort(),
  );

  const landing = fs.readFileSync(path.join(buildFixtureRoot, 'index.html'), 'utf8');
  const theme = fs.readFileSync(path.join(rootDir, 'assets', 'css', 'theme.css'), 'utf8');
  assert.equal((landing.match(/<h1\b/gi) ?? []).length, 1);
  assert.match(landing, /href="course\/index\.html"/);
  assert.match(landing, /data-continue-link/);
  assert.match(landing, /data-quiz/);
  for (const asset of ['assets/css/theme.css', 'assets/css/site.css', 'assets/js/progress.js', 'assets/js/quiz.js', 'assets/js/site.js']) {
    assert.match(landing, new RegExp(asset.replaceAll('.', '\\.')));
  }
  assert.doesNotMatch(landing, /<style\b/i);
  assert.doesNotMatch(theme, /body\s*\{[^}]*min-width\s*:\s*20rem/isu);
  assert.match(theme, /html\s*\{[^}]*overflow-x\s*:\s*hidden/isu);
  const landingHeadings = [
    'Перевод с маркетингового на человеческий', 'Три части и финал. Никакого рывка.',
    'Кому курс подойдёт, а кому — нет', 'Без мелкого шрифта', 'Тест:', 'Ты уже версия Pure',
  ];
  for (let index = 1; index < landingHeadings.length; index += 1) {
    assert.ok(landing.indexOf(landingHeadings[index - 1]) < landing.indexOf(landingHeadings[index]), landingHeadings[index]);
  }
  for (const promise of ['дедлайна нет', 'мест не «осталось 3»', 'до/после не будет']) {
    assert.match(landing, new RegExp(promise, 'u'));
  }

  for (const target of ['module-1.html', 'module-2.html', 'module-3.html', 'module-4.html', 'module-5.html', 'module-6.html', 'escapes.html', 'beauty.html', 'health.html', 'sex.html', 'grief.html', 'week.html', 'finale.html']) {
    assert.match(landing, new RegExp(`href="course/${target.replace('.', '\\.')}"`));
  }

  for (const name of pageNames) {
    const html = readPage(name);
    const slug = path.basename(name, '.html');
    assert.equal((html.match(/<main\b/gi) ?? []).length, 1, `${name} main count`);
    assert.equal((html.match(/<h1\b/gi) ?? []).length, 1, `${name} h1 count`);
    assert.match(html, /<meta charset="utf-8">/i, `${name} charset`);
    assert.match(html, /class="skip-link"/, `${name} skip link`);
    assert.match(html, /class="site-nav"/, `${name} site navigation`);
    assert.match(html, /<details class="course-toc"/, `${name} native table of contents`);
    assert.match(html, /<article\b/, `${name} article`);
    assert.match(html, /class="chapter-header"/, `${name} chapter metadata`);
    assert.match(html, /class="chapter-nav"/, `${name} previous-next navigation`);
    assert.match(html, /href="\.\.\/index\.html"/, `${name} landing link`);
    assert.match(html, /href="index\.html"/, `${name} overview link`);
    assert.match(html, new RegExp(`<body[^>]*data-page-kind="course"[^>]*data-course-slug="${slug}"`, 'i'), `${name} progress identity`);
    assert.match(html, /data-progress-enhancement[^>]*hidden|hidden[^>]*data-progress-enhancement/i, `${name} hidden enhancement shell`);
    assert.match(html, /data-mark-complete/i, `${name} explicit completion control`);
    assert.match(html, /data-progress-count/i, `${name} completed-count hook`);
    assert.match(html, /data-continue-link[^>]*hidden|hidden[^>]*data-continue-link/i, `${name} hidden continue hook`);

    const ids = [...html.matchAll(/<h[1-6]\b[^>]*\bid="([^"]+)"/gi)].map((match) => match[1]);
    assert.equal(ids.length, (html.match(/<h[1-6]\b/gi) ?? []).length, `${name} all headings have IDs`);
    assert.equal(new Set(ids).size, ids.length, `${name} heading IDs are unique`);
    for (const id of ids) {
      assert.match(id, /^[a-zа-яё0-9]+(?:-[a-zа-яё0-9]+)*$/u, `${name} deterministic heading ID`);
    }

    const headingLevels = [...html.matchAll(/<h([1-6])\b/gi)].map((match) => Number(match[1]));
    assert.equal(headingLevels[0], 1, `${name} starts its heading outline at h1`);
    for (let index = 1; index < headingLevels.length; index += 1) {
      assert.ok(
        headingLevels[index] <= headingLevels[index - 1] + 1,
        `${name} does not skip heading levels: ${headingLevels.join(',')}`,
      );
    }

    const bodyHtml = /<article\b[^>]*>[\s\S]*?<header class="chapter-header">[\s\S]*?<\/header>\s*([\s\S]*?)<nav class="chapter-nav"/i.exec(html)?.[1] ?? '';
    const wordCount = visibleWords(bodyHtml).length;
    const expectedMinutes = Math.max(1, Math.ceil(wordCount / 180));
    const readingTime = /<span class="reading-time" data-word-count="(\d+)">(\d+) мин чтения<\/span>/.exec(html);
    assert.ok(readingTime, `${name} includes deterministic reading time`);
    assert.equal(Number(readingTime[1]), wordCount, `${name} visible word count`);
    assert.equal(Number(readingTime[2]), expectedMinutes, `${name} reading minutes`);
  }

  const overview = readPage('index.html');
  assert.match(overview, /<h1[^>]*>Достаточная версия себя<\/h1>/);
  assert.match(overview, /Курс о жизни без проекта по самоулучшению/);
  assert.doesNotMatch(overview, /Модуль 1 \(он же вся часть I\)/);
  assert.match(overview, /<h2 id="курс-о-жизни-без-проекта-по-самоулучшению">/);

  const moduleOne = readPage('module-1.html');
  const escapes = readPage('escapes.html');
  assert.match(moduleOne, /<p class="chapter-eyebrow">ЧАСТЬ I\. АНАТОМИЯ НЕДОСТАТОЧНОСТИ<\/p>[\s\S]*<h1/);
  assert.doesNotMatch(moduleOne, /<h[2-6][^>]*>ЧАСТЬ I\. АНАТОМИЯ НЕДОСТАТОЧНОСТИ<\/h[2-6]>/);
  assert.match(moduleOne, /<h2 id="деконструкция-мифа-кому-выгодна-лучшая-версия-тебя">/);

  const moduleTwo = readPage('module-2.html');
  assert.match(moduleTwo, /<p class="chapter-eyebrow">ЧАСТЬ II\. ПРАКТИКА ДОСТАТОЧНОСТИ<\/p>[\s\S]*<h1/);
  assert.match(moduleTwo, /<h2 id="идея">Идея<\/h2>/);

  const chartCaptions = new Map([
    ['02-minimum-payment.png', 'Минимальный платёж: иллюстративная траектория долга. Иллюстративная модель: долг 300 тыс., ставка 25% годовых, платёж — минимальные 3,5% от остатка ежемесячно.'],
    ['03-price-slicing.png', 'Дробление цены: сложите все платежи. Допущение: 24 равных ежемесячных платежа по 990; комиссии и проценты не учитываются.'],
    ['04-better-vs-enough.png', 'Два авторских способа смотреть на прогресс: «лучше» и «достаточно». Схематическая иллюстрация: шкалы условны и не являются измерением благополучия.'],
    ['05-growth-vs-plateau.png', 'Один из возможных ритмов обучения: рывки и плато. Схематическая иллюстрация: уровень навыка и сроки условны; реальная траектория не обязана быть линейной.'],
  ]);

  const moduleThree = readPage('module-3.html');
  assert.ok(moduleThree.indexOf('«лучше» — открытая шкала') < moduleThree.indexOf('Ключевая операция модуля'));
  assert.match(moduleThree, new RegExp(`<figure class="chart-figure">[\\s\\S]*04-better-vs-enough\\.png[\\s\\S]*<figcaption>${chartCaptions.get('04-better-vs-enough.png')}</figcaption>`));

  const moduleFour = readPage('module-4.html');
  assert.match(moduleFour, new RegExp(`<figure class="chart-figure">[\\s\\S]*05-growth-vs-plateau\\.png[\\s\\S]*<figcaption>${chartCaptions.get('05-growth-vs-plateau.png')}</figcaption>`));
  assert.ok(moduleFour.indexOf('</figure>') < moduleFour.indexOf('Возврат уважения к своей жизни'));

  const moduleSix = readPage('module-6.html');
  assert.match(moduleSix, /<p class="chapter-eyebrow">ЧАСТЬ III\. ЭКОНОМИКА ОБЫЧНОЙ ЖИЗНИ<\/p>[\s\S]*<h1/);
  assert.match(moduleSix, /<h2 id="тесты-как-я-обычно-поступаю-vs-как-я-бы-поступил-с-критическим-мышлением">/);
  assert.match(moduleSix, /<h3 id="как-читать-результат">/);
  assert.doesNotMatch(moduleSix, /01-housing-vs-salaries.png/u, 'PNG 01 stays replaced by its accessible textual location');
  assert.match(moduleSix, /Доступность жилья./u, 'the removed chart keeps an accessible conceptual location');
  for (const chart of [
    '02-minimum-payment.png',
    '03-price-slicing.png',
  ]) {
    assert.match(moduleSix, new RegExp(`<figure class="chart-figure">[\\s\\S]*${chart.replace('.', '\\.')}[\\s\\S]*<figcaption>${chartCaptions.get(chart)}</figcaption>`));
  }
  assert.match(moduleSix, /<ul>/);
  assert.match(moduleSix, /<ol>/);
  assert.match(moduleSix, /<strong>/);

  assert.match(escapes, /<table>/);
  assert.match(escapes, /<thead>[\s\S]*<th\b[^>]*>Вредный копинг<\/th>[\s\S]*<th\b[^>]*>Его честная функция<\/th>[\s\S]*<th\b[^>]*>Здоровая замена той же функции<\/th>[\s\S]*<\/thead>/);
  assert.match(escapes, /<tbody>[\s\S]*<td><strong>Алкоголь вечером «чтобы расслабиться»<\/strong><\/td>[\s\S]*<td><strong>«Всё нормально» \(подавление\)<\/strong><\/td>[\s\S]*<\/tbody>/);

  const sourceLines = fs.readFileSync(path.join(rootDir, 'content', 'course.md'), 'utf8').split(/\r?\n/);
  const at = (pattern) => sourceLines.findIndex((line) => pattern.test(line));
  const boundaries = {
    partOne: at(/^# ЧАСТЬ I\./), moduleOne: at(/^## Модуль 1\b/),
    escapes: at(/^# ПОБЕГИ/), beauty: at(/^# КРАСОТА И ВНЕШНОСТЬ/), health: at(/^# ЗДОРОВЬЕ:/), sex: at(/^# СЕКС\s*$/), grief: at(/^# ГОРЕ,/), partTwo: at(/^# ЧАСТЬ II\./), moduleTwo: at(/^## Модуль 2\./),
    moduleThree: at(/^## Модуль 3\./), moduleFour: at(/^## Модуль 4\./),
    moduleFive: at(/^## Модуль 5\./), partThree: at(/^# ЧАСТЬ III\./),
    moduleSix: at(/^## Модуль 6\./), week: at(/^# НЕДЕЛЯ ОБЫЧНОГО ЧЕЛОВЕКА\s*$/),
    finale: at(/^# ФИНАЛ\s*$/),
  };
  const segments = [
    ['index.html', 1, boundaries.partOne],
    ['module-1.html', boundaries.moduleOne + 1, boundaries.escapes],
    ['escapes.html', boundaries.escapes + 1, boundaries.partTwo],
    ['module-2.html', boundaries.moduleTwo + 1, boundaries.moduleThree],
    ['module-3.html', boundaries.moduleThree + 1, boundaries.moduleFour],
    ['module-4.html', boundaries.moduleFour + 1, boundaries.moduleFive],
    ['module-5.html', boundaries.moduleFive + 1, boundaries.beauty],
    ['beauty.html', boundaries.beauty + 1, boundaries.health],
    ['health.html', boundaries.health + 1, boundaries.partThree],
    ['module-6.html', boundaries.moduleSix + 1, boundaries.sex],
    ['sex.html', boundaries.sex + 1, boundaries.grief],
    ['grief.html', boundaries.grief + 1, boundaries.week],
    ['week.html', boundaries.week + 1, boundaries.finale],
    ['finale.html', boundaries.finale + 1, sourceLines.length],
  ];
  for (const [name, start, end] of segments) {
    assertSourceOrder(readPage(name), sourceLines.slice(start, end), name);
  }

  for (const name of pageNames) {
    assert.equal(
      readPage(name),
      fs.readFileSync(path.join(rootDir, 'course', name), 'utf8'),
      `course/${name} is exactly what the generator produces`,
    );
  }
  assert.equal(
    fs.readFileSync(path.join(buildFixtureRoot, 'index.html'), 'utf8'),
    fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8'),
    'index.html is exactly what the generator produces',
  );

  const firstHashes = pageHashes();
  const firstLandingHash = crypto.createHash('sha256').update(landing).digest('hex');
  const secondBuild = runBuild();
  assert.equal(secondBuild.status, 0, `${secondBuild.stdout}\n${secondBuild.stderr}`);
  assert.deepEqual(pageHashes(), firstHashes);
  assert.equal(
    crypto.createHash('sha256').update(fs.readFileSync(path.join(buildFixtureRoot, 'index.html'), 'utf8')).digest('hex'),
    firstLandingHash,
  );
});

test('heading IDs remain collision-safe and inline Markdown escapes before rendering', () => {
  const escapedScript = fixtureBuildScript.replaceAll("'", "''");
  const command = `& { . '${escapedScript}'; $script:HeadingIdCounts = @{}; $script:UsedHeadingIds = @{}; New-HeadingId 'A'; New-HeadingId 'A'; New-HeadingId 'A-2'; Convert-InlineMarkdown 'A < B & "Q" **bold** [link](file.html) \`<x>\`' }`;
  const result = spawnSync('powershell', [
    '-NoProfile', '-ExecutionPolicy', 'Bypass', '-EncodedCommand',
    Buffer.from(command, 'utf16le').toString('base64'),
  ], { cwd: buildFixtureRoot, encoding: 'utf8' });

  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.deepEqual(result.stdout.trim().split(/\r?\n/).slice(-4), [
    'a',
    'a-2',
    'a-2-2',
    'A &lt; B &amp; &quot;Q&quot; <strong>bold</strong> <a href="file.html">link</a> <code>&lt;x&gt;</code>',
  ]);
});

test('an isolated landing-template heading edit propagates to generated index.html', (t) => {
  const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'normis-landing-template-'));
  t.after(() => fs.rmSync(fixtureRoot, { recursive: true, force: true }));
  fs.mkdirSync(path.join(fixtureRoot, 'content'), { recursive: true });
  fs.copyFileSync(path.join(rootDir, 'content', 'course.md'), path.join(fixtureRoot, 'content', 'course.md'));
  fs.copyFileSync(path.join(rootDir, 'content', 'письма.md'), path.join(fixtureRoot, 'content', 'письма.md'));
  fs.copyFileSync(path.join(rootDir, 'content', 'support.html'), path.join(fixtureRoot, 'content', 'support.html'));
  const landingSource = fs.readFileSync(path.join(rootDir, 'content', 'landing.html'), 'utf8');
  const fixtureHeading = 'Проверяемый заголовок лендинга';
  fs.writeFileSync(
    path.join(fixtureRoot, 'content', 'landing.html'),
    landingSource.replace('Достаточная версия себя', fixtureHeading),
  );
  fs.mkdirSync(path.join(fixtureRoot, 'scripts'), { recursive: true });
  const isolatedBuildScript = path.join(fixtureRoot, 'scripts', 'build-site.ps1');
  fs.copyFileSync(buildScript, isolatedBuildScript);

  const result = spawnSync('powershell', [
    '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', isolatedBuildScript,
  ], { cwd: fixtureRoot, encoding: 'utf8' });

  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.match(fs.readFileSync(path.join(fixtureRoot, 'index.html'), 'utf8'), new RegExp(fixtureHeading));
});

test('landing preserves supplied paragraphs with only the two approved behavior-accuracy substitutions', () => {
  const build = runBuild();
  assert.equal(build.status, 0, `${build.stdout}\n${build.stderr}`);

  const suppliedLanding = fs.readFileSync(path.join(rootDir, 'site', 'index.html'), 'utf8');
  const suppliedParagraphs = substantiveLandingParagraphs(suppliedLanding);
  const generatedLandingText = visibleText(fs.readFileSync(path.join(buildFixtureRoot, 'index.html'), 'utf8'));
  const approvedSubstitutions = new Map([
    [
      'Каждое обещание индустрии саморазвития мы переводим обратно — в то, что оно значит на самом деле.',
      'Курс проверяли по открытым источникам, и проверка была недоброй к нему самому. Вот что от неё осталось в цифрах.',
    ],
    [
      'Часть I вскрывает механизмы, часть II строит практику, часть III разбирается с деньгами, финал возвращает домой. Каждый блок — идея, ценность, практика. Нажми, чтобы раскрыть.',
      'Четырнадцать глав в трёх частях. Порядок предложенный, а не обязательный: главы держатся друг за друга ссылками, но начать можно с той, которая задевает сегодня.',
    ],
    [
      'Полное вскрытие механизмов, производящих чувство «со мной что-то не так»: маркетинг с его сдвигающейся планкой, алгоритмы соцсетей, геймификация и гэмблинг, манипуляции стыдом, эмоциональные качели и решения на пиках, религиозные и поколенческие прошивки, родительский голос, эйджизм, долженствования, магическое мышление. И карта побегов от этого чувства — алкоголь, никотин, спорт-достигаторство, трудоголизм, удобность — с честными заменами для каждого.',
      'Кто и на чём зарабатывает, когда тебе не по себе: сдвигающаяся планка маркетинга, лента как конвейер сравнения, манипуляции стыдом, магическое мышление, религиозные и поколенческие прошивки, эйджизм. Здесь же — фальшивые успешные и мода перекладывать авторство на вселенную.',
    ],
    [
      'Учимся описывать себя фактами, а не оценками. Без «пока», «ещё не» и «всего лишь» — языка черновика, который ждёт редактуры.',
      'Увидеть себя не как черновик: описание вместо оценки и сверка с собственными ценностями, а не с чужими.',
    ],
    [
      'У «лучше» нет предела, у «достаточно» есть число. Определяем своё «enough» в сне, деньгах, общении и продуктивности — и обнаруживаем, что часть точек уже пройдена.',
      'Перевод сфер жизни из шкалы «лучше» в шкалу «хватает». У «лучше» нет предела, у «достаточно» есть число — и часть точек обычно уже пройдена.',
    ],
    [
      'Большая часть жизни — плато, а не рост, и у плато есть собственное имя: владение. Учимся уважать устойчивое «хорошо» на дистанции лет.',
      'Большая часть жизни — ровное «хорошо», а не рост. Право не расти и разница между интересом и стыдом как топливом.',
    ],
    [
      'Исключительность изолирует, обычность соединяет. Дружба живёт на общей территории слабостей: «и у меня так». Разбираем цену фасада, который любят вместо тебя.',
      'Родительский голос, ставший внутренним; гендерные роли, выданные до рождения; дружба и иллюзия выбора в бесконечном каталоге.',
    ],
    [
      'Почему квартира стала недосягаемой (спойлер: дело не в кофе навынос), как устроена кредитная кабала — минимальный платёж, дробление цены «всего 990 в месяц», обезболивание оплаты — и на какие механики психики всё это рассчитано. План выхода: опись долга, лавина или снежный ком, подушка и жизнь по своим числам, а не по чужим витринам.',
      'Почему жильё стало недосягаемым и при чём тут ты; механика кредита и выход из него; расходы, быстрые деньги, работа и призвание.',
    ],
    [
      'У проекта есть версия 2.0, у человека версия одна — Pure, и ты её уже встречал: в детстве, когда бежал по двору не для кардио и дружил не для нетворкинга. Вспоминаем беспечность как утраченный навык, а не безответственность, и собираем «Архив Pure» — доказательство того, что ценной память делает обычную жизнь, а не достижения.',
      'Финал: собрать разобранное и вернуть авторство. Версия Pure уже установлена — давно, ещё во дворе.',
    ],
    [
      'Восемь житейских ситуаций и один финальный системный вопрос. Отвечай как есть — вердикт не оценка, а карта, где припаркован твой автопилот.',
      'Десять житейских ситуаций. Отвечай как есть — вердикт — не оценка, а карта, где припаркован твой автопилот.',
    ],
  ]);

  assert.deepEqual(
    suppliedParagraphs.filter((paragraph) => approvedSubstitutions.has(paragraph)),
    [...approvedSubstitutions.keys()],
    'the supplied reference still contains exactly the six reviewed source paragraphs',
  );
  for (const paragraph of suppliedParagraphs) {
    const expected = approvedSubstitutions.get(paragraph) ?? paragraph;
    assert.ok(generatedLandingText.includes(expected), `landing preserves approved supplied paragraph: ${expected}`);
    if (approvedSubstitutions.has(paragraph)) {
      assert.equal(generatedLandingText.includes(paragraph), false, `landing removes inaccurate supplied wording: ${paragraph}`);
    }
  }
});

test('letters build from the canonical source as derived, self-consistent pages', () => {
  const build = runBuild();
  assert.equal(build.status, 0, `${build.stdout}\n${build.stderr}`);

  const lettersSource = fs.readFileSync(path.join(rootDir, 'content', 'письма.md'), 'utf8');
  const headings = [...lettersSource.matchAll(/^## Письмо (\d+)\. Тема: (.+)$/gmu)];
  assert.equal(headings.length, 6, 'the canon holds six letters');

  const readLetter = (name) => fs.readFileSync(path.join(buildFixtureRoot, 'letters', name), 'utf8');
  const files = ['index.html', ...headings.map((h) => `letter-${h[1]}.html`)];
  for (const name of files) {
    const html = readLetter(name);
    assert.equal((html.match(/<h1\b/gi) ?? []).length, 1, `${name} has exactly one h1`);
    assert.doesNotMatch(html, /\{\{[A-Z_]+\}\}/u, `${name} has no unresolved placeholder`);
    assert.doesNotMatch(html, /<style\b/i, `${name} has no inline style`);
    assert.match(html, /<html lang="ru">/u, `${name} declares its language`);
    assert.match(html, /class="skip-link"/u, `${name} keeps a skip link`);
    assert.match(html, /data-page-kind="letter"/u, `${name} is marked as a letter page`);
    assert.equal(
      html,
      fs.readFileSync(path.join(rootDir, 'letters', name), 'utf8'),
      `letters/${name} is exactly what the generator produces`,
    );
  }

  for (const [, number, title] of headings) {
    const html = readLetter(`letter-${number}.html`);
    assert.ok(html.includes(title.replace(/&/g, '&amp;')), `letter ${number} keeps its canonical subject`);
    assert.match(html, new RegExp(`Письмо ${number} из 6`), `letter ${number} numbers itself honestly`);
  }

  const index = readLetter('index.html');
  for (const [, number] of headings) {
    assert.match(index, new RegExp(`href="letter-${number}\.html"`), `index links letter ${number}`);
  }

  const lettersText = files.map(readLetter).join('\n');
  for (const forbidden of [/подпишись/iu, /введите\s+(?:ваш\s+)?e-?mail/iu, /рассылк[аи]\b(?!\s+нет)/iu, /осталось \d/iu, /успей\b/iu]) {
    assert.doesNotMatch(lettersText, forbidden, `letters avoid ${forbidden}`);
  }
  assert.doesNotMatch(lettersText, /<input\b/iu, 'letters collect nothing');
});

test('wide tables render inside a keyboard-reachable horizontal scroll region', () => {
  const build = runBuild();
  assert.equal(build.status, 0, `${build.stdout}\n${build.stderr}`);

  const moduleOne = readPage('escapes.html');
  assert.match(
    moduleOne,
    /<div class="table-scroll" tabindex="0" role="region" aria-label="[^"]+">\s*<table>/u,
    'the swap table is wrapped in a labelled, focusable scroll region',
  );
  assert.match(moduleOne, /<\/table>\s*<\/div>/u, 'the scroll region closes around the table');
  assert.equal((moduleOne.match(/<div class="table-scroll"/gu) ?? []).length, (moduleOne.match(/<table>/gu) ?? []).length,
    'every table gets exactly one scroll region');

  const css = fs.readFileSync(path.join(rootDir, 'assets', 'css', 'site.css'), 'utf8');
  assert.match(css, /\.table-scroll\s*\{[^}]*overflow-x:\s*auto/su, 'the region scrolls horizontally');
  assert.match(css, /\.table-scroll table\s*\{[^}]*min-width/su, 'the table keeps a readable minimum width');
});

test('reader pages carry the prose rhythm instead of a wall of text', () => {
  const build = runBuild();
  assert.equal(build.status, 0, `${build.stdout}\n${build.stderr}`);

  for (const name of pageNames) {
    assert.match(readPage(name), /<article class="prose">/u, `course/${name} marks its body as prose`);
  }
  const letter = fs.readFileSync(path.join(buildFixtureRoot, 'letters', 'letter-1.html'), 'utf8');
  assert.match(letter, /<article class="prose">/u, 'letter pages mark their body as prose');

  const theme = fs.readFileSync(path.join(rootDir, 'assets', 'css', 'theme.css'), 'utf8');
  const site = fs.readFileSync(path.join(rootDir, 'assets', 'css', 'site.css'), 'utf8');
  const css = `${theme}\n${site}`;

  // theme.css zeroes the block margins, so .prose is the only thing giving the reader air.
  assert.match(theme, /h1,\s*h2,\s*h3,\s*h4,\s*p,\s*ul,\s*ol,\s*figure,\s*blockquote\s*\{[^}]*margin-block:\s*0/su,
    'theme still zeroes default block margins — the prose rules below are load-bearing');
  assert.match(css, /\.prose > \* \+ \*\s*\{[^}]*margin-top/su, 'prose sets a base vertical step');
  assert.match(css, /\.prose > h2\s*\{[^}]*margin-top/su, 'section headings get their own larger step');
  assert.match(css, /\.prose > h2\s*\{[^}]*border-top/su, 'section headings are separated by a rule');
  assert.match(css, /\.prose > h2 \+ h2[^{]*\{[^}]*margin-top/su, 'consecutive headings do not collide');
  assert.match(css, /\.prose > p:has\(> strong:first-child\)\s*\{[^}]*margin-top/su, 'bold lead-ins read as sub-headings');
  assert.match(css, /\.prose\s*\{[^}]*max-width:\s*var\(--reading-max-width\)/su, 'reading measure is bounded');
});

test('the swap table is styled, not left at browser defaults', () => {
  const css = fs.readFileSync(path.join(rootDir, 'assets', 'css', 'site.css'), 'utf8');

  assert.match(css, /\.table-scroll table\s*\{[^}]*border-collapse:\s*collapse/su, 'cells share borders');
  assert.match(css, /\.table-scroll thead th\s*\{[^}]*padding:\s*var\(--spacing-16\)/su, 'header cells have real padding');
  assert.match(css, /\.table-scroll thead th\s*\{[^}]*background:\s*var\(--color-sticky-note-mint\)/su, 'the header uses the mint sticker from the design system');
  assert.match(css, /\.table-scroll thead th\s*\{[^}]*text-align:\s*left/su, 'headers are left aligned like the prose');
  assert.match(css, /\.table-scroll tbody td\s*\{[^}]*padding:\s*var\(--spacing-16\)/su, 'body cells have real padding');
  assert.match(css, /\.table-scroll tbody td\s*\{[^}]*vertical-align:\s*top/su, 'cell text starts at the top of tall rows');
  assert.match(css, /\.table-scroll tbody td\s*\{[^}]*border-top:\s*var\(--border-default\)/su, 'rows are separated');

  // The mint header is a sticker fill, never a call to action, and yellow stays a marker.
  assert.doesNotMatch(css, /\.table-scroll[^{]*\{[^}]*background:\s*var\(--color-highlighter-yellow\)/su,
    'Highlighter Yellow is not used as a table fill');
});

test('the price screen names its own price and never blocks reading', () => {
  const build = runBuild();
  assert.equal(build.status, 0, `${build.stdout}\n${build.stderr}`);

  const support = fs.readFileSync(path.join(buildFixtureRoot, 'support.html'), 'utf8');
  const landing = fs.readFileSync(path.join(buildFixtureRoot, 'index.html'), 'utf8');
  const site = fs.readFileSync(path.join(rootDir, 'assets', 'js', 'site.js'), 'utf8');

  assert.doesNotMatch(support, /\{\{[A-Z0-9_]+\}\}/u, 'the screen resolves every placeholder');
  assert.match(support, /data-page-kind="support"/u, 'the screen identifies itself');
  assert.match(support, /href="course\/index\.html"[^>]*data-support-skip/u, 'the free exit is a plain link to the course');
  assert.match(support, /Ноль — тоже сумма/u, 'zero is stated as an acceptable amount');
  // Поле суммы существует только при подключённом провайдере: иначе вести число некуда.
  const hasProvider = /data-support-pay/u.test(support);
  if (hasProvider) {
    assert.match(support, /type="number"[^>]*min="0"/u, 'the amount starts at zero');
    assert.match(support, /<form[^>]*data-support-form/u, 'the amount lives in a real form');
  } else {
    assert.doesNotMatch(support, /<input/u, 'no dead input while payment is unconfigured');
    assert.match(support, /Приём оплаты пока не подключён/u, 'the screen says so plainly');
  }

  // The reader must reach the course with scripts off: the exit is a link, not a handler.
  assert.doesNotMatch(support, /<button[^>]*data-support-skip/u, 'the exit is not a scripted button');

  // No dark patterns on the way in.
  for (const forbidden of [/осталось \d/iu, /успей/iu, /только сегодня/iu, /<input[^>]*type="email"/iu, /подпишись/iu]) {
    assert.doesNotMatch(support, forbidden, `the screen avoids ${forbidden}`);
  }

  assert.match(landing, /href="support\.html"[^>]*data-course-entry/u, 'the landing routes its CTA through the screen');
  assert.match(site, /SUPPORT_SEEN_KEY/u, 'the choice is remembered');
  assert.match(site, /data-course-entry/u, 'a returning reader goes straight to the course');
});

test('bias terms open their explanation in a native popover, with no script required', () => {
  const build = runBuild();
  assert.equal(build.status, 0, `${build.stdout}\n${build.stderr}`);

  const canon = fs.readFileSync(path.join(rootDir, 'content', 'course.md'), 'utf8');
  const declared = [...canon.matchAll(/\[\?([^:\]]+):\s*([^\]]+)\]/gu)];
  assert.ok(declared.length >= 15, 'the canon marks its thinking errors as terms');
  for (const [, term, explanation] of declared) {
    assert.ok(term.trim().length >= 4, `term is a real phrase: ${term}`);
    assert.ok(explanation.trim().length >= 40, `explanation is substantive: ${term}`);
  }

  let buttons = 0;
  for (const name of pageNames) {
    const html = readPage(name);
    assert.doesNotMatch(html, /\[\?/u, `${name} has no unrendered term syntax`);

    const ids = [...html.matchAll(/<span class="term-note" id="([^"]+)" popover role="note">/gu)].map((m) => m[1]);
    const targets = [...html.matchAll(/<button class="term"[^>]*popovertarget="([^"]+)"/gu)].map((m) => m[1]);
    buttons += targets.length;

    assert.equal(new Set(ids).size, ids.length, `${name} has unique popover ids`);
    assert.deepEqual(targets.sort(), [...ids].sort(), `${name} pairs every term with its own explanation`);
    for (const target of targets) {
      assert.match(html, new RegExp(`aria-describedby="${target}"`), `${name} links term to explanation for assistive tech`);
    }
    // Кнопка обязана быть type="button": внутри формы она иначе отправляла бы её.
    assert.equal((html.match(/<button class="term" type="button"/gu) ?? []).length, targets.length,
      `${name} declares every term button as type="button"`);
  }
  assert.ok(buttons >= 15, 'the built course carries every marked term');

  // Раскрытие не должно зависеть от JavaScript.
  const site = fs.readFileSync(path.join(rootDir, 'assets', 'js', 'site.js'), 'utf8');
  assert.doesNotMatch(site, /popover|term-note/u, 'popovers stay declarative — no script drives them');

  const css = fs.readFileSync(path.join(rootDir, 'assets', 'css', 'site.css'), 'utf8');
  assert.match(css, /@supports not selector\(:popover-open\)/u, 'browsers without popover still show the explanation');
});
