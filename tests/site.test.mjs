import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';

const rootDir = path.resolve(import.meta.dirname, '..');
const sitePath = path.join(rootDir, 'assets', 'js', 'site.js');

test('landing bootstrap mounts the quiz and maps Continue for every saved course slug', () => {
  const targets = new Map([
    ['index', 'course/index.html'], ['module-1', 'course/module-1.html'], ['escapes', 'course/escapes.html'],
    ['module-2', 'course/module-2.html'], ['module-3', 'course/module-3.html'],
    ['module-4', 'course/module-4.html'], ['module-5', 'course/module-5.html'], ['beauty', 'course/beauty.html'], ['health', 'course/health.html'], ['sex', 'course/sex.html'],
    ['module-6', 'course/module-6.html'], ['week', 'course/week.html'], ['grief', 'course/grief.html'],
    ['finale', 'course/finale.html'],
  ]);
  for (const [slug, expectedUrl] of targets) {
    const continueLink = { hidden: true, href: '' };
    const quizRoot = {};
    let mounted = null;
    const document = {
      readyState: 'complete',
      body: { getAttribute(name) { return name === 'data-page-kind' ? 'landing' : null; } },
      querySelector(selector) { return selector === '[data-quiz]' ? quizRoot : null; },
      querySelectorAll(selector) { return selector === '[data-continue-link]' ? [continueLink] : []; },
    };
    const window = {
      CourseProgress: { read() { return { lastSlug: slug, completed: [] }; } },
      OrdinaryQuiz: { mount(root) { mounted = root; } },
    };
    window.window = window;

    vm.runInNewContext(fs.readFileSync(sitePath, 'utf8'), { window, document });

    assert.equal(mounted, quizRoot);
    assert.equal(continueLink.href, expectedUrl);
    assert.equal(continueLink.hidden, false);
  }
});

test('landing Continue ignores prototype properties and unknown progress slugs', () => {
  for (const slug of ['__proto__', 'constructor', 'toString', 'module-7']) {
    const continueLink = { hidden: true, href: '' };
    const document = {
      readyState: 'complete',
      body: { getAttribute(name) { return name === 'data-page-kind' ? 'landing' : null; } },
      querySelector() { return null; },
      querySelectorAll(selector) { return selector === '[data-continue-link]' ? [continueLink] : []; },
    };
    const window = { CourseProgress: { read() { return { lastSlug: slug, completed: [] }; } } };
    window.window = window;

    vm.runInNewContext(fs.readFileSync(sitePath, 'utf8'), { window, document });

    assert.equal(continueLink.href, '', slug);
    assert.equal(continueLink.hidden, true, slug);
  }
});

test('course Continue ignores prototype properties and unknown progress slugs', () => {
  for (const lastSlug of ['__proto__', 'constructor', 'toString', 'module-7']) {
    const continueLink = { hidden: true, href: '' };
    const count = { textContent: '' };
    const completedState = { textContent: '' };
    const completeButton = { disabled: false, textContent: '', addEventListener() {} };
    const enhancement = { hidden: true };
    const selectorTargets = new Map([
      ['[data-progress-count]', [count]],
      ['[data-completed-state]', [completedState]],
      ['[data-mark-complete]', [completeButton]],
      ['[data-continue-link]', [continueLink]],
      ['[data-progress-enhancement]', [enhancement]],
    ]);
    const document = {
      readyState: 'complete',
      body: {
        getAttribute(name) {
          if (name === 'data-page-kind') return 'course';
          if (name === 'data-course-slug') return 'module-1';
          return null;
        },
      },
      querySelectorAll(selector) { return selectorTargets.get(selector) ?? []; },
    };
    const window = {
      CourseProgress: {
        read() { return { lastSlug, completed: [] }; },
        visit() {},
        complete() {},
      },
    };
    window.window = window;

    vm.runInNewContext(fs.readFileSync(sitePath, 'utf8'), { window, document });

    assert.equal(continueLink.href, '', lastSlug);
    assert.equal(continueLink.hidden, true, lastSlug);
  }
});
