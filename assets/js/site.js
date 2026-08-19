(function initialiseCourseSite(global, document) {
  'use strict';

  var continueUrls = {
    index: 'module-1.html',
    'module-1': 'escapes.html',
    escapes: 'module-2.html',
    'module-2': 'module-3.html',
    'module-3': 'module-4.html',
    'module-4': 'module-5.html',
    'module-5': 'beauty.html',
    beauty: 'health.html',
    health: 'module-6.html',
    'module-6': 'sex.html',
    sex: 'grief.html',
    grief: 'week.html',
    week: 'finale.html',
  };

  var landingContinueUrls = {
    index: 'course/index.html',
    'module-1': 'course/module-1.html',
    escapes: 'course/escapes.html',
    'module-2': 'course/module-2.html',
    'module-3': 'course/module-3.html',
    'module-4': 'course/module-4.html',
    'module-5': 'course/module-5.html',
    beauty: 'course/beauty.html',
    health: 'course/health.html',
    sex: 'course/sex.html',
    'module-6': 'course/module-6.html',
    week: 'course/week.html',
    grief: 'course/grief.html',
    finale: 'course/finale.html',
  };

  var SUPPORT_SEEN_KEY = 'ordinary-version.support-seen';

  function supportSeen() {
    try {
      return global.localStorage.getItem(SUPPORT_SEEN_KEY) === '1';
    } catch (error) {
      return false;
    }
  }

  function rememberSupportSeen() {
    try {
      global.localStorage.setItem(SUPPORT_SEEN_KEY, '1');
    } catch (error) {
      // Remembering is a courtesy, not a requirement: the screen stays skippable either way.
    }
  }

  function ownMapValue(map, key) {
    return typeof key === 'string' && Object.prototype.hasOwnProperty.call(map, key) ? map[key] : null;
  }

  function updateProgress(progress, slug) {
    var state = progress.read();
    var completed = state.completed.indexOf(slug) !== -1;
    var count = String(state.completed.length);

    document.querySelectorAll('[data-progress-count]').forEach(function (target) {
      target.textContent = count;
    });
    document.querySelectorAll('[data-completed-state]').forEach(function (target) {
      target.textContent = completed ? 'Эта глава отмечена как прочитанная.' : 'Глава пока не отмечена как прочитанная.';
    });
    document.querySelectorAll('[data-mark-complete]').forEach(function (button) {
      button.disabled = completed;
      button.textContent = completed ? 'Прочитано' : 'Отметить прочитанным';
    });
    document.querySelectorAll('[data-continue-link]').forEach(function (link) {
      var nextUrl = ownMapValue(continueUrls, state.lastSlug);
      if (nextUrl) {
        link.href = nextUrl;
        link.hidden = false;
      }
    });
  }

  function initialise() {
    var body = document.body;
    if (!body) return;

    if (body.getAttribute('data-page-kind') === 'landing') {
      var quizRoot = document.querySelector('[data-quiz]');
      if (quizRoot && global.OrdinaryQuiz && typeof global.OrdinaryQuiz.mount === 'function') {
        global.OrdinaryQuiz.mount(quizRoot);
      }

      if (supportSeen()) {
        document.querySelectorAll('[data-course-entry]').forEach(function (link) {
          link.href = 'course/index.html';
        });
      }

      var landingProgress = global.CourseProgress;
      if (landingProgress && typeof landingProgress.read === 'function') {
        try {
          var landingState = landingProgress.read();
          var landingUrl = ownMapValue(landingContinueUrls, landingState.lastSlug);
          if (landingUrl) {
            document.querySelectorAll('[data-continue-link]').forEach(function (link) {
              link.href = landingUrl;
              link.hidden = false;
            });
          }
        } catch (error) {
          // Progress remains an optional enhancement on the landing page.
        }
      }
      return;
    }

    if (body.getAttribute('data-page-kind') === 'support') {
      document.querySelectorAll('[data-support-skip], [data-support-pay]').forEach(function (control) {
        control.addEventListener('click', rememberSupportSeen);
      });

      var form = document.querySelector('[data-support-form]');
      if (form) {
        form.addEventListener('submit', function (event) {
          // Nothing to submit: the amount is the reader's own note to the payment provider.
          event.preventDefault();
        });
      }
      return;
    }

    if (body.getAttribute('data-page-kind') !== 'course') return;

    var slug = body.getAttribute('data-course-slug');
    var progress = global.CourseProgress;
    if (!slug || !progress || typeof progress.read !== 'function' || typeof progress.visit !== 'function' || typeof progress.complete !== 'function') return;

    try {
      progress.visit(slug);
      document.querySelectorAll('[data-mark-complete]').forEach(function (button) {
        button.addEventListener('click', function () {
          progress.complete(slug);
          updateProgress(progress, slug);
        });
      });
      updateProgress(progress, slug);
      document.querySelectorAll('[data-progress-enhancement]').forEach(function (target) {
        target.hidden = false;
      });
    } catch (error) {
      // Enhancement failures leave the serverless course fully readable.
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialise, { once: true });
  } else {
    initialise();
  }
}(window, document));
