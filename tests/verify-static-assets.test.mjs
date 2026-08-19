import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { verifyStaticAssets } from '../scripts/verify-site.mjs';

const requiredCoursePages = [
  'course/index.html',
  'course/module-1.html',
  'course/module-2.html',
  'course/module-3.html',
  'course/module-4.html',
  'course/module-5.html',
  'course/module-6.html',
  'course/finale.html',
];

function createCompleteFixture(prefix) {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  const files = [
    'content/course.md', 'content/landing.html', 'design/DESIGN.md', 'design/tokens.json',
    'assets/charts/01-housing-vs-salaries.png', 'assets/charts/02-minimum-payment.png',
    'assets/charts/03-price-slicing.png', 'assets/charts/04-better-vs-enough.png',
    'assets/charts/05-growth-vs-plateau.png', 'assets/css/site.css', 'index.html',
  ];

  for (const relativePath of files) {
    const target = path.join(rootDir, relativePath);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, 'fixture');
  }

  fs.writeFileSync(path.join(rootDir, 'assets/css/variables.css'), `
    :root {
      --color-forest-ink: #1a3300;
      --color-cream-paper: #fcfaf5;
      --color-highlighter-yellow: #ffe95c;
    }
  `);
  fs.writeFileSync(path.join(rootDir, 'assets/css/theme.css'), '.button--primary { background: #1a3300; }');
  fs.writeFileSync(path.join(rootDir, 'content', 'landing.html'), `
    {{THEME_CSS}} {{SITE_CSS}} {{PROGRESS_JS}} {{QUIZ_JS}} {{SITE_JS}}
    {{COURSE_INDEX}} {{MODULE_1}} {{MODULE_2}} {{MODULE_3}} {{MODULE_4}}
    {{MODULE_5}} {{MODULE_6}} {{ESCAPES}} {{BEAUTY}} {{HEALTH}} {{SEX}} {{WEEK}} {{GRIEF}} {{FINALE}} {{LETTERS}} {{QUIZ_TEXT}} {{CONTINUE_LINK}} {{QUIZ_ROOT}}
  `);

  const validPage = `<!doctype html><html lang="ru"><head><meta charset="utf-8"></head><body>
    <nav><a href="../index.html">Главная</a><a href="index.html">Содержание</a></nav>
    <main><h1>Глава</h1><span class="reading-time" data-word-count="1">1 мин чтения</span></main>
  </body></html>`;
  for (const relativePath of requiredCoursePages) {
    const target = path.join(rootDir, relativePath);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, validPage);
  }

  return rootDir;
}

test('reports a required path when it is a directory instead of a file', (t) => {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'normis-static-assets-'));
  t.after(() => fs.rmSync(rootDir, { recursive: true, force: true }));

  fs.mkdirSync(path.join(rootDir, 'content'), { recursive: true });
  fs.mkdirSync(path.join(rootDir, 'content', 'course.md'));

  assert.ok(
    verifyStaticAssets(rootDir).includes('Missing: content/course.md'),
  );
});

test('requires the exact core design tokens and a non-yellow primary button', (t) => {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'normis-design-tokens-'));
  t.after(() => fs.rmSync(rootDir, { recursive: true, force: true }));

  for (const relativePath of [
    'content/course.md', 'content/landing.html', 'design/DESIGN.md', 'design/tokens.json',
    'assets/charts/01-housing-vs-salaries.png', 'assets/charts/02-minimum-payment.png',
    'assets/charts/03-price-slicing.png', 'assets/charts/04-better-vs-enough.png',
    'assets/charts/05-growth-vs-plateau.png', 'assets/css/site.css',
  ]) {
    const target = path.join(rootDir, relativePath);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, 'fixture');
  }

  fs.writeFileSync(path.join(rootDir, 'assets/css/variables.css'), ':root { --color-forest-ink: #1a3300; }');
  fs.writeFileSync(path.join(rootDir, 'assets/css/theme.css'), '.button--primary { background: var(--color-highlighter-yellow); }');

  const failures = verifyStaticAssets(rootDir);
  assert.ok(failures.includes('Missing design token: --color-cream-paper: #fcfaf5'));
  assert.ok(failures.includes('Missing design token: --color-highlighter-yellow: #ffe95c'));
  assert.ok(failures.includes('Primary button background must not use Highlighter Yellow'));
});

test('ignores commented tokens and rejects yellow primary backgrounds in CSS equivalents', (t) => {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'normis-css-parser-'));
  t.after(() => fs.rmSync(rootDir, { recursive: true, force: true }));

  for (const relativePath of [
    'content/course.md', 'content/landing.html', 'design/DESIGN.md', 'design/tokens.json',
    'assets/charts/01-housing-vs-salaries.png', 'assets/charts/02-minimum-payment.png',
    'assets/charts/03-price-slicing.png', 'assets/charts/04-better-vs-enough.png',
    'assets/charts/05-growth-vs-plateau.png', 'assets/css/site.css',
  ]) {
    const target = path.join(rootDir, relativePath);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, 'fixture');
  }

  fs.writeFileSync(path.join(rootDir, 'assets/css/variables.css'), `
    :root {
      /* --color-forest-ink: #1a3300; */
      --color-cream-paper: #fcfaf5;
      --color-highlighter-yellow: #ffe95c;
      --cta-fill: var(--color-highlighter-yellow);
    }
  `);
  fs.writeFileSync(path.join(rootDir, 'assets/css/theme.css'), `
    .button--primary { background: rgb(255 233 92); }
    .button--primary.gradient { background-image: linear-gradient(var(--cta-fill), hsl(52.31deg 100% 68.04%)); }
  `);

  const failures = verifyStaticAssets(rootDir);
  assert.ok(failures.includes('Missing design token: --color-forest-ink: #1a3300'));
  assert.ok(failures.includes('Primary button background must not use Highlighter Yellow'));
});

test('rejects a primary-button gradient that reaches yellow through a custom-property alias', (t) => {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'normis-css-alias-'));
  t.after(() => fs.rmSync(rootDir, { recursive: true, force: true }));

  for (const relativePath of [
    'content/course.md', 'content/landing.html', 'design/DESIGN.md', 'design/tokens.json',
    'assets/charts/01-housing-vs-salaries.png', 'assets/charts/02-minimum-payment.png',
    'assets/charts/03-price-slicing.png', 'assets/charts/04-better-vs-enough.png',
    'assets/charts/05-growth-vs-plateau.png', 'assets/css/site.css',
  ]) {
    const target = path.join(rootDir, relativePath);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, 'fixture');
  }

  fs.writeFileSync(path.join(rootDir, 'assets/css/variables.css'), `
    :root {
      --color-forest-ink: #1a3300;
      --color-cream-paper: #fcfaf5;
      --color-highlighter-yellow: #ffe95c;
      --accent-alias: var(--color-highlighter-yellow);
    }
  `);
  fs.writeFileSync(path.join(rootDir, 'assets/css/theme.css'), '.button--primary { background: linear-gradient(#1a3300, var(--accent-alias)); }');

  assert.ok(
    verifyStaticAssets(rootDir).includes('Primary button background must not use Highlighter Yellow'),
  );
});

test('requires all nine generated course pages', (t) => {
  const rootDir = createCompleteFixture('normis-required-pages-');
  t.after(() => fs.rmSync(rootDir, { recursive: true, force: true }));

  fs.rmSync(path.join(rootDir, 'course', 'module-4.html'));

  assert.ok(
    verifyStaticAssets(rootDir).includes('Missing: course/module-4.html'),
  );
});

test('validates course structure, navigation, and resolved local references', (t) => {
  const rootDir = createCompleteFixture('normis-page-graph-');
  t.after(() => fs.rmSync(rootDir, { recursive: true, force: true }));

  fs.writeFileSync(path.join(rootDir, 'course', 'module-1.html'), `<!doctype html><html><body>
    <a href="#section">Фрагмент</a><a href="https://example.com/help">Справка</a>
    <a href="missing.html#part">Сломанная глава</a>
    <img src="../assets/charts/missing.png" alt="График">
    <main><h1>Первый</h1></main><main><h1>Второй</h1></main>
  </body></html>`);

  const failures = verifyStaticAssets(rootDir);
  assert.ok(failures.includes('course/module-1.html: expected exactly one <main>, found 2'));
  assert.ok(failures.includes('course/module-1.html: expected exactly one <h1>, found 2'));
  assert.ok(failures.includes('course/module-1.html: missing UTF-8 meta charset'));
  assert.ok(failures.includes('course/module-1.html: missing link to root landing page'));
  assert.ok(failures.includes('course/module-1.html: missing link to course overview'));
  assert.ok(failures.includes('course/module-1.html: missing reading time'));
  assert.ok(failures.includes('course/module-1.html: broken href target: missing.html#part'));
  assert.ok(failures.includes('course/module-1.html: broken src target: ../assets/charts/missing.png'));
  assert.equal(failures.some((failure) => failure.includes('#section')), false);
  assert.ok(failures.includes('course/module-1.html: non-relative URL is not permitted in href: https://example.com/help'));
});

test('requires the Task 5 landing target as a regular file', (t) => {
  const rootDir = createCompleteFixture('normis-required-landing-');
  t.after(() => fs.rmSync(rootDir, { recursive: true, force: true }));

  fs.rmSync(path.join(rootDir, 'index.html'));

  const failures = verifyStaticAssets(rootDir);
  assert.ok(failures.includes('Missing: index.html'));
  assert.ok(failures.includes('course/module-1.html: broken href target: ../index.html'));
});

test('rejects local targets that exist as directories, including the planned landing path', (t) => {
  const rootDir = createCompleteFixture('normis-target-file-types-');
  t.after(() => fs.rmSync(rootDir, { recursive: true, force: true }));

  fs.rmSync(path.join(rootDir, 'index.html'));
  fs.mkdirSync(path.join(rootDir, 'index.html'));
  fs.mkdirSync(path.join(rootDir, 'course', 'directory-target'));
  const pagePath = path.join(rootDir, 'course', 'module-2.html');
  fs.appendFileSync(pagePath, '<a href="directory-target">Directory target</a>');

  const failures = verifyStaticAssets(rootDir);
  assert.ok(failures.includes('course/module-2.html: broken href target: ../index.html'));
  assert.ok(failures.includes('course/module-2.html: broken href target: directory-target'));
});

test('does not treat a landing-target metadata error as genuine absence', (t) => {
  const rootDir = createCompleteFixture('normis-target-metadata-error-');
  t.after(() => fs.rmSync(rootDir, { recursive: true, force: true }));

  fs.rmSync(path.join(rootDir, 'index.html'));
  const landingPath = path.resolve(rootDir, 'index.html');
  const originalLstatSync = fs.lstatSync;
  fs.lstatSync = (targetPath, ...args) => {
    if (path.resolve(targetPath) === landingPath) {
      const error = new Error('Access denied fixture');
      error.code = 'EPERM';
      throw error;
    }
    return originalLstatSync(targetPath, ...args);
  };
  t.after(() => { fs.lstatSync = originalLstatSync; });

  const failures = verifyStaticAssets(rootDir);
  assert.ok(failures.includes('course/module-3.html: broken href target: ../index.html'));
});

test('requires the progress API, defensive storage, and generated course identities', (t) => {
  const rootDir = createCompleteFixture('normis-progress-contract-');
  t.after(() => fs.rmSync(rootDir, { recursive: true, force: true }));

  fs.mkdirSync(path.join(rootDir, 'assets', 'js'), { recursive: true });
  fs.writeFileSync(path.join(rootDir, 'assets', 'js', 'progress.js'), 'window.CourseProgress = {};');
  fs.writeFileSync(path.join(rootDir, 'assets', 'js', 'site.js'), 'window.CourseSite = {};');

  const failures = verifyStaticAssets(rootDir);
  for (const method of ['read', 'visit', 'complete', 'clear']) {
    assert.ok(failures.includes(`assets/js/progress.js: missing CourseProgress method: ${method}`));
  }
  assert.ok(failures.includes('assets/js/progress.js: localStorage access must be guarded by try/catch'));
  assert.ok(failures.includes('course/index.html: missing data-page-kind="course"'));
  assert.ok(failures.includes('course/index.html: missing data-course-slug="index"'));
  assert.ok(failures.includes('assets/js/site.js: missing relative continue-link map'));
});

test('requires the landing structure, accessibility hooks, and ten-question quiz contract', (t) => {
  const rootDir = createCompleteFixture('normis-landing-contract-');
  t.after(() => fs.rmSync(rootDir, { recursive: true, force: true }));

  fs.mkdirSync(path.join(rootDir, 'assets', 'js'), { recursive: true });
  fs.writeFileSync(path.join(rootDir, 'assets', 'js', 'quiz.js'), `
    var questions = [
      { title: '1', autopilot: 'a', critical: 'c' }, { title: '2', autopilot: 'a', critical: 'c' },
      { title: '3', autopilot: 'a', critical: 'c' }, { title: '4', autopilot: 'a', critical: 'c' },
      { title: '5', autopilot: 'a', critical: 'c' }, { title: '6', autopilot: 'a', critical: 'c' },
      { title: '7', autopilot: 'a', critical: 'c' }, { title: '8', autopilot: 'a', critical: 'c' },
      { title: '9', autopilot: 'a', critical: 'c' }, { title: '10', autopilot: 'a', critical: 'c' }
    ];
    function mount(rootElement) {
      var input = rootElement.ownerDocument.createElement('input');
      input.setAttribute('type', 'radio');
      input.setAttribute('name', 'quiz-step');
    }
    var controls = ['Закрыть тест', 'Вернуться к тесту', 'data-quiz-reopen'];
    window.OrdinaryQuiz = { mount: function (rootElement) { return mount(rootElement); } };
  `);
  fs.writeFileSync(path.join(rootDir, 'index.html'), `<!doctype html><html lang="ru"><head><meta charset="utf-8"></head><body>
    <main><h1>Достаточная версия себя</h1><a href="course/index.html">Открыть курс</a>
    <a href="course/index.html" data-continue-link hidden>Продолжить</a>
    <div data-quiz><p data-quiz-status aria-live="polite"></p><p data-quiz-result aria-live="polite"></p></div>
    <noscript><a href="course/module-6.html#тесты">Полная текстовая версия восьми ситуаций</a></noscript>
    </main></body></html>`);

  assert.deepEqual(verifyStaticAssets(rootDir).filter((failure) => failure.includes('landing') || failure.includes('quiz')), []);

  fs.writeFileSync(path.join(rootDir, 'index.html'), '<main><h1>Первый</h1><h1>Второй</h1><a href="missing.html">Сломано</a></main>');
  fs.writeFileSync(path.join(rootDir, 'content', 'landing.html'), '<main>Hard-coded landing copy</main>');
  fs.writeFileSync(path.join(rootDir, 'assets', 'js', 'quiz.js'), 'localStorage.setItem("answers", "x"); window.OrdinaryQuiz = {};');
  const failures = verifyStaticAssets(rootDir);
  for (const expected of [
    'index.html: expected exactly one <h1>, found 2',
    'index.html: missing direct course overview link',
    'index.html: missing data-continue-link',
    'index.html: missing data-quiz root',
    'index.html: missing polite quiz status live region',
    'index.html: missing polite quiz result live region',
    'index.html: missing noscript link to complete quiz text',
    'index.html: broken href target: missing.html',
    'assets/js/quiz.js: expected exactly ten {title, autopilot, critical} question objects, found 0',
    'assets/js/quiz.js: missing OrdinaryQuiz.mount(rootElement)',
    'assets/js/quiz.js: quiz answers must stay in memory',
    'assets/js/quiz.js: missing semantic close/reopen controls',
    'content/landing.html: missing landing template placeholder: {{QUIZ_ROOT}}',
    'content/landing.html: missing landing template placeholder: {{CONTINUE_LINK}}',
  ]) {
    assert.ok(failures.includes(expected), expected);
  }
});

test('rejects quiz wording that drifts from eight canonical Markdown situations', (t) => {
  const rootDir = createCompleteFixture('normis-quiz-copy-drift-');
  t.after(() => fs.rmSync(rootDir, { recursive: true, force: true }));
  const situations = Array.from({ length: 8 }, (_, index) => `
**${index + 1}. Ситуация ${index + 1}** *(модуль 1)*
- 🔘 **Автопилот:** Автопилот ${index + 1}.
- 🔘 **Критическое:** Критическое ${index + 1}.`).join('\n');
  fs.writeFileSync(path.join(rootDir, 'content', 'course.md'), `## Тесты: проверка\n${situations}\n\n### Как читать результат\n`);
  fs.mkdirSync(path.join(rootDir, 'assets', 'js'), { recursive: true });
  const objects = Array.from({ length: 8 }, (_, index) => `{ title: 'Другая ситуация ${index + 1}', autopilot: 'Автопилот ${index + 1}.', critical: 'Критическое ${index + 1}.' }`).join(',');
  fs.writeFileSync(path.join(rootDir, 'assets', 'js', 'quiz.js'), `(function (global) {
    var questions = [${objects}];
    function mount(rootElement) { var input = rootElement.ownerDocument.createElement('input'); input.setAttribute('type', 'radio'); input.setAttribute('name', 'q'); }
    var labels = ['Закрыть тест', 'Вернуться к тесту', 'data-quiz-reopen'];
    global.OrdinaryQuiz = { mount: mount };
  }(window));`);

  assert.ok(verifyStaticAssets(rootDir).includes('assets/js/quiz.js: question wording differs from content/course.md'));
});

test('rejects unsafe document resources, missing image alt, duplicate IDs, and module scripts', (t) => {
  const rootDir = createCompleteFixture('normis-final-document-policy-');
  t.after(() => fs.rmSync(rootDir, { recursive: true, force: true }));

  fs.writeFileSync(path.join(rootDir, 'course', 'module-1.html'), `<!doctype html><html lang="ru"><head>
    <meta charset="utf-8">
    <script src="https://cdn.example.test/course.js"></script>
    <script type="module" src="../assets/js/site.js"></script>
  </head><body>
    <nav><a href="../index.html">Главная</a><a href="index.html">Содержание</a></nav>
    <main id="duplicate"><h1>Первый</h1><h1>Второй</h1>
      <span id="duplicate"></span>
      <img src="file:///C:/private/chart.png">
      <img src="C:\\private\\chart.png" alt="Локальный файл">
      <img src="/assets/charts/chart.png" alt="Корневой путь">
      <span class="reading-time">1 мин чтения</span>
    </main>
  </body></html>`);

  const failures = verifyStaticAssets(rootDir);
  for (const expected of [
    'course/module-1.html: expected exactly one <h1>, found 2',
    'course/module-1.html: duplicate id: duplicate',
    'course/module-1.html: image missing alt attribute: file:///C:/private/chart.png',
    'course/module-1.html: absolute local filesystem reference in src: file:///C:/private/chart.png',
    'course/module-1.html: absolute local filesystem reference in src: C:\\private\\chart.png',
    'course/module-1.html: local reference must be relative in src: /assets/charts/chart.png',
    'course/module-1.html: non-relative URL is not permitted in src: https://cdn.example.test/course.js',
    'course/module-1.html: module scripts are not direct-file compatible: ../assets/js/site.js',
  ]) {
    assert.ok(failures.includes(expected), expected);
  }
});

test('requires reduced-motion CSS and system or generic font fallbacks', (t) => {
  const rootDir = createCompleteFixture('normis-final-css-policy-');
  t.after(() => fs.rmSync(rootDir, { recursive: true, force: true }));

  fs.writeFileSync(path.join(rootDir, 'assets', 'css', 'variables.css'), `
    :root {
      --color-forest-ink: #1a3300;
      --color-cream-paper: #fcfaf5;
      --color-highlighter-yellow: #ffe95c;
      --font-body: "Unhosted Display";
    }
  `);
  fs.writeFileSync(path.join(rootDir, 'assets', 'css', 'theme.css'), `
    .button--primary { background: #1a3300; }
    body { font-family: var(--font-body); }
    /* @media (prefers-reduced-motion: reduce) {} */
  `);
  fs.writeFileSync(path.join(rootDir, 'assets', 'css', 'site.css'), `
    @import url("https://cdn.example.test/remote.css");
    .unsafe { background-image: url("file:///C:/private/paper.png"); }
  `);

  const failures = verifyStaticAssets(rootDir);
  assert.ok(failures.includes('assets/css/theme.css: missing prefers-reduced-motion: reduce media query'));
  assert.ok(failures.includes('assets/css/variables.css: font stack must end with a system or generic fallback: --font-body: "Unhosted Display"'));
  assert.ok(failures.includes('assets/css/theme.css: font stack must end with a system or generic fallback: font-family: var(--font-body)'));
  assert.ok(failures.includes('assets/css/site.css: non-relative CSS resource is not permitted: https://cdn.example.test/remote.css'));
  assert.ok(failures.includes('assets/css/site.css: absolute local filesystem reference: file:///C:/private/paper.png'));
});

test('permits only a Google Fonts external stylesheet resource', (t) => {
  const rootDir = createCompleteFixture('normis-final-external-resource-policy-');
  t.after(() => fs.rmSync(rootDir, { recursive: true, force: true }));

  fs.writeFileSync(path.join(rootDir, 'index.html'), `<!doctype html><html lang="ru"><head>
    <meta charset="utf-8">
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter&amp;display=swap">
    <link rel="stylesheet" href="https://fonts.googleapis.com/not-a-font-stylesheet">
    <link rel="stylesheet" href="https://cdn.example.test/site.css">
  </head><body><main><h1>Достаточная версия себя</h1>
    <a href="course/index.html">Открыть курс</a>
    <a href="course/index.html" data-continue-link hidden>Продолжить</a>
    <div data-quiz><p data-quiz-status aria-live="polite"></p><p data-quiz-result aria-live="polite"></p></div>
    <noscript><a href="course/module-6.html#тесты">Полная текстовая версия восьми ситуаций</a></noscript>
  </main></body></html>`);

  const failures = verifyStaticAssets(rootDir);
  assert.equal(failures.some((failure) => failure.includes('fonts.googleapis.com/css2')), false);
  assert.ok(failures.includes('index.html: external stylesheet is not permitted: https://fonts.googleapis.com/not-a-font-stylesheet'));
  assert.ok(failures.includes('index.html: external stylesheet is not permitted: https://cdn.example.test/site.css'));
});

test('rejects alternate schemes and absolute paths in every supported HTML URL attribute and srcset', (t) => {
  const rootDir = createCompleteFixture('normis-all-html-url-attributes-');
  t.after(() => fs.rmSync(rootDir, { recursive: true, force: true }));

  fs.writeFileSync(path.join(rootDir, 'course', 'module-1.html'), `<!doctype html>
  <html lang="ru" manifest="file:///C:/private/app.manifest"><head><meta charset="utf-8">
    <script src="blob:https://example.test/script-id"></script>
    <script src="data:text/javascript,alert(1)" src="../assets/js/site.js"></script>
  </head><body background="\\\\server\\share\\paper.png">
    <nav><a href="../index.html">Главная</a><a href="index.html">Содержание</a><a href="java&#x73;cript:alert(2)">Опасно</a></nav>
    <main><h1>Глава</h1><span class="reading-time">1 мин чтения</span>
      <form action="ftp://example.test/submit"><button formaction="javascript:alert(1)">Отправить</button></form>
      <video poster="//cdn.example.test/poster.png"></video>
      <object data="data:text/html,unsafe" code="C:\\private\\code.class" archive="/archive.jar relative.jar"></object>
      <blockquote cite="https://example.test/source">Цитата</blockquote>
      <svg><use href="https://example.test/icon.svg#mark" xlink:href="\\icons\\mark.svg"></use></svg>
      <img alt="Варианты" src="../assets/charts/01-housing-vs-salaries.png"
        srcset="../assets/charts/01-housing-vs-salaries.png 1x, https://cdn.example.test/chart.png 2x, /root-chart.png 3x, data:image/png;base64,AAAA 4x">
      <source srcset="relative.png,ftp://example.test/no-space.png 2x">
    </main>
  </body></html>`);

  const failures = verifyStaticAssets(rootDir);
  for (const expected of [
    'course/module-1.html: absolute local filesystem reference in manifest: file:///C:/private/app.manifest',
    'course/module-1.html: non-relative URL is not permitted in src: blob:https://example.test/script-id',
    'course/module-1.html: non-relative URL is not permitted in src: data:text/javascript,alert(1)',
    'course/module-1.html: non-relative URL is not permitted in href: javascript:alert(2)',
    'course/module-1.html: backslash URL is not permitted in background: \\\\server\\share\\paper.png',
    'course/module-1.html: non-relative URL is not permitted in action: ftp://example.test/submit',
    'course/module-1.html: non-relative URL is not permitted in formaction: javascript:alert(1)',
    'course/module-1.html: non-relative URL is not permitted in poster: //cdn.example.test/poster.png',
    'course/module-1.html: non-relative URL is not permitted in data: data:text/html,unsafe',
    'course/module-1.html: absolute local filesystem reference in code: C:\\private\\code.class',
    'course/module-1.html: local reference must be relative in archive: /archive.jar',
    'course/module-1.html: non-relative URL is not permitted in cite: https://example.test/source',
    'course/module-1.html: non-relative URL is not permitted in href: https://example.test/icon.svg#mark',
    'course/module-1.html: backslash URL is not permitted in xlink:href: \\icons\\mark.svg',
    'course/module-1.html: non-relative URL is not permitted in srcset: https://cdn.example.test/chart.png',
    'course/module-1.html: local reference must be relative in srcset: /root-chart.png',
    'course/module-1.html: non-relative URL is not permitted in srcset: data:image/png;base64,AAAA',
    'course/module-1.html: non-relative URL is not permitted in srcset: ftp://example.test/no-space.png',
  ]) {
    assert.ok(failures.includes(expected), expected);
  }
});

test('rejects non-relative URLs and incomplete font stacks in style attributes and style blocks', (t) => {
  const rootDir = createCompleteFixture('normis-embedded-css-policy-');
  t.after(() => fs.rmSync(rootDir, { recursive: true, force: true }));

  fs.writeFileSync(path.join(rootDir, 'course', 'module-1.html'), `<!doctype html><html lang="ru"><head>
    <meta charset="utf-8">
    <style>
      @import "ftp://example.test/print.css";
      .remote { background-image: url(//cdn.example.test/paper.png); font-family: "Display Only"; }
    </style>
  </head><body>
    <nav><a href="../index.html">Главная</a><a href="index.html">Содержание</a></nav>
    <main><h1>Глава</h1><span class="reading-time">1 мин чтения</span>
      <p style="background-image: url(data:image/png;base64,AAAA); font-family: 'Inline Only'">Текст</p>
    </main>
  </body></html>`);

  const failures = verifyStaticAssets(rootDir);
  for (const expected of [
    'course/module-1.html <style>: non-relative CSS resource is not permitted: ftp://example.test/print.css',
    'course/module-1.html <style>: non-relative CSS resource is not permitted: //cdn.example.test/paper.png',
    'course/module-1.html <style>: font stack must end with a system or generic fallback: font-family: "Display Only"',
    'course/module-1.html style attribute: non-relative CSS resource is not permitted: data:image/png;base64,AAAA',
    "course/module-1.html style attribute: font stack must end with a system or generic fallback: font-family: 'Inline Only'",
  ]) {
    assert.ok(failures.includes(expected), expected);
  }
});

test('rejects the reviewer adversarial image, ping, srcdoc, refresh, SVG, and font shorthand fixture', (t) => {
  const rootDir = createCompleteFixture('normis-reviewer-adversarial-policy-');
  t.after(() => fs.rmSync(rootDir, { recursive: true, force: true }));

  fs.writeFileSync(path.join(rootDir, 'course', 'module-1.html'), `<!doctype html><html lang="ru"><head>
    <meta charset="utf-8">
    <meta http-equiv="refresh" content="0; URL=blob:https://example.test/refresh-id">
    <link rel="preload" as="image" href="../assets/charts/01-housing-vs-salaries.png"
      imagesrcset="relative.png 1x,data:image/png;base64,AAAA 2x, https://cdn.example.test/image.png 3x">
    <style>
      .shorthand { font: italic 700 16px/1.4 "Display Only"; }
      :root { --font-card: 600 1rem "Custom Only"; }
    </style>
  </head><body>
    <nav><a href="../index.html">Главная</a><a href="index.html">Содержание</a></nav>
    <main><h1>Глава</h1><span class="reading-time">1 мин чтения</span>
      <a href="chapter.html" ping="https://metrics.example.test/ping ftp://metrics.example.test/backup">Глава</a>
      <iframe title="Вложение" srcdoc="&lt;img src=&quot;https://cdn.example.test/inside.png&quot;&gt;"></iframe>
      <svg aria-label="Декор">
        <rect fill="url(data:image/svg+xml;base64,AAAA)" stroke="url(//cdn.example.test/stroke.svg#paint)"
          filter="url(https://cdn.example.test/filter.svg#fx)" clip-path="url(/clip.svg#shape)"
          mask="url(C:\\private\\mask.svg#mask)" marker-start="url(blob:https://example.test/marker)"
          marker-mid="url(ftp://example.test/mid.svg#marker)" marker-end="url(file:///C:/private/end.svg#marker)"></rect>
      </svg>
      <p style="font: 16px 'Inline Shorthand Only'; --font-note: italic 1rem 'Note Only'">Текст</p>
    </main>
  </body></html>`);

  const failures = verifyStaticAssets(rootDir);
  for (const expected of [
    'course/module-1.html: non-relative URL is not permitted in imagesrcset: data:image/png;base64,AAAA',
    'course/module-1.html: non-relative URL is not permitted in imagesrcset: https://cdn.example.test/image.png',
    'course/module-1.html: non-relative URL is not permitted in ping: https://metrics.example.test/ping',
    'course/module-1.html: non-relative URL is not permitted in ping: ftp://metrics.example.test/backup',
    'course/module-1.html: srcdoc contains resource/navigation-capable content',
    'course/module-1.html: non-relative URL is not permitted in meta refresh: blob:https://example.test/refresh-id',
    'course/module-1.html SVG fill attribute: non-relative CSS resource is not permitted: data:image/svg+xml;base64,AAAA',
    'course/module-1.html SVG stroke attribute: non-relative CSS resource is not permitted: //cdn.example.test/stroke.svg#paint',
    'course/module-1.html SVG filter attribute: non-relative CSS resource is not permitted: https://cdn.example.test/filter.svg#fx',
    'course/module-1.html SVG clip-path attribute: local CSS resource must be relative: /clip.svg#shape',
    'course/module-1.html SVG mask attribute: absolute local filesystem reference: C:\\private\\mask.svg#mask',
    'course/module-1.html SVG marker-start attribute: non-relative CSS resource is not permitted: blob:https://example.test/marker',
    'course/module-1.html SVG marker-mid attribute: non-relative CSS resource is not permitted: ftp://example.test/mid.svg#marker',
    'course/module-1.html SVG marker-end attribute: absolute local filesystem reference: file:///C:/private/end.svg#marker',
    'course/module-1.html <style>: font stack must end with a system or generic fallback: font: italic 700 16px/1.4 "Display Only"',
    'course/module-1.html <style>: font stack must end with a system or generic fallback: --font-card: 600 1rem "Custom Only"',
    "course/module-1.html style attribute: font stack must end with a system or generic fallback: font: 16px 'Inline Shorthand Only'",
    "course/module-1.html style attribute: font stack must end with a system or generic fallback: --font-note: italic 1rem 'Note Only'",
  ]) {
    assert.ok(failures.includes(expected), expected);
  }
});
