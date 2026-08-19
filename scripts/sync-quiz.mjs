/**
 * Regenerates the 10 quiz situations in `assets/js/quiz.js` from the canonical
 * course text. `content/course.md` is the only source of the wording; the quiz array
 * is derived output and must never be edited by hand.
 *
 * Usage:
 *   node scripts/sync-quiz.mjs          rewrite assets/js/quiz.js from the canon
 *   node scripts/sync-quiz.mjs --check  exit 1 if the file is out of sync (no write)
 */
import fs from 'node:fs';
import path from 'node:path';

const rootDir = path.resolve(import.meta.dirname, '..');
const coursePath = path.join(rootDir, 'content', 'course.md');
const quizPath = path.join(rootDir, 'assets', 'js', 'quiz.js');

const SITUATION_PATTERN =
  /^\*\*(\d+)\. (.+?)\*\* \*\(([^)]+)\)\*\n- 🔘 \*\*Автопилот:\*\* (.+)\n- 🔘 \*\*Критическое:\*\* (.+)/gmu;

export function canonicalSituations(courseText) {
  const start = courseText.indexOf('## Тесты:');
  const end = courseText.indexOf('### Как читать результат');
  if (start < 0 || end <= start) throw new Error('quiz block boundaries not found in the canon');
  const situations = [...courseText.slice(start, end).matchAll(SITUATION_PATTERN)]
    .map((match) => ({ title: match[2], autopilot: match[4], critical: match[5] }));
  if (situations.length !== 10) throw new Error(`parsed ${situations.length} situations, expected 10`);
  return situations;
}

export function renderQuizSource(quizSource, situations) {
  const arrayStart = quizSource.indexOf('var questions = [');
  if (arrayStart < 0) throw new Error('questions array not found in quiz.js');
  const arrayEnd = quizSource.indexOf('\n  ];', arrayStart);
  if (arrayEnd < 0) throw new Error('questions array end not found in quiz.js');

  // JSON.stringify emits a valid JS string literal for any input — apostrophes,
  // backslashes, quotes and control characters included. A hand-rolled quote escaper
  // would break or silently truncate the array the first time the course text used one.
  const rendered = situations.map((s) => `    {
      title: ${JSON.stringify(s.title)},
      autopilot: ${JSON.stringify(s.autopilot)},
      critical: ${JSON.stringify(s.critical)},
    },`).join('\n');

  return `${quizSource.slice(0, arrayStart)}var questions = [\n${rendered}${quizSource.slice(arrayEnd)}`;
}

function run(argv) {
  const situations = canonicalSituations(fs.readFileSync(coursePath, 'utf8'));
  const current = fs.readFileSync(quizPath, 'utf8');
  const next = renderQuizSource(current, situations);

  if (argv.includes('--check')) {
    if (current === next) {
      process.stdout.write('Quiz synchronization: PASS\n');
      return;
    }
    process.stderr.write('Quiz synchronization: FAIL — assets/js/quiz.js differs from content/course.md\n');
    process.exitCode = 1;
    return;
  }

  fs.writeFileSync(quizPath, next, 'utf8');
  process.stdout.write(
    current === next
      ? 'Quiz already synchronized with the canon\n'
      : 'Quiz synchronized: ${situations.length} situations rewritten from content/course.md\n',
  );
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.filename)) {
  try {
    run(process.argv.slice(2));
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}
