import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const requiredPaths = [
  'content/course.md',
  'content/landing.html',
  'design/DESIGN.md',
  'design/tokens.json',
  'assets/charts/01-housing-vs-salaries.png',
  'assets/charts/02-minimum-payment.png',
  'assets/charts/03-price-slicing.png',
  'assets/charts/04-better-vs-enough.png',
  'assets/charts/05-growth-vs-plateau.png',
  'assets/css/variables.css',
  'assets/css/theme.css',
  'assets/css/site.css',
  'assets/js/progress.js',
  'assets/js/quiz.js',
  'assets/js/site.js',
  'index.html',
];

export const requiredPages = [
  'course/index.html',
  'course/module-1.html',
  'course/escapes.html',
  'course/module-2.html',
  'course/module-3.html',
  'course/module-4.html',
  'course/module-5.html',
  'course/beauty.html',
  'course/health.html',
  'course/module-6.html',
  'course/sex.html',
  'course/week.html',
  'course/grief.html',
  'course/finale.html',
];

export const requiredLetterPages = [
  'letters/index.html',
  'letters/letter-1.html',
  'letters/letter-2.html',
  'letters/letter-3.html',
  'letters/letter-4.html',
  'letters/letter-5.html',
  'letters/letter-6.html',
];

const requiredTokens = new Map([
  ['--color-forest-ink', '#1a3300'],
  ['--color-cream-paper', '#fcfaf5'],
  ['--color-highlighter-yellow', '#ffe95c'],
]);

const requiredLandingPlaceholders = [
  '{{THEME_CSS}}', '{{SITE_CSS}}', '{{PROGRESS_JS}}', '{{QUIZ_JS}}', '{{SITE_JS}}',
  '{{COURSE_INDEX}}', '{{MODULE_1}}', '{{MODULE_2}}', '{{MODULE_3}}', '{{MODULE_4}}',
  '{{MODULE_5}}', '{{MODULE_6}}',
  '{{ESCAPES}}', '{{BEAUTY}}', '{{HEALTH}}', '{{SEX}}', '{{WEEK}}', '{{GRIEF}}', '{{FINALE}}', '{{LETTERS}}', '{{QUIZ_TEXT}}',
  '{{CONTINUE_LINK}}', '{{QUIZ_ROOT}}',
];

function readTextIfFile(rootDir, relativePath) {
  try {
    return fs.readFileSync(path.join(rootDir, relativePath), 'utf8');
  } catch {
    return null;
  }
}

function isRegularFile(targetPath) {
  try {
    return fs.statSync(targetPath).isFile();
  } catch {
    return false;
  }
}

function stripCssComments(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, '');
}

function parseCssRules(source) {
  const cleanSource = stripCssComments(source);
  const rules = [];
  let selectorStart = 0;
  let bodyStart = 0;
  let depth = 0;
  let selector = '';

  for (let index = 0; index < cleanSource.length; index += 1) {
    if (cleanSource[index] === '{') {
      if (depth === 0) {
        selector = cleanSource.slice(selectorStart, index).trim();
        bodyStart = index + 1;
      }
      depth += 1;
    } else if (cleanSource[index] === '}') {
      depth -= 1;
      if (depth === 0) {
        const body = cleanSource.slice(bodyStart, index);
        rules.push({ selector, body });
        if (selector.startsWith('@')) rules.push(...parseCssRules(body));
        selectorStart = index + 1;
      }
    }
  }

  return rules;
}

function parseDeclarations(body) {
  return body
    .split(';')
    .map((declaration) => {
      const separator = declaration.indexOf(':');
      return separator === -1 ? null : {
        property: declaration.slice(0, separator).trim().toLowerCase(),
        value: declaration.slice(separator + 1).trim(),
      };
    })
    .filter(Boolean);
}

function customProperties(...sources) {
  const properties = new Map();
  for (const source of sources) {
    for (const rule of parseCssRules(source)) {
      for (const declaration of parseDeclarations(rule.body)) {
        if (declaration.property.startsWith('--')) {
          properties.set(declaration.property, declaration.value);
        }
      }
    }
  }
  return properties;
}

function isHighlighterYellowHex(hex) {
  let value = hex.slice(1);
  if (value.length === 3 || value.length === 4) {
    value = [...value.slice(0, 3)].map((character) => character.repeat(2)).join('');
  } else {
    value = value.slice(0, 6);
  }
  return value.toLowerCase() === 'ffe95c';
}

function isHighlighterYellowRgb(red, green, blue) {
  return Math.abs(red - 255) <= 1 && Math.abs(green - 233) <= 1 && Math.abs(blue - 92) <= 1;
}

function parseRgbComponent(component) {
  const value = Number.parseFloat(component);
  return component.trim().endsWith('%') ? (value * 255) / 100 : value;
}

function hueToRgb(hue, saturation, lightness) {
  const chroma = (1 - Math.abs((2 * lightness) - 1)) * saturation;
  const segment = hue / 60;
  const second = chroma * (1 - Math.abs((segment % 2) - 1));
  const [red, green, blue] = segment < 1 ? [chroma, second, 0]
    : segment < 2 ? [second, chroma, 0]
      : segment < 3 ? [0, chroma, second]
        : segment < 4 ? [0, second, chroma]
          : segment < 5 ? [second, 0, chroma]
            : [chroma, 0, second];
  const match = lightness - (chroma / 2);
  return [red, green, blue].map((component) => (component + match) * 255);
}

function containsHighlighterYellow(value, properties, seen = new Set()) {
  const variablePattern = /var\(\s*(--[\w-]+)(?:\s*,[^)]*)?\)/gi;
  for (const match of value.matchAll(variablePattern)) {
    const variable = match[1].toLowerCase();
    if (variable === '--color-highlighter-yellow') return true;
    if (!seen.has(variable) && properties.has(variable)) {
      seen.add(variable);
      if (containsHighlighterYellow(properties.get(variable), properties, seen)) return true;
    }
  }

  for (const match of value.matchAll(/#[\da-f]{3,8}\b/gi)) {
    if (isHighlighterYellowHex(match[0])) return true;
  }
  for (const match of value.matchAll(/rgba?\(\s*([\d.]+%?)\s*(?:,|\s)\s*([\d.]+%?)\s*(?:,|\s)\s*([\d.]+%?)/gi)) {
    if (isHighlighterYellowRgb(...match.slice(1).map(parseRgbComponent))) return true;
  }
  for (const match of value.matchAll(/hsla?\(\s*([\d.]+)(?:deg)?\s*(?:,|\s)\s*([\d.]+)%\s*(?:,|\s)\s*([\d.]+)%/gi)) {
    const hue = ((Number.parseFloat(match[1]) % 360) + 360) % 360;
    const rgb = hueToRgb(hue, Number.parseFloat(match[2]) / 100, Number.parseFloat(match[3]) / 100);
    if (isHighlighterYellowRgb(...rgb)) return true;
  }
  return false;
}

function openingTagCount(source, tagName) {
  return [...source.matchAll(new RegExp(`<${tagName}\\b`, 'gi'))].length;
}

function attributeReferences(source) {
  return [...source.matchAll(/\b(href|src)\s*=\s*(["'])(.*?)\2/gi)]
    .map((match) => ({ attribute: match[1].toLowerCase(), reference: match[3] }));
}

function htmlElements(source) {
  const withoutComments = source.replace(/<!--[\s\S]*?-->/gu, '');
  return [...withoutComments.matchAll(/<([a-z][\w:-]*)\b[^>]*>/giu)].map((match) => {
    const attributes = new Map();
    const attributeEntries = [];
    const attributeSource = match[0].slice(match[1].length + 1, -1);
    const attributePattern = /\s+([^\s"'<>\/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/gu;
    for (const attribute of attributeSource.matchAll(attributePattern)) {
      const name = attribute[1].toLowerCase();
      const value = attribute[2] ?? attribute[3] ?? attribute[4] ?? '';
      attributeEntries.push([name, value]);
      if (!attributes.has(name)) attributes.set(name, value);
    }
    return { name: match[1].toLowerCase(), attributes, attributeEntries };
  });
}

const htmlUrlAttributes = new Set([
  'src', 'href', 'action', 'formaction', 'poster', 'data', 'code', 'archive',
  'background', 'cite', 'manifest', 'xlink:href', 'ping',
]);

const svgUrlPresentationAttributes = new Set([
  'fill', 'stroke', 'filter', 'clip-path', 'mask', 'marker',
  'marker-start', 'marker-mid', 'marker-end',
]);

function referenceViolation(reference) {
  const value = reference.trim().replace(/[\t\r\n]/gu, '');
  if (!value || value.startsWith('#') || value.startsWith('?')) return null;
  if (/^file:/iu.test(value) || /^[a-z]:[\\/]/iu.test(value)) return 'absolute-local';
  if (value.includes('\\')) return 'backslash';
  if (value.startsWith('//') || /^[a-z][a-z\d+.-]*:/iu.test(value)) return 'non-relative';
  if (value.startsWith('/')) return 'root-absolute';
  return null;
}

function decodeHtmlAttributeValue(value) {
  return value
    .replace(/&#x([\da-f]+);?/giu, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&#(\d+);?/gu, (_, code) => String.fromCodePoint(Number.parseInt(code, 10)))
    .replace(/&(colon|sol|bsol|tab|newline|amp);/giu, (_, entity) => ({
      colon: ':', sol: '/', bsol: '\\', tab: '\t', newline: '\n', amp: '&',
    })[entity.toLowerCase()]);
}

function srcsetCandidates(source) {
  const candidates = [];
  let index = 0;
  while (index < source.length) {
    while (index < source.length && /[\s,]/u.test(source[index])) index += 1;
    if (index >= source.length) break;
    const start = index;
    const isDataCandidate = source.slice(index, index + 5).toLowerCase() === 'data:';
    while (index < source.length && !/\s/u.test(source[index]) && (isDataCandidate || source[index] !== ',')) index += 1;
    let candidate = source.slice(start, index);
    if (!candidate.toLowerCase().startsWith('data:')) candidate = candidate.replace(/,+$/u, '');
    if (candidate) candidates.push(candidate);
    let parentheses = 0;
    while (index < source.length) {
      if (source[index] === '(') parentheses += 1;
      if (source[index] === ')' && parentheses > 0) parentheses -= 1;
      if (source[index] === ',' && parentheses === 0) {
        index += 1;
        break;
      }
      index += 1;
    }
  }
  return candidates;
}

function attributeUrlCandidates(attribute, value) {
  const decoded = decodeHtmlAttributeValue(value);
  if (attribute === 'srcset' || attribute === 'imagesrcset') return srcsetCandidates(decoded);
  if (attribute === 'archive' || attribute === 'ping') return decoded.trim().split(/\s+/u).filter(Boolean);
  return [decoded];
}

function metaRefreshTarget(content) {
  const decoded = decodeHtmlAttributeValue(content).trim();
  const match = /^\d+(?:\.\d+)?\s*;\s*(?:url\s*=\s*)?([\s\S]+)$/iu.exec(decoded);
  if (!match) return null;
  return match[1].trim().replace(/^(?:"([\s\S]*)"|'([\s\S]*)')$/u, (_, doubleQuoted, singleQuoted) => doubleQuoted ?? singleQuoted);
}

function srcdocContainsResourceOrNavigation(value) {
  const decoded = decodeHtmlAttributeValue(value).trim();
  if (!decoded) return false;
  return /<\s*(?:a|area|audio|base|button|embed|form|iframe|img|input|link|meta|object|script|source|style|svg|track|video)\b/iu.test(decoded)
    || /(?:[a-z][a-z\d+.-]*:|\/\/|[a-z]:[\\/]|\\\\)/iu.test(decoded)
    || /\b(?:src|href|action|formaction|poster|data|code|archive|background|cite|manifest|ping)\s*=\s*["']?\s*\//iu.test(decoded);
}

function isAllowedGoogleFontsStylesheet(element, attribute, reference) {
  if (element.name !== 'link' || attribute !== 'href') return false;
  const rel = (element.attributes.get('rel') ?? '').toLowerCase().split(/\s+/u);
  if (!rel.includes('stylesheet')) return false;
  try {
    const url = new URL(reference);
    return url.protocol === 'https:'
      && url.hostname === 'fonts.googleapis.com'
      && url.port === ''
      && url.username === ''
      && url.password === ''
      && (url.pathname === '/css' || url.pathname === '/css2');
  } catch {
    return false;
  }
}

function formatHtmlReferenceFailure(relativePath, attribute, reference, violation, element) {
  if (violation === 'absolute-local') {
    return `${relativePath}: absolute local filesystem reference in ${attribute}: ${reference}`;
  }
  if (violation === 'backslash') {
    return `${relativePath}: backslash URL is not permitted in ${attribute}: ${reference}`;
  }
  if (violation === 'root-absolute') {
    return `${relativePath}: local reference must be relative in ${attribute}: ${reference}`;
  }
  if (element.name === 'link' && attribute === 'href') {
    return `${relativePath}: external stylesheet is not permitted: ${reference}`;
  }
  return `${relativePath}: non-relative URL is not permitted in ${attribute}: ${reference}`;
}

function cssReferences(source) {
  const cleanSource = stripCssComments(source);
  return [
    ...[...cleanSource.matchAll(/url\(\s*(?:"([^"]*)"|'([^']*)'|([^\s)'"`]+))\s*\)/giu)]
      .map((match) => match[1] ?? match[2] ?? match[3]),
    ...[...cleanSource.matchAll(/@import\s+(?!url\()["']([^"']+)["']/giu)]
      .map((match) => match[1]),
  ];
}

function formatCssReferenceFailure(label, reference, violation) {
  if (violation === 'absolute-local') return `${label}: absolute local filesystem reference: ${reference}`;
  if (violation === 'backslash') return `${label}: backslash CSS resource is not permitted: ${reference}`;
  if (violation === 'root-absolute') return `${label}: local CSS resource must be relative: ${reference}`;
  return `${label}: non-relative CSS resource is not permitted: ${reference}`;
}

function verifyCssReferences(label, source) {
  return cssReferences(source)
    .map((reference) => ({ reference, violation: referenceViolation(reference) }))
    .filter(({ violation }) => violation !== null)
    .map(({ reference, violation }) => formatCssReferenceFailure(label, reference, violation));
}

function verifyDocumentPolicy(relativePath, source, cssSources) {
  const failures = [];
  const elements = htmlElements(source);
  const seenIds = new Set();
  const styleBlocks = [...source.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/giu)].map((match) => match[1]);
  const documentProperties = customProperties(
    ...cssSources.map(({ source: cssSource }) => cssSource ?? ''),
    ...styleBlocks,
  );

  for (const element of elements) {
    const id = element.attributes.get('id');
    if (id !== undefined) {
      if (seenIds.has(id)) failures.push(`${relativePath}: duplicate id: ${id}`);
      seenIds.add(id);
    }

    if (element.name === 'img' && !element.attributes.has('alt')) {
      failures.push(`${relativePath}: image missing alt attribute: ${element.attributes.get('src') ?? '(missing src)'}`);
    }

    for (const [attribute, value] of element.attributeEntries) {
      if (!htmlUrlAttributes.has(attribute) && attribute !== 'srcset' && attribute !== 'imagesrcset') continue;
      for (const reference of attributeUrlCandidates(attribute, value)) {
        const violation = referenceViolation(reference);
        if (violation === null || isAllowedGoogleFontsStylesheet(element, attribute, reference)) continue;
        failures.push(formatHtmlReferenceFailure(relativePath, attribute, reference, violation, element));
      }
    }

    if (element.name === 'meta'
      && (element.attributes.get('http-equiv') ?? '').trim().toLowerCase() === 'refresh') {
      const target = metaRefreshTarget(element.attributes.get('content') ?? '');
      const violation = target === null ? null : referenceViolation(target);
      if (target !== null && violation !== null) {
        failures.push(formatHtmlReferenceFailure(relativePath, 'meta refresh', target, violation, element));
      }
    }

    for (const [, srcdoc] of element.attributeEntries.filter(([attribute]) => attribute === 'srcdoc')) {
      if (srcdocContainsResourceOrNavigation(srcdoc)) {
        failures.push(`${relativePath}: srcdoc contains resource/navigation-capable content`);
      }
    }

    for (const [attribute, value] of element.attributeEntries) {
      if (!svgUrlPresentationAttributes.has(attribute) || !/url\s*\(/iu.test(value)) continue;
      failures.push(...verifyCssReferences(
        `${relativePath} SVG ${attribute} attribute`,
        decodeHtmlAttributeValue(value),
      ));
    }

    if (element.name === 'script') {
      const sourceReference = element.attributes.get('src');
      if ((element.attributes.get('type') ?? '').trim().toLowerCase() === 'module') {
        failures.push(`${relativePath}: module scripts are not direct-file compatible: ${sourceReference ?? '(inline script)'}`);
      }
    }

    const inlineStyles = element.attributeEntries
      .filter(([attribute]) => attribute === 'style')
      .map(([, value]) => decodeHtmlAttributeValue(value));
    for (const inlineStyle of inlineStyles) {
      const label = `${relativePath} style attribute`;
      failures.push(...verifyCssReferences(label, inlineStyle));
      const declarations = parseDeclarations(inlineStyle);
      const inlineProperties = new Map(documentProperties);
      for (const declaration of declarations) {
        if (declaration.property.startsWith('--')) inlineProperties.set(declaration.property, declaration.value);
      }
      failures.push(...verifyFontDeclarations(label, declarations, inlineProperties));
    }
  }

  for (const styleBlock of styleBlocks) {
    const label = `${relativePath} <style>`;
    failures.push(...verifyCssReferences(label, styleBlock));
    const declarations = parseCssRules(styleBlock).flatMap((rule) => parseDeclarations(rule.body));
    failures.push(...verifyFontDeclarations(label, declarations, documentProperties));
  }

  return failures;
}

const systemFontFallbacks = new Set([
  'serif', 'sans-serif', 'monospace', 'cursive', 'fantasy', 'system-ui',
  'ui-serif', 'ui-sans-serif', 'ui-monospace', 'ui-rounded', 'math', 'emoji',
  'fangsong', '-apple-system', 'blinkmacsystemfont', 'segoe ui',
]);

function resolveCssVariables(value, properties) {
  let resolved = value;
  const visited = new Set();
  for (let iteration = 0; iteration < 20; iteration += 1) {
    let changed = false;
    resolved = resolved.replace(/var\(\s*(--[\w-]+)(?:\s*,\s*([^)]*))?\)/giu, (match, name, fallback = '') => {
      const key = name.toLowerCase();
      if (visited.has(key)) return fallback || match;
      visited.add(key);
      if (!properties.has(key)) return fallback || match;
      changed = true;
      return properties.get(key);
    });
    if (!changed) break;
  }
  return resolved;
}

function fontStackHasFallback(value, properties) {
  const resolved = resolveCssVariables(value, properties).trim();
  if (/^(?:inherit|initial|revert|revert-layer|unset)$/iu.test(resolved)) return true;
  const lastFamily = resolved.split(',').at(-1)?.trim().replace(/^["']|["']$/gu, '').toLowerCase();
  return systemFontFallbacks.has(lastFamily);
}

const nonFamilyFontCustomProperty = /^--font-(?:weight|size|style|stretch|variant|feature|kerning|optical|synthesis|variation)(?:-|$)/u;
const cssWideFontValues = /^(?:inherit|initial|revert|revert-layer|unset)$/iu;
const systemFontShorthands = /^(?:caption|icon|menu|message-box|small-caption|status-bar)$/iu;

function fontShorthandFamily(value, properties) {
  const resolved = resolveCssVariables(value, properties).trim();
  if (cssWideFontValues.test(resolved) || systemFontShorthands.test(resolved)) return { safeKeyword: true };
  const size = '(?:xx-small|x-small|small|medium|large|x-large|xx-large|xxx-large|smaller|larger|(?:\\d*\\.?\\d+)(?:%|cap|ch|em|ex|ic|lh|rem|rlh|px|cm|mm|q|in|pc|pt|vh|vw|vi|vb|vmin|vmax))';
  const match = new RegExp(`(?:^|\\s)${size}(?:\\s*\\/\\s*[^\\s]+)?\\s+([\\s\\S]+)$`, 'iu').exec(resolved);
  return match ? { family: match[1].trim() } : null;
}

function fontDeclarationHasFallback(declaration, properties) {
  if (declaration.property === 'font-family') return fontStackHasFallback(declaration.value, properties);
  if (declaration.property === 'font') {
    const shorthand = fontShorthandFamily(declaration.value, properties);
    return shorthand?.safeKeyword === true
      || (shorthand?.family !== undefined && fontStackHasFallback(shorthand.family, properties));
  }
  if ((declaration.property === '--font' || declaration.property.startsWith('--font-'))
    && !nonFamilyFontCustomProperty.test(declaration.property)) {
    const shorthand = fontShorthandFamily(declaration.value, properties);
    if (shorthand?.safeKeyword === true) return true;
    if (shorthand?.family !== undefined) return fontStackHasFallback(shorthand.family, properties);
    return fontStackHasFallback(declaration.value, properties);
  }
  return true;
}

function verifyFontDeclarations(label, declarations, properties) {
  const failures = [];
  for (const declaration of declarations) {
    const isFamilyProperty = declaration.property === 'font-family';
    const isFontShorthand = declaration.property === 'font';
    const isFamilyVariable = (declaration.property === '--font' || declaration.property.startsWith('--font-'))
      && !nonFamilyFontCustomProperty.test(declaration.property);
    if ((isFamilyProperty || isFontShorthand || isFamilyVariable)
      && !fontDeclarationHasFallback(declaration, properties)) {
      failures.push(`${label}: font stack must end with a system or generic fallback: ${declaration.property}: ${declaration.value}`);
    }
  }
  return failures;
}

function verifyCssPolicy(cssSources) {
  const failures = [];
  const properties = customProperties(...cssSources.map(({ source }) => source ?? ''));
  const theme = cssSources.find(({ relativePath }) => relativePath === 'assets/css/theme.css')?.source ?? '';
  if (!/@media\s*\(\s*prefers-reduced-motion\s*:\s*reduce\s*\)/iu.test(stripCssComments(theme))) {
    failures.push('assets/css/theme.css: missing prefers-reduced-motion: reduce media query');
  }

  for (const { relativePath, source } of cssSources) {
    if (source === null) continue;
    failures.push(...verifyCssReferences(relativePath, source));
    const declarations = parseCssRules(source).flatMap((rule) => parseDeclarations(rule.body));
    failures.push(...verifyFontDeclarations(relativePath, declarations, properties));
  }
  return failures;
}

function localTarget(pagePath, reference) {
  const trimmed = reference.trim();
  if (!trimmed || trimmed.startsWith('#') || /^https?:\/\//i.test(trimmed)) return null;
  if (/^[a-z][a-z\d+.-]*:/i.test(trimmed)) return null;

  const pathPart = trimmed.split('#', 1)[0].split('?', 1)[0];
  if (!pathPart) return null;
  try {
    return path.resolve(path.dirname(pagePath), decodeURIComponent(pathPart));
  } catch {
    return path.resolve(path.dirname(pagePath), pathPart);
  }
}

function verifyCoursePage(rootDir, relativePath, source) {
  const failures = [];
  const pagePath = path.resolve(rootDir, relativePath);
  const mainCount = openingTagCount(source, 'main');
  const h1Count = openingTagCount(source, 'h1');
  const references = attributeReferences(source);

  if (mainCount !== 1) {
    failures.push(`${relativePath}: expected exactly one <main>, found ${mainCount}`);
  }
  if (h1Count !== 1) {
    failures.push(`${relativePath}: expected exactly one <h1>, found ${h1Count}`);
  }
  if (!/<meta\b[^>]*\bcharset\s*=\s*["']?utf-8\b[^>]*>/i.test(source)) {
    failures.push(`${relativePath}: missing UTF-8 meta charset`);
  }
  if (!/<(?:span|p)\b[^>]*\bclass\s*=\s*["'][^"']*\breading-time\b[^"']*["'][^>]*>/i.test(source)) {
    failures.push(`${relativePath}: missing reading time`);
  }

  const hrefTargets = references
    .filter(({ attribute }) => attribute === 'href')
    .map(({ reference }) => localTarget(pagePath, reference))
    .filter(Boolean);
  if (!hrefTargets.includes(path.resolve(rootDir, 'index.html'))) {
    failures.push(`${relativePath}: missing link to root landing page`);
  }
  if (!hrefTargets.includes(path.resolve(rootDir, 'course/index.html'))) {
    failures.push(`${relativePath}: missing link to course overview`);
  }

  for (const { attribute, reference } of references) {
    const target = localTarget(pagePath, reference);
    if (target && !isRegularFile(target)) {
      failures.push(`${relativePath}: broken ${attribute} target: ${reference}`);
    }
  }

  return failures;
}

function verifyLandingContract(rootDir) {
  const failures = [];
  const relativePath = 'index.html';
  const source = readTextIfFile(rootDir, relativePath);
  const quizPath = 'assets/js/quiz.js';
  const quiz = readTextIfFile(rootDir, quizPath);
  const landingTemplatePath = 'content/landing.html';
  const landingTemplate = readTextIfFile(rootDir, landingTemplatePath);

  if (landingTemplate !== null) {
    for (const placeholder of requiredLandingPlaceholders) {
      if (!landingTemplate.includes(placeholder)) {
        failures.push(`${landingTemplatePath}: missing landing template placeholder: ${placeholder}`);
      }
    }
  }

  if (source !== null) {
    const h1Count = openingTagCount(source, 'h1');
    if (h1Count !== 1) failures.push(`${relativePath}: expected exactly one <h1>, found ${h1Count}`);
    const pagePath = path.resolve(rootDir, relativePath);
    const directCourseLink = attributeReferences(source).some(({ attribute, reference }) => (
      attribute === 'href' && localTarget(pagePath, reference) === path.resolve(rootDir, 'course/index.html')
    ));
    if (!directCourseLink) failures.push(`${relativePath}: missing direct course overview link`);
    if (!source.includes('data-continue-link')) failures.push(`${relativePath}: missing data-continue-link`);
    if (!source.includes('data-quiz')) failures.push(`${relativePath}: missing data-quiz root`);
    if (/\{\{[A-Z0-9_]+\}\}/u.test(source)) failures.push(`${relativePath}: unresolved landing template placeholder`);
    if (!/<[^>]+data-quiz-status[^>]+aria-live\s*=\s*["']polite["'][^>]*>|<[^>]+aria-live\s*=\s*["']polite["'][^>]+data-quiz-status[^>]*>/iu.test(source)) {
      failures.push(`${relativePath}: missing polite quiz status live region`);
    }
    if (!/<[^>]+data-quiz-result[^>]+aria-live\s*=\s*["']polite["'][^>]*>|<[^>]+aria-live\s*=\s*["']polite["'][^>]+data-quiz-result[^>]*>/iu.test(source)) {
      failures.push(`${relativePath}: missing polite quiz result live region`);
    }
    if (!/<noscript\b[^>]*>[\s\S]*?<a\b[^>]*href\s*=\s*["']course\/module-6\.html#[^"']+["'][^>]*>[\s\S]*?<\/noscript>/iu.test(source)) {
      failures.push(`${relativePath}: missing noscript link to complete quiz text`);
    }
    for (const { attribute, reference } of attributeReferences(source)) {
      const target = localTarget(pagePath, reference);
      if (target && !isRegularFile(target)) {
        failures.push(`${relativePath}: broken ${attribute} target: ${reference}`);
      }
    }
  }

  if (quiz !== null) {
    const questionObjects = quiz.match(/\{\s*title\s*:\s*['"][\s\S]*?['"]\s*,\s*autopilot\s*:\s*['"][\s\S]*?['"]\s*,\s*critical\s*:\s*['"][\s\S]*?['"]\s*,?\s*\}/gu) ?? [];
    if (questionObjects.length !== 10) {
      failures.push(`${quizPath}: expected exactly ten {title, autopilot, critical} question objects, found ${questionObjects.length}`);
    }
    if (!/global\.OrdinaryQuiz\s*=\s*\{\s*mount\s*:\s*mount\s*\}/u.test(quiz)
      && !/window\.OrdinaryQuiz\s*=\s*\{\s*mount\s*:\s*function\s*\(\s*rootElement\s*\)/u.test(quiz)) {
      failures.push(`${quizPath}: missing OrdinaryQuiz.mount(rootElement)`);
    }
    if (!/(?:setAttribute\(\s*['"]type['"]\s*,\s*['"]radio['"]\s*\)|\.type\s*=\s*['"]radio['"])/u.test(quiz)
      || !/(?:setAttribute\(\s*['"]name['"]|\.name\s*=)/u.test(quiz)) {
      failures.push(`${quizPath}: missing native same-name radio controls`);
    }
    if (/\b(?:localStorage|sessionStorage|indexedDB)\b/u.test(quiz)) {
      failures.push(`${quizPath}: quiz answers must stay in memory`);
    }
    if (!quiz.includes('Закрыть тест') || !quiz.includes('Вернуться к тесту') || !quiz.includes('data-quiz-reopen')) {
      failures.push(`${quizPath}: missing semantic close/reopen controls`);
    }

    const canonical = canonicalQuizQuestions(readTextIfFile(rootDir, 'content/course.md') ?? '');
    if (canonical.length === 8) {
      const implemented = implementedQuizQuestions(quiz);
      if (implemented === null || JSON.stringify(implemented) !== JSON.stringify(canonical)) {
        failures.push(`${quizPath}: question wording differs from content/course.md`);
      }
    }
  }

  return failures;
}

function canonicalQuizQuestions(markdown) {
  const lines = markdown.split(/\r?\n/u);
  const start = lines.findIndex((line) => line.startsWith('## Тесты:'));
  const end = lines.findIndex((line, index) => index > start && line.startsWith('### Как читать результат'));
  if (start === -1 || end === -1) return [];
  const questions = [];
  for (let index = start + 1; index < end; index += 1) {
    const title = /^\*\*\d+\. (.+)\*\* \*\([^)]+\)\*$/u.exec(lines[index])?.[1];
    if (!title) continue;
    const autopilot = /^- 🔘 \*\*Автопилот:\*\* (.+)$/u.exec(lines[index + 1])?.[1];
    const critical = /^- 🔘 \*\*Критическое:\*\* (.+)$/u.exec(lines[index + 2])?.[1];
    if (autopilot && critical) questions.push({ title, autopilot, critical });
  }
  return questions;
}

function implementedQuizQuestions(source) {
  const instrumented = source.replace(
    /global\.OrdinaryQuiz\s*=/u,
    'global.__ordinaryQuestions = questions; global.OrdinaryQuiz =',
  );
  if (instrumented === source) return null;
  const window = {};
  window.window = window;
  try {
    vm.runInNewContext(instrumented, { window }, { timeout: 1000 });
    return JSON.parse(JSON.stringify(window.__ordinaryQuestions));
  } catch {
    return null;
  }
}

function verifyProgressContract(rootDir) {
  const failures = [];
  const progressPath = 'assets/js/progress.js';
  const progress = readTextIfFile(rootDir, progressPath);
  if (progress !== null) {
    for (const method of ['read', 'visit', 'complete', 'clear']) {
      if (!new RegExp(`\\b${method}\\s*:`, 'u').test(progress)) {
        failures.push(`${progressPath}: missing CourseProgress method: ${method}`);
      }
    }
    if (!progress.includes('ordinary-self-progress-v1')) {
      failures.push(`${progressPath}: missing ordinary-self-progress-v1 storage key`);
    }
    if (!/try\s*\{[\s\S]*?localStorage[\s\S]*?\}\s*catch/u.test(progress)) {
      failures.push(`${progressPath}: localStorage access must be guarded by try/catch`);
    }
  }

  const sitePath = 'assets/js/site.js';
  const site = readTextIfFile(rootDir, sitePath);
  if (site !== null) {
    const continueTargets = new Map([
      ['index', 'module-1.html'],
      ['module-1', 'escapes.html'],
      ['escapes', 'module-2.html'],
      ['module-2', 'module-3.html'],
      ['module-3', 'module-4.html'],
      ['module-4', 'module-5.html'],
      ['module-5', 'beauty.html'],
      ['beauty', 'health.html'],
      ['health', 'module-6.html'],
      ['module-6', 'sex.html'],
      ['sex', 'grief.html'],
      ['grief', 'week.html'],
      ['week', 'finale.html'],
      // Финал — конец маршрута: «продолжить» с него никуда не ведёт, поэтому ключа нет.
    ]);
    const hasCompleteMap = [...continueTargets].every(([slug, relativeUrl]) => new RegExp(
      `(?:['"]${slug}['"]|\\b${slug}\\b)\\s*:\\s*['"]${relativeUrl.replace('.', '\\.')}['"]`,
      'u',
    ).test(site));
    const finaleIsTerminal = !/finales*:s*['"]/u.test(site);
    if (!site.includes('[data-continue-link]') || !hasCompleteMap || !finaleIsTerminal) {
      failures.push(`${sitePath}: missing relative continue-link map`);
    }
  }

  for (const relativePath of requiredPages) {
    const source = readTextIfFile(rootDir, relativePath);
    if (source === null) continue;
    const slug = path.basename(relativePath, '.html');
    if (!new RegExp(`<body\\b[^>]*\\bdata-page-kind\\s*=\\s*["']course["']`, 'iu').test(source)) {
      failures.push(`${relativePath}: missing data-page-kind="course"`);
    }
    if (!new RegExp(`<body\\b[^>]*\\bdata-course-slug\\s*=\\s*["']${slug}["']`, 'iu').test(source)) {
      failures.push(`${relativePath}: missing data-course-slug="${slug}"`);
    }
    for (const target of ['data-progress-count', 'data-mark-complete', 'data-continue-link']) {
      if (!source.includes(target)) failures.push(`${relativePath}: missing ${target} progress hook`);
    }
  }

  return failures;
}

export function verifyStaticAssets(rootDir) {
  const failures = [...requiredPaths, ...requiredPages, ...requiredLetterPages]
    .filter((relativePath) => {
      try {
        return !fs.statSync(path.join(rootDir, relativePath)).isFile();
      } catch {
        return true;
      }
    })
    .map((relativePath) => `Missing: ${relativePath}`);

  const variables = readTextIfFile(rootDir, 'assets/css/variables.css');
  const siteCss = readTextIfFile(rootDir, 'assets/css/site.css');
  if (variables) {
    const declarations = parseCssRules(variables).flatMap((rule) => parseDeclarations(rule.body));
    for (const [property, value] of requiredTokens) {
      if (!declarations.some((declaration) => declaration.property === property && declaration.value === value)) {
        failures.push(`Missing design token: ${property}: ${value}`);
      }
    }
  }

  const theme = readTextIfFile(rootDir, 'assets/css/theme.css');
  if (theme) {
    const primaryRules = parseCssRules(theme).filter((rule) => rule.selector
      .split(',')
      .some((selector) => selector.trim().includes('.button--primary')));
    if (!primaryRules.length) {
      failures.push('Missing primary button rule: .button--primary');
    } else if (primaryRules
      .flatMap((rule) => parseDeclarations(rule.body))
      .filter((declaration) => declaration.property === 'background' || declaration.property === 'background-color' || declaration.property === 'background-image')
      .some((declaration) => containsHighlighterYellow(declaration.value, customProperties(variables ?? '', theme)))) {
      failures.push('Primary button background must not use Highlighter Yellow');
    }
  }

  const cssSources = [
    { relativePath: 'assets/css/variables.css', source: variables },
    { relativePath: 'assets/css/theme.css', source: theme },
    { relativePath: 'assets/css/site.css', source: siteCss },
  ];
  failures.push(...verifyCssPolicy(cssSources));

  for (const relativePath of ['index.html', ...requiredPages, ...requiredLetterPages]) {
    const source = readTextIfFile(rootDir, relativePath);
    if (source !== null) failures.push(...verifyDocumentPolicy(relativePath, source, cssSources));
  }

  for (const relativePath of requiredPages) {
    const source = readTextIfFile(rootDir, relativePath);
    if (source !== null) failures.push(...verifyCoursePage(rootDir, relativePath, source));
  }

  failures.push(...verifyProgressContract(rootDir));
  failures.push(...verifyLandingContract(rootDir));

  return failures;
}

const isDirectRun = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectRun) {
  const failures = verifyStaticAssets(process.cwd());
  if (failures.length) {
    console.error(failures.join('\n'));
    process.exitCode = 1;
  } else {
    console.log('Static asset inventory: PASS');
    console.log('Course page graph: PASS');
    console.log('Progress contract: PASS');
    console.log('Landing and quiz contract: PASS');
    console.log('Offline and document policy: PASS');
    console.log('Local MVP verification: PASS');
  }
}
