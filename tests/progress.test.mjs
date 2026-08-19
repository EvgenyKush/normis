import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';

const rootDir = path.resolve(import.meta.dirname, '..');
const progressPath = path.join(rootDir, 'assets', 'js', 'progress.js');
const progressKey = 'ordinary-self-progress-v1';
const courseSlugs = ['index', 'module-1', 'escapes', 'module-2', 'module-3', 'module-4', 'module-5', 'beauty', 'health', 'module-6', 'sex', 'grief', 'week', 'finale'];

function loadProgress(storage, storageGetterThrows = false) {
  const source = fs.existsSync(progressPath) ? fs.readFileSync(progressPath, 'utf8') : '';
  const window = {};
  Object.defineProperty(window, 'localStorage', {
    get() {
      if (storageGetterThrows) throw new Error('blocked');
      return storage;
    },
  });
  window.window = window;
  vm.runInNewContext(source, { window, JSON });
  return window.CourseProgress;
}

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); },
    value(key) { return values.get(key); },
  };
}

function plainState(state) {
  return JSON.parse(JSON.stringify(state));
}

test('CourseProgress records the most recent visit and de-duplicates completed chapters', () => {
  const storage = memoryStorage();
  const progress = loadProgress(storage);

  assert.equal(typeof progress?.read, 'function');
  assert.equal(typeof progress?.visit, 'function');
  assert.equal(typeof progress?.complete, 'function');
  assert.equal(typeof progress?.clear, 'function');

  progress.visit('module-1');
  progress.complete('module-1');
  progress.complete('module-1');

  assert.deepEqual(plainState(progress.read()), { lastSlug: 'module-1', completed: ['module-1'] });
  assert.deepEqual(JSON.parse(storage.value(progressKey)), { lastSlug: 'module-1', completed: ['module-1'] });

  progress.clear();
  assert.deepEqual(plainState(progress.read()), { lastSlug: null, completed: [] });
});

test('CourseProgress returns an empty state when stored data is malformed or storage throws', () => {
  const malformed = loadProgress(memoryStorage({ [progressKey]: '{not json' }));
  assert.deepEqual(plainState(malformed?.read()), { lastSlug: null, completed: [] });

  const invalidShape = loadProgress(memoryStorage({
    [progressKey]: JSON.stringify({ lastSlug: 42, completed: 'module-1' }),
  }));
  assert.deepEqual(plainState(invalidShape?.read()), { lastSlug: null, completed: [] });

  const throwingStorage = {
    getItem() { throw new Error('blocked'); },
    setItem() { throw new Error('blocked'); },
    removeItem() { throw new Error('blocked'); },
  };
  const unavailable = loadProgress(throwingStorage);

  assert.doesNotThrow(() => unavailable?.visit('module-2'));
  assert.doesNotThrow(() => unavailable?.complete('module-2'));
  assert.doesNotThrow(() => unavailable?.clear());
  assert.deepEqual(plainState(unavailable?.read()), { lastSlug: null, completed: [] });

  const getterFailure = loadProgress(null, true);
  assert.doesNotThrow(() => getterFailure?.visit('module-2'));
  assert.doesNotThrow(() => getterFailure?.complete('module-2'));
  assert.doesNotThrow(() => getterFailure?.clear());
  assert.deepEqual(plainState(getterFailure?.read()), { lastSlug: null, completed: [] });
});

test('CourseProgress accepts exactly the eight course slugs and removes untrusted stored keys', () => {
  const storage = memoryStorage({
    [progressKey]: JSON.stringify({
      lastSlug: '__proto__',
      completed: ['index', 'constructor', 'module-3', 'toString', 'module-3'],
    }),
  });
  const progress = loadProgress(storage);

  assert.deepEqual(plainState(progress.read()), { lastSlug: null, completed: ['index', 'module-3'] });

  for (const slug of ['__proto__', 'constructor', 'toString', 'module-7', '', null]) {
    progress.visit(slug);
    progress.complete(slug);
  }
  assert.deepEqual(plainState(progress.read()), { lastSlug: null, completed: ['index', 'module-3'] });

  progress.clear();
  for (const slug of courseSlugs) progress.complete(slug);
  assert.deepEqual(plainState(progress.read()), { lastSlug: 'finale', completed: courseSlugs });
});
