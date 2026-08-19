import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';

const rootDir = path.resolve(import.meta.dirname, '..');
const quizPath = path.join(rootDir, 'assets', 'js', 'quiz.js');

class FakeElement {
  constructor(tagName, ownerDocument) {
    this.tagName = tagName.toUpperCase();
    this.ownerDocument = ownerDocument;
    this.children = [];
    this.attributes = new Map();
    this.listeners = new Map();
    this.textContent = '';
    this.disabled = false;
    this.checked = false;
    this.hidden = false;
  }

  append(...children) {
    for (const child of children) {
      child.parentNode = this;
      this.children.push(child);
    }
  }

  replaceChildren(...children) {
    this.children = [];
    this.append(...children);
  }

  setAttribute(name, value) { this.attributes.set(name, String(value)); }
  getAttribute(name) { return this.attributes.get(name) ?? null; }
  addEventListener(type, listener) {
    if (!this.listeners.has(type)) this.listeners.set(type, []);
    this.listeners.get(type).push(listener);
  }
  dispatch(type) {
    for (const listener of this.listeners.get(type) ?? []) listener({ currentTarget: this, target: this });
  }
  focus() { this.ownerDocument.activeElement = this; }
}

class FakeDocument {
  constructor() { this.activeElement = null; }
  createElement(tagName) { return new FakeElement(tagName, this); }
}

function descendants(root) {
  return [root, ...root.children.flatMap(descendants)];
}

function find(root, predicate) {
  return descendants(root).find(predicate);
}

function findAll(root, predicate) {
  return descendants(root).filter(predicate);
}

function button(root, text) {
  return find(root, (element) => element.tagName === 'BUTTON' && element.textContent === text);
}

function loadQuiz() {
  const source = fs.existsSync(quizPath) ? fs.readFileSync(quizPath, 'utf8') : '';
  const document = new FakeDocument();
  const window = { document };
  window.window = window;
  vm.runInNewContext(source, { window, document });
  return { quiz: window.OrdinaryQuiz, document };
}

function canonicalQuestions() {
  const lines = fs.readFileSync(path.join(rootDir, 'content', 'course.md'), 'utf8').split(/\r?\n/);
  const start = lines.findIndex((line) => line.startsWith('## Тесты:'));
  const end = lines.findIndex((line, index) => index > start && line.startsWith('### Как читать результат'));
  const questions = [];
  for (let index = start + 1; index < end; index += 1) {
    const title = /^\*\*\d+\. (.+)\*\* \*\([^)]+\)\*$/.exec(lines[index])?.[1];
    if (!title) continue;
    const autopilot = /^- 🔘 \*\*Автопилот:\*\* (.+)$/.exec(lines[index + 1])?.[1];
    const critical = /^- 🔘 \*\*Критическое:\*\* (.+)$/.exec(lines[index + 2])?.[1];
    questions.push({ title, autopilot, critical });
  }
  return questions;
}

function implementedQuestions() {
  const source = fs.readFileSync(quizPath, 'utf8').replace(
    'global.OrdinaryQuiz = { mount: mount };',
    'global.__ordinaryQuestions = questions; global.OrdinaryQuiz = { mount: mount };',
  );
  const window = {};
  window.window = window;
  vm.runInNewContext(source, { window });
  return JSON.parse(JSON.stringify(window.__ordinaryQuestions));
}

function mountQuiz() {
  const { quiz, document } = loadQuiz();
  assert.equal(typeof quiz?.mount, 'function');
  const root = document.createElement('div');
  quiz.mount(root);
  return { root, document };
}

test('OrdinaryQuiz leaves initial page focus and scroll position untouched, then focuses explicit step changes', () => {
  const { root, document } = mountQuiz();
  assert.equal(document.activeElement, null);

  button(root, 'Начать')?.dispatch('click');
  assert.equal(document.activeElement?.tagName, 'H3');
  assert.match(document.activeElement.textContent, /Лента показала ровесника/);

  const radios = findAll(root, (element) => element.tagName === 'INPUT');
  assert.equal(radios.length, 2);
  assert.ok(radios.every((radio) => radio.getAttribute('type') === 'radio'));
  assert.equal(new Set(radios.map((radio) => radio.getAttribute('name'))).size, 1);
  assert.equal(findAll(root, (element) => element.tagName === 'LABEL').length, 2);
  assert.equal(button(root, 'Далее').disabled, true);

  radios[0].checked = true;
  radios[0].dispatch('change');
  assert.equal(button(root, 'Далее').disabled, false);
});

test('OrdinaryQuiz preserves answers with Back and reports the canonical score band politely', () => {
  const { root } = mountQuiz();
  button(root, 'Начать').dispatch('click');

  for (let question = 0; question < 10; question += 1) {
    const radios = findAll(root, (element) => element.tagName === 'INPUT');
    const choice = question < 4 ? radios.find((radio) => radio.getAttribute('value') === 'autopilot')
      : radios.find((radio) => radio.getAttribute('value') === 'critical');
    choice.checked = true;
    choice.dispatch('change');
    button(root, question === 9 ? 'Показать результат' : 'Далее').dispatch('click');
  }

  const result = find(root, (element) => element.getAttribute('data-quiz-result') !== null);
  assert.equal(result.getAttribute('aria-live'), 'polite');
  assert.match(result.textContent, /4 из 10/);
  assert.match(result.textContent, /норма живого человека/i);

  button(root, 'Назад').dispatch('click');
  const selected = find(root, (element) => element.tagName === 'INPUT' && element.checked);
  assert.equal(selected.getAttribute('value'), 'critical');
  assert.equal(button(root, 'Показать результат').disabled, false);
});

test('OrdinaryQuiz reset restores the introduction without trapping focus', () => {
  const { root, document } = mountQuiz();
  button(root, 'Начать').dispatch('click');
  button(root, 'Сбросить тест').dispatch('click');

  assert.match(document.activeElement.textContent, /проверки автопилота/i);
  assert.equal(button(root, 'Начать').tagName, 'BUTTON');
});

test('OrdinaryQuiz renders the canonical low and high score interpretations', () => {
  for (const [autopilotCount, expected] of [[0, /0–3 — либо ты уже прошёл курс/], [10, /7–10 — поздравляем, ты идеальный клиент/]]) {
    const { root } = mountQuiz();
    button(root, 'Начать').dispatch('click');
    for (let question = 0; question < 10; question += 1) {
      const value = question < autopilotCount ? 'autopilot' : 'critical';
      const choice = find(root, (element) => element.tagName === 'INPUT' && element.getAttribute('value') === value);
      choice.checked = true;
      choice.dispatch('change');
      button(root, question === 9 ? 'Показать результат' : 'Далее').dispatch('click');
    }
    const result = find(root, (element) => element.getAttribute('data-quiz-result') !== null);
    assert.match(result.textContent, expected);
  }
});

test('OrdinaryQuiz can close and reopen without losing state or trapping focus', () => {
  const { root, document } = mountQuiz();
  button(root, 'Начать').dispatch('click');
  const autopilot = find(root, (element) => element.tagName === 'INPUT' && element.getAttribute('value') === 'autopilot');
  autopilot.checked = true;
  autopilot.dispatch('change');

  button(root, 'Закрыть тест').dispatch('click');
  assert.equal(findAll(root, (element) => element.tagName === 'INPUT').length, 0);
  assert.equal(document.activeElement?.tagName, 'BUTTON');
  assert.equal(document.activeElement?.textContent, 'Вернуться к тесту');

  button(root, 'Вернуться к тесту').dispatch('click');
  assert.equal(document.activeElement?.tagName, 'H3');
  assert.match(document.activeElement?.textContent, /Лента показала ровесника/);
  assert.equal(find(root, (element) => element.tagName === 'INPUT' && element.checked)?.getAttribute('value'), 'autopilot');
});

test('OrdinaryQuiz renders exactly one native same-name radio pair on every question step', () => {
  const { root } = mountQuiz();
  const names = new Set();
  button(root, 'Начать').dispatch('click');
  for (let question = 0; question < 10; question += 1) {
    const radios = findAll(root, (element) => element.tagName === 'INPUT');
    assert.equal(radios.length, 2, `question ${question + 1}`);
    assert.ok(radios.every((radio) => radio.getAttribute('type') === 'radio'));
    assert.equal(new Set(radios.map((radio) => radio.getAttribute('name'))).size, 1);
    assert.equal(findAll(root, (element) => element.tagName === 'LABEL').length, 2);
    names.add(radios[0].getAttribute('name'));
    radios[1].checked = true;
    radios[1].dispatch('change');
    button(root, question === 9 ? 'Показать результат' : 'Далее').dispatch('click');
  }
  assert.equal(names.size, 10);
});

test('OrdinaryQuiz question wording exactly matches the canonical Markdown situations', () => {
  assert.deepEqual(implementedQuestions(), canonicalQuestions());
});

test('the quiz generator survives apostrophes, backslashes and quotes in the canon', async () => {
  const { renderQuizSource } = await import('../scripts/sync-quiz.mjs');
  const hostile = [
    { title: "don't stop", autopilot: 'a \ backslash', critical: 'he said "no" — and \'yes\'' },
    { title: 'line\u2028separator', autopilot: 'tab\there', critical: 'quote: «внутри» и „тоже“' },
  ];
  const skeleton = fs.readFileSync(quizPath, 'utf8');
  const rendered = renderQuizSource(skeleton, hostile);

  const context = { window: {} };
  context.window.window = context.window;
  vm.runInNewContext(rendered, context);
  const parsed = context.window.OrdinaryQuiz.questions ?? null;
  assert.ok(rendered.includes(JSON.stringify("don't stop")), 'apostrophes survive escaping');
  assert.ok(rendered.includes(JSON.stringify('a \ backslash')), 'backslashes survive escaping');
  assert.ok(rendered.includes(JSON.stringify('he said "no" — and \'yes\'')), 'mixed quotes survive escaping');
  assert.doesNotThrow(() => new vm.Script(rendered), 'generated quiz source parses');
  if (parsed) assert.deepEqual(parsed.slice(0, hostile.length), hostile);
});
