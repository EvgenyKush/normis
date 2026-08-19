import fs from 'node:fs';
import path from 'node:path';

const wordPattern = /[\p{L}\p{N}]+(?:[-’'][\p{L}\p{N}]+)*/gu;
const structuralMetricKeys = [
  'parts',
  'modules',
  'headings',
  'practices',
  'quizSituations',
  'finaleHeadings',
  'chartReferences',
  'headingTexts',
];

function markdownHeadingText(line) {
  return /^#{1,6}\s+(.+?)\s*#*\s*$/u.exec(line)?.[1] ?? null;
}

function isMarkdownParagraphLine(line) {
  return line.trim().length > 0
    && !/^#{1,6}\s+/u.test(line)
    && !/^\s*(?:---+|\*\s*\*\s*\*+)\s*$/u.test(line)
    && !/^!\[[^\]]*\]\([^)]*\)\s*$/u.test(line)
    && !/^\s*(?:[-+*]|\d+\.)\s+/u.test(line)
    && !/^\|.*\|\s*$/u.test(line);
}

function markdownParagraphs(courseText) {
  let paragraphs = 0;
  let previousWasParagraph = false;
  for (const line of courseText.split(/\r?\n/u)) {
    const isParagraph = isMarkdownParagraphLine(line);
    if (isParagraph && !previousWasParagraph) paragraphs += 1;
    previousWasParagraph = isParagraph;
  }
  return paragraphs;
}

function visibleHtmlText(landingText) {
  return landingText
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/giu, ' ')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/giu, ' ')
    .replace(/<[^>]+>/gu, ' ')
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'");
}

function markdownVisibleText(courseText) {
  return courseText
    .replace(/!\[([^\]]*)\]\([^)]*\)/gu, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/gu, '$1')
    .replace(/^#{1,6}\s+/gmu, '')
    .replace(/\*\*|__|`/gu, ' ');
}

function countWords(text) {
  return text.match(wordPattern)?.length ?? 0;
}

function countLandingParagraphs(landingText) {
  const withoutHiddenMarkup = landingText
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/giu, '')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/giu, '');
  return [...withoutHiddenMarkup.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/giu)]
    .filter((match) => countWords(visibleHtmlText(match[1])) > 0)
    .length;
}

/**
 * Collects stable structural and textual metrics from the canonical Markdown
 * course and landing template without writing to either source.
 */
export function collectEditorialMetrics(courseText, landingText) {
  const lines = courseText.split(/\r?\n/u);
  const headingTexts = lines.map(markdownHeadingText).filter((heading) => heading !== null);
  const finaleStart = lines.findIndex((line) => /^# ФИНАЛ\s*$/u.test(line));
  const finaleLines = finaleStart === -1 ? [] : lines.slice(finaleStart);
  const quizStart = lines.findIndex((line) => /^## Тесты:/u.test(line));
  const quizEnd = lines.findIndex((line, index) => index > quizStart && /^### Как читать результат/u.test(line));
  const quizLines = quizStart === -1 ? [] : lines.slice(quizStart, quizEnd === -1 ? lines.length : quizEnd);

  return {
    parts: lines.filter((line) => /^# ЧАСТЬ (?:I|II|III)\./u.test(line)).length,
    modules: lines.filter((line) => /^## Модуль [1-6]\b/u.test(line)).length,
    headings: headingTexts.length,
    practices: lines.filter((line) => /^#{1,6}\s+Практика(?=\s|:|$)/u.test(line) || /^\*\*Практика(?=\s|:|\*)[^*]*\*\*:?[\s]*$/u.test(line)).length,
    quizSituations: quizLines.filter((line) => /^\*\*[1-8]\./u.test(line)).length,
    finaleHeadings: finaleLines.filter((line) => /^#{1,6}\s+/u.test(line)).length,
    chartReferences: lines.filter((line) => /!\[[^\]]*\]\([^)]*\)/u.test(line)).length,
    paragraphs: markdownParagraphs(courseText) + countLandingParagraphs(landingText),
    words: countWords(markdownVisibleText(courseText)) + countWords(visibleHtmlText(landingText)),
    headingTexts,
  };
}

export function compareEditorialMetrics(baseline, current, { allowTextChange = false } = {}) {
  const keys = allowTextChange
    ? structuralMetricKeys
    : [...structuralMetricKeys, 'paragraphs', 'words'];
  return keys.filter((key) => JSON.stringify(baseline[key]) !== JSON.stringify(current[key]));
}

function projectPaths() {
  const rootDir = path.resolve(import.meta.dirname, '..');
  return {
    coursePath: path.join(rootDir, 'content', 'course.md'),
    landingPath: path.join(rootDir, 'content', 'landing.html'),
  };
}

function metricsForCurrentSources() {
  const { coursePath, landingPath } = projectPaths();
  return collectEditorialMetrics(
    fs.readFileSync(coursePath, 'utf8'),
    fs.readFileSync(landingPath, 'utf8'),
  );
}

function usage() {
  return 'Usage: node scripts/editorial-baseline.mjs [--write <path> | --compare <path> [--allow-text-change]]';
}

function runCli(args) {
  const current = metricsForCurrentSources();
  if (args.length === 0) {
    process.stdout.write(`${JSON.stringify(current, null, 2)}\n`);
    return;
  }
  if (args[0] === '--write' && args.length === 2) {
    const outputPath = path.resolve(process.cwd(), args[1]);
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, `${JSON.stringify(current, null, 2)}\n`, 'utf8');
    process.stdout.write(`Editorial baseline written: ${outputPath}\n`);
    return;
  }
  if (args[0] === '--compare' && (args.length === 2 || (args.length === 3 && args[2] === '--allow-text-change'))) {
    const baselinePath = path.resolve(process.cwd(), args[1]);
    const baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
    const differences = compareEditorialMetrics(baseline, current, { allowTextChange: args[2] === '--allow-text-change' });
    process.stdout.write(`${JSON.stringify({ differences, baseline, current }, null, 2)}\n`);
    process.exitCode = differences.length === 0 ? 0 : 1;
    return;
  }
  throw new Error(usage());
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.filename)) {
  try {
    runCli(process.argv.slice(2));
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}
