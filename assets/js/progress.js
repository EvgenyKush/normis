(function exposeCourseProgress(global) {
  'use strict';

  var storageKey = 'ordinary-self-progress-v1';
  var courseSlugs = ['index', 'module-1', 'escapes', 'module-2', 'module-3', 'module-4', 'module-5', 'beauty', 'health', 'module-6', 'sex', 'grief', 'week', 'finale'];
  var knownSlugs = Object.create(null);
  courseSlugs.forEach(function (slug) { knownSlugs[slug] = true; });

  function isKnownSlug(value) {
    return typeof value === 'string' && Object.prototype.hasOwnProperty.call(knownSlugs, value);
  }

  function emptyState() {
    return { lastSlug: null, completed: [] };
  }

  function normaliseState(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
    if (!(typeof value.lastSlug === 'string' || value.lastSlug === null)) return null;
    if (!Array.isArray(value.completed) || !value.completed.every(function (slug) {
      return typeof slug === 'string';
    })) return null;

    return {
      lastSlug: isKnownSlug(value.lastSlug) ? value.lastSlug : null,
      completed: value.completed.filter(function (slug, index, completed) {
        return isKnownSlug(slug) && completed.indexOf(slug) === index;
      }),
    };
  }

  function storage() {
    try {
      return global.localStorage;
    } catch (error) {
      return null;
    }
  }

  function read() {
    try {
      var availableStorage = storage();
      if (!availableStorage) return emptyState();
      var rawState = availableStorage.getItem(storageKey);
      if (!rawState) return emptyState();
      var state = normaliseState(JSON.parse(rawState));
      return state || emptyState();
    } catch (error) {
      return emptyState();
    }
  }

  function write(state) {
    try {
      var availableStorage = storage();
      if (availableStorage) availableStorage.setItem(storageKey, JSON.stringify(state));
    } catch (error) {
      // Storage is an optional enhancement; reading must continue without it.
    }
  }

  function visit(slug) {
    try {
      if (!isKnownSlug(slug)) return;
      var state = read();
      state.lastSlug = slug;
      write(state);
    } catch (error) {
      // The public API deliberately never exposes storage failures.
    }
  }

  function complete(slug) {
    try {
      if (!isKnownSlug(slug)) return;
      var state = read();
      if (state.completed.indexOf(slug) === -1) state.completed.push(slug);
      state.lastSlug = slug;
      write(state);
    } catch (error) {
      // The public API deliberately never exposes storage failures.
    }
  }

  function clear() {
    try {
      var availableStorage = storage();
      if (availableStorage) availableStorage.removeItem(storageKey);
    } catch (error) {
      // The public API deliberately never exposes storage failures.
    }
  }

  global.CourseProgress = { read: read, visit: visit, complete: complete, clear: clear };
}(window));
