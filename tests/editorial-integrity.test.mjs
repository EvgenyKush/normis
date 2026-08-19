import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { collectEditorialMetrics, compareEditorialMetrics } from '../scripts/editorial-baseline.mjs';

const rootDir = path.resolve(import.meta.dirname, '..');
const coursePath = path.join(rootDir, 'content', 'course.md');
const landingPath = path.join(rootDir, 'content', 'landing.html');
const quizPath = path.join(rootDir, 'assets', 'js', 'quiz.js');
const baselinePath = path.join(rootDir, 'docs', 'editorial', 'baseline.json');
const collectorPath = path.join(rootDir, 'scripts', 'editorial-baseline.mjs');
const reportPath = path.join(rootDir, 'docs', 'editorial', '2026-08-18-editorial-report.md');
const part1ClaimsPath = path.join(rootDir, 'docs', 'editorial', 'claims-part-1.md');
const part2ClaimsPath = path.join(rootDir, 'docs', 'editorial', 'claims-parts-2-3.md');
const chartDir = path.join(rootDir, 'assets', 'charts');
const requiredMetricKeys = [
  'parts',
  'modules',
  'headings',
  'practices',
  'quizSituations',
  'finaleHeadings',
  'chartReferences',
  'paragraphs',
  'words',
  'headingTexts',
];
const baselineSha256 = 'f6c3243cbfbba713d3024a1be5025508d2d3aaa3ecad5ac1ba94f2f8129a3fba';
const part1PracticeItemsSha256 = 'f6d1956ebf15f7834e6851f7972daf1642f22e67399b2f9bb127df0004b27a44';
const part1PracticeLabelsSha256 = 'e8b38bc642448421048d8b87aa707eeed1d862d68b27bcc5797995ec1e55954f';
const part1AddictionHelpSha256 = 'ba1a2349a246971a78504919e96f7fc502725d7516fdaa8212fbab344efb8464';
// Пересмотрен вместе со снятием аппарата оговорок из прозы: два упражнения
// части II несли служебные пояснения для проверяющего, теперь их нет.
const part2PracticeItemsSha256 = 'f99c2625fc538a48f34e27d858b3dc9a8c8522023deb8ae2d3af542345ab05f2';
const frozenCanonicalInputs = new Map([
  ['content/landing.html', 'ee5583ffc1ba5f128385b63edc52b54604370b7ce85bd3713a112e930dcf1cf7'],
  ['scripts/build-site.ps1', 'c0ab60fba5008be7ddf660a5d56fdc8f8f7298e0a5f41a8bddd560648c5c53e9'],
]);
const generatedPages = [
  "index.html",
  "support.html",
  "course/index.html",
  "course/module-1.html",
  "course/escapes.html",
  "course/module-2.html",
  "course/module-3.html",
  "course/module-4.html",
  "course/module-5.html",
  "course/beauty.html",
  "course/health.html",
  "course/module-6.html",
  "course/sex.html",
  "course/grief.html",
  "course/week.html",
  "course/finale.html",
  "letters/index.html",
  "letters/letter-1.html",
  "letters/letter-2.html",
  "letters/letter-3.html",
  "letters/letter-4.html",
  "letters/letter-5.html",
  "letters/letter-6.html",
];
const part1HeadingTexts = [
  'Достаточная версия себя',
  'Курс о жизни без проекта по самоулучшению',
  'ЧАСТЬ I. АНАТОМИЯ НЕДОСТАТОЧНОСТИ',
  'Модуль 1. Механизмы: кто и чем производит недостаточность',
  'Деконструкция мифа: кому выгодна «лучшая версия тебя»',
  'Механика соцсетей: конвейер, на котором собирают твою недостаточность',
  'Как это снижает тревожность: механика защиты от внешнего давления',
  'Эмоциональные качели и чёрно-белое мышление: спусковой крючок ошибок',
  'Манипуляции стыдом: рычаг, которым двигают всё остальное',
  'Магическое мышление: причинность, которой нет',
  'Манифестация: магическое мышление, прошедшее ребрендинг',
  'Справедливости нет: увольнение небесной бухгалтерии',
  '«Вселенной видней»: мода на снятое авторство',
  'Религиозные установки: самый старый слой прошивки',
  'Поколенческая память: установки, пережившие свою эпоху',
  'Эйджизм: расписание жизни, которое ты не составлял',
  'Ожидание прайм-эры: жизнь, отложенная до лучшей версии',
  'ИИ-тревога: новое «в твоём возрасте уже пора»',
  'Долженствования: грамматика, на которой написаны все прошивки',
  'Именем Фрейда: как псевдопсихология торгует великими',
  'Прогревы и гивы: драматургия вместо содержания',
  'Человек ошибающийся: кого из успешных стоит слушать',
  'Проверять приходится почти всё: мир, в котором дешевле соврать',
  'FOMO: страх упущенного и религия упущенной выгоды',
  'Практика недели',
  'ПОБЕГИ: КУДА БЕЖИТ НЕДОСТАТОЧНОСТЬ',
  'Геймификация всего: иллюзия победы вместо жизни',
  'Гэмблинг: когда «быстро решить всё» становится способом всё потерять',
  'Химическая анестезия: алкоголь, никотин и решения, принятые не тобой',
  'Чем регулировать вместо анестезии: копинг-стратегии, которые не выставляют счёт',
  'Карта замен: вредные копинги и чем их тренировочно заменять',
  'Трудоголизм: побег, за который ещё и платят',
  'Жизнь как в рекламе: произведённый рай и что продают рядом с ним',
  'Детская и взрослая позиция: что здесь язык, а что механизм',
  'Удобный человек: лучшая версия себя для всех, кроме себя',
  'Практика недели',
];
const part1ExampleAnchors = [
  'Похудел — теперь «рельеф». Начал бегать — теперь марафон.',
  'Лента ранжирует видео по сигналам взаимодействия',
  'Игровое расстройство признано ВОЗ',
  'Сильные эмоции могут быть связаны с импульсивными рискованными решениями',
  'После алкоголя возрастает риск решений с вредными последствиями',
  'Медленное дыхание может менять частоту и вариабельность сердечного ритма',
  'Проблемное отношение к тренировкам бывает трудно распознать',
  'Пониженное настроение или утрата интереса большую часть дня почти ежедневно не менее двух недель',
  'Согласно академической биографии, после примерно шести лет поисков и практик',
  'Оцени вебинар по доле проверяемого содержания и прозрачности предложения',
  'После намеренного пропуска можно проверить, что именно было потеряно',
];
const part2ThroughFinaleHeadingTexts = [
  "ЧАСТЬ II. ПРАКТИКА ДОСТАТОЧНОСТИ",
  "Модуль 2. Самоописание: инвентаризация без улучшений",
  "Идея",
  "Базовые ценности: чем меряться, когда перестал меряться чужим",
  "Шесть областей описи: что именно писать",
  "Три места, где опись не пишется",
  "Зачем это нужно дальше",
  "Практика недели",
  "Модуль 3. Достаточность: у «хватит» есть число",
  "Идея",
  "Быстрая радость и медленное счастье: два разных вещества",
  "Почему это ценно",
  "Четыре сферы: как это звучит на практике",
  "Когда порог пройден, а легче не стало",
  "Когда порог пора менять, а когда это бегство",
  "Достаточно информации: единственная сфера, где порог ставят почти все",
  "Практика недели",
  "Модуль 4. Плато: мастерство выглядит как застой",
  "Идея",
  "Почему это ценно",
  "Плато в отношениях: когда «искра ушла»",
  "Плато в работе: восьмой год на том же месте",
  "Плато в теле: возраст, который перестал быть проектом",
  "Практика недели",
  "Скука и умение быть с собой",
  "Режим: скучнейшее слово, держащее всё",
  "Модуль 5. Взаимоотношения: обычность как связь",
  "Идея",
  "Родительский авторитет: голос, который стал внутренним",
  "Достаточно хороший родитель: индустрия недостаточности в квадрате",
  "Гендерные роли: «должен» и «должна», выданные до рождения",
  "Иллюзия выбора: почему бесконечный каталог мешает выбрать",
  "Дружба взрослого человека: почему она рассыпается тише всего",
  "Как говорить о трудном: три хода вместо одного разговора",
  "Границы: как отказывать тем, кого любишь",
  "Почему это ценно",
  "Практика недели",
  "КРАСОТА И ВНЕШНОСТЬ",
  "Как производится дефект: планка, которой нет ни у кого",
  "Что происходит с восприятием: обе стороны сравнения искажены",
  "Кто на этом зарабатывает и какими приёмами",
  "Тело, еда и вес: норма, объявленная отклонением",
  "Отдельный случай: когда спорт перестаёт быть твоим",
  "Возраст: старение как поломка, требующая ремонта",
  "Практика недели",
  "ЗДОРОВЬЕ: СОН, МОНИТОРИНГ, ПСИХОСОМАТИКА",
  "Сон: как забота о нём начала ему мешать",
  "Биохакинг и медикализация нормы: тело как вечный пациент",
  "Психосоматика: где связь есть и где её дорисовали",
  "Практика недели",
  "ЧАСТЬ III. ЭКОНОМИКА ОБЫЧНОЙ ЖИЗНИ",
  "Модуль 6. Финансы: экономика недостаточности",
  "Идея",
  "Часть 1. Почему квартира стала недосягаемой: смена условий, а не поколение лентяев",
  "Часть 2. Кредитная кабала: механика и психология",
  "Часть 3. План выхода: погашение и профилактика",
  "Часть 4. Жить по доходам: сокращение расходов без аскезы",
  "Часть 5. Быстрые деньги: две истории с одинаковым концом",
  "Часть 6. Работа и призвание: карьера как сдвигающаяся планка",
  "Эффект невозвратных затрат: почему трудно выйти из плохого",
  "Почему это ценно",
  "Деньги и счастье: что честно говорят данные",
  "Практика недели",
  "Тесты: как я обычно поступаю vs как я бы поступил с критическим мышлением",
  "Как читать результат",
  "СЕКС",
  "Числа, которых боятся: частота, длительность, размер",
  "Желание: не кнопка и не постоянная величина",
  "Гендерные перекосы: чей оргазм считается финалом",
  "Когда недостаточность становится идеологией",
  "Порно, реклама и стыд: три поставщика ожиданий",
  "Практика недели",
  "ГОРЕ, УТРАТА, КОНЕЧНОСТЬ",
  "Пять стадий, которых нет",
  "Что берут у выживших — и что при этом теряют",
  "Потери, на которые не выдают разрешения",
  "Что продаётся вокруг утраты",
  "Конечность как аргумент этого курса",
  "Практика недели",
  "НЕДЕЛЯ ОБЫЧНОГО ЧЕЛОВЕКА",
  "Что делать после прочтения: маршрут на 7 дней",
  "ФИНАЛ",
  "Авторство: руль, который никто не отдаст сам",
  "Амнистия: что делать с уже наделанным",
  "Когда всё нормально: инструкция к хорошим временам",
  "Выпускной тезис: версия Pure",
  "Ты уже встречал версию Pure. Это был ты",
  "Практика финала",
];
const part2PracticeLabels = [
  'Список из пяти.',
  'Проверка тремя вопросами.',
  'Дата и напоминание.',
  'Факт-лист из 30 пунктов',
  'Редактура языка.',
  'Чтение вслух.',
  'Контр-подтверждение.',
  'Дневник двух контуров.',
  'Один обмен.',
  'Определи «достаточно» в четырёх сферах:',
  'Аудит.',
  'Одна настоящая нехватка.',
  'Список владений.',
  'Переименование.',
  'Плато-наблюдение.',
  'Три минуты скуки.',
  'Одно свидание с собой.',
  'Один элемент режима.',
  'Ревизия «должен в его возрасте».',
  'Час обычного времени.',
  'Один срыв — одна починка.',
  'Три «должен» по признаку пола.',
  'Тест на подстановку.',
  'Одно оставленное.',
  'Тест трёх страниц.',
  'Одна обычная деталь в профиль.',
  'Проверка иллюзии в быту.',
  'Ревизия пожухших участков.',
  'Одно признание.',
  'Инвентарь связей.',
  'Приём чужой обычности.',
  'Аудит языка тренировок.',
  'Тест дня отдыха.',
  'Одна тренировка версии Pure.',
  'Аудит референса.',
  'Неделя без правки.',
  'Тест на мотив.',
  'Разделить две цели.',
  'Неделя без баллов.',
  'Тест на заказчика.',
  'Одна нецелевая прогулка.',
  'Одна неделя без числа.',
  'Тест на разубеждение.',
  'Один заказчик.',
  'Своё «достаточно» для работы.',
  'Аудит источника «надо расти».',
  'Список владений на работе.',
  'Аудит двух отделов.',
  'Одна закупка в правильном отделе.',
  'Опись долга и трат',
  'Три списка расходов',
  'Правило 72 часов',
  'Один автоперевод',
  'Один вопрос вслух.',
  'Ревизия источника ожиданий.',
  'Одна отменённая обязанность.',
  'Одно неотложенное.',
  'Ревизия наследства.',
  'Одно поддержание.',
  'Что останется.',
  'Вечерний вопрос руля.',
  'Одно последствие — достойно.',
  'Ревизия переложенного.',
  'Одно дело — к закрытию.',
  'Ловушка пересмотра.',
  'Журнал нормальности.',
  'Один акт обслуживания.',
  'Архив Pure.',
  'Один час без цели.',
  'Плохо и с удовольствием.',
];
const part2ExampleAnchors = [
  'бабушка с её пирогами',
  'очередь, остановка, просто стул',
  'варю борщ по воскресеньям и досматриваю плохие сериалы из принципа',
  'вычерпать море кружкой',
  '990 × 24 = 23 760',
  'pura vida буквально значит',
  'В докладе за 2026 год Коста-Рика занимает 4-е место',
  'Доступность жилья нужно сравнивать по конкретной стране',
];
const part2QuizTitles = [
  '1. Лента показала ровесника: дом, машина, «наконец-то сбылось»',
  '2. Реклама курса: «Освой профессию за 3 месяца и выйди на доход мечты»',
  '3. «Всего 990 в месяц, первый платёж через 30 дней»',
  '4. Внезапная премия',
  '5. Друг рассказывает, что не справляется и всё запустил',
  '6. Третий год без повышения, лента полна чужих карьерных скачков',
  '7. Вечер свободен. Внезапно — никаких дел',
  '8. «Успей до конца дня! Осталось 2 места / 3 штуки / 4 часа»',
  // Дополнение теста: страницы курса, которых в нём не было вовсе.
  '9. Утром в зеркале лицо не то, что вчера на фото',
  '10. У знакомого умер близкий; прошло полгода, а он всё ещё «не в порядке»',
];
const relocatedClaimLocations = new Map([
  // локация → куда переехала при структурной сборке
  ['Родительский авторитет', 'модуль 5 «Взаимоотношения»'],
  ['Отдельный случай: спорт', 'страница «Красота и внешность»'],
  ['Спорт', 'страница «Красота и внешность»'],
]);
const retiredClaimLocations = new Map([
  // локация → решение, которым удалено её единственное утверждение
  ['Почему это ценно понять', 'F-006'],
]);
const claimLocationHeadings = new Map([
  ['Введение', '# Достаточная версия себя'],
  ['Деконструкция мифа', '### Деконструкция мифа:'],
  ['Почему это ценно понять', '### Почему это ценно понять'],
  ['Механика соцсетей', '### Механика соцсетей:'],
  ['Практика соцсетей', '### Механика соцсетей:'],
  ['Геймификация всего', '### Геймификация всего:'],
  ['Геймификация', '### Геймификация всего:'],
  ['Гэмблинг', '### Гэмблинг:'],
  ['Защита от внешнего давления', '### Как это снижает тревожность:'],
  ['Эмоциональные качели', '### Эмоциональные качели и чёрно-белое мышление:'],
  ['Химическая анестезия', '### Химическая анестезия:'],
  ['Копинг', '### Чем регулировать вместо анестезии:'],
  ['Карта замен', '### Карта замен:'],
  ['Отдельный случай: спорт', '### Отдельный случай:'],
  ['Спорт', '### Отдельный случай:'],
  ['Трудоголизм', '### Трудоголизм:'],
  ['Удобный человек', '### Удобный человек:'],
  ['Манипуляции стыдом', '### Манипуляции стыдом:'],
  ['Магическое мышление', '### Магическое мышление:'],
  ['Манифестация', '### Манифестация:'],
  ['Справедливости нет', '### Справедливости нет:'],
  ['Религиозные установки', '### Религиозные установки:'],
  ['Поколенческая память', '### Поколенческая память:'],
  ['Родительский авторитет', '### Родительский авторитет:'],
  ['Эйджизм', '### Эйджизм:'],
  ['Ожидание прайм-эры', '### Ожидание прайм-эры:'],
  ['Долженствования', '### Долженствования:'],
  ['Именем Фрейда', '### Именем Фрейда:'],
  ['Прогревы', '### Прогревы и гивы:'],
  ['FOMO', '### FOMO:'],
]);
function part1Text(courseText) {
  const part2Boundary = courseText.search(/^# ЧАСТЬ II\./mu);
  assert.notEqual(part2Boundary, -1, 'course contains the Part II boundary');
  return courseText.slice(0, part2Boundary);
}

function part2ThroughEofText(courseText) {
  const part2Boundary = courseText.search(/^# ЧАСТЬ II\./mu);
  assert.notEqual(part2Boundary, -1, 'course contains the Part II boundary');
  return courseText.slice(part2Boundary);
}

function plainProse(text) {
  return text.replace(/\[\?([^:\]]+):\s*[^\]]+\]/gu, '$1');
}

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function normalizedClaimText(value) {
  return value
    .normalize('NFC')
    .toLocaleLowerCase('ru')
    .replace(/[–—]/gu, '—')
    .replace(/\s*([/=])\s*/gu, '$1')
    .replace(/\s+/gu, ' ')
    .trim();
}

function claimWords(value) {
  return [...normalizedClaimText(value).matchAll(/[a-zа-яё0-9-]+/giu)].map((match) => match[0]);
}

const semanticClaimStopWords = new Set([
  'который', 'которая', 'которое', 'которые', 'чтобы', 'этого', 'этой', 'этот', 'есть',
  'после', 'только', 'может', 'является', 'становится', 'своим', 'свою', 'свои', 'одно',
  'одна', 'один', 'всем', 'всех', 'потому', 'также', 'между', 'тогда', 'самым', 'самая',
  'самой', 'было', 'были', 'быть', 'когда', 'очень', 'через', 'обычно', 'именно',
  'текста', 'утверждению',
]);

function semanticClaimTerms(value) {
  return new Set(claimWords(value)
    .filter((word) => word.length >= 5 && !semanticClaimStopWords.has(word))
    .map((word) => word.slice(0, 6)));
}

function claimRows() {
  return fs.readFileSync(part1ClaimsPath, 'utf8')
    .split(/\r?\n/u)
    .filter((line) => /^\| P1-\d{3} \|/u.test(line))
    .map((line) => line.split('|').slice(1, -1).map((cell) => cell.trim()));
}

function part2ClaimRows() {
  return fs.readFileSync(part2ClaimsPath, 'utf8')
    .split(/\r?\n/u)
    .filter((line) => /^\| P2-\d{3} \|/u.test(line))
    .map((line) => line.split('|').slice(1, -1).map((cell) => cell.trim()));
}

function markdownTableCells(line) {
  return line
    .split(' | ')
    .map((cell, index, cells) => {
      if (index === 0) return cell.replace(/^\| /u, '');
      if (index === cells.length - 1) return cell.replace(/ \|$/u, '');
      return cell;
    });
}

function factRegisterRows() {
  return fs.readFileSync(reportPath, 'utf8')
    .split(/\r?\n/u)
    .filter((line) => /^\| F-\d{3} \|/u.test(line))
    .slice(0, 453)
    .map(markdownTableCells);
}

function factAuditRows() {
  const report = fs.readFileSync(reportPath, 'utf8');
  const section = report.slice(
    report.indexOf('### Аудиторские привязки реестра'),
    report.indexOf('### Реестр точных исходных якорей'),
  );
  return section.split(/\r?\n/u)
    .filter((line) => /^\| F-\d{3} \|/u.test(line))
    .map(markdownTableCells);
}

function exactAnchorRows() {
  const report = fs.readFileSync(reportPath, 'utf8');
  const section = report.slice(
    report.indexOf('### Реестр точных исходных якорей'),
    report.indexOf('### Интегрированные патчи общих исходных span'),
  );
  return section.split(/\r?\n/u)
    .filter((line) => /^\| A-(?:C-\d{3}|P2-\d{3}) \|/u.test(line))
    .map(markdownTableCells);
}

function inventoryMapRows(inventoryPath, prefix) {
  return fs.readFileSync(inventoryPath, 'utf8')
    .split(/\r?\n/u)
    .filter((line) => new RegExp(`^\\| \x60${prefix}-\\d{3}\x60 \\|`, 'u').test(line))
    .map(markdownTableCells)
    .map((row) => row.map((cell) => cell.replace(/^`|`$/gu, '')));
}

function exactBeforeText(anchorRow) {
  const match = /^⟦([\s\S]*)⟧$/u.exec(anchorRow[2]);
  assert.ok(match, `${anchorRow[0]} wraps exact before text in ⟦…⟧`);
  return match[1];
}

function replacementText(decision) {
  const replacementIndex = decision.toLocaleLowerCase('ru').lastIndexOf('заменить');
  assert.notEqual(replacementIndex, -1, `decision contains a replacement instruction: ${decision}`);
  const match = /«([\s\S]+)»/u.exec(decision.slice(replacementIndex));
  assert.ok(match, `replacement instruction contains approved course-ready wording: ${decision}`);
  return match[1];
}

function distinctiveReplacementPhrases(value) {
  const words = value.split(/\s+/u);
  const width = Math.min(6, words.length);
  return [...new Set([
    words.slice(0, width).join(' '),
    words.slice(-width).join(' '),
  ].map((phrase) => phrase.replace(/[.,;:!?]+$/u, '')))];
}

const highRiskClaim = /(?:\d|%|процент|половин|тысяч|миллиард|десятк|большинств|меньше|больше|чаще|реже|всегда|никогда|единствен|сам(?:ый|ая|ое)|сниж|повыш|усил|ослаб|привод|вызыва|формир|порож|созда|превращ|помога|влия|из-за|потому|делает|склеива|лишает|блокир|работает|служит|выполняет|отличает|даёт|подталкива|возвраща|разруша|убива|гасит|увелич|уменьш|диагноз|диагност|признак|маркер|индикатор|симптом|расстрой|зависим|лечен|медицин|безопас|опасн|риск|алкогол|никотин|сон)/iu;
const explicitUniversal = /(?:^|[^\p{L}])(?:все|всё|всегда|никогда|любой|любая|любое|любые|каждый|каждая|каждое|каждые|полностью|гарантирован(?:но|ный|ная|ное|ные)?|неизбежн(?:о|ый|ая|ое|ые)?|не существует|не бывает)(?=$|[^\p{L}])/iu;
const genericUniversal = /^[А-ЯЁ][^.!?;:]{0,100}\s(?:является|являются|представляет|представляют|состоит|состоят|делится|делятся|измеряет|измеряют|пере[а-яё-]+|образует|образуют|формирует|формируют|создаёт|создают|вызывает|вызывают|приводит|приводят|определяет|определяют|работает|работают|служит|служат|скрывает|скрывают|лишает|лишают|блокирует|блокируют|порождает|порождают|повышает|повышают|снижает|снижают|отличается|отличаются|имеет|имеют|даёт|дают)(?=$|[^\p{L}])/iu;
const clearlyScopedOrAttributed = /(?:^|[^\p{L}])(?:может|могут|иногда|часто|обычно|как правило|в среднем|часть|некоторые|вероятно|с высокой вероятностью|по данным|задокументирован(?:о|ный|ная|ное)?|Карен Хорни|Фрейд|Будда|Ницше|Марк Аврелий)(?=$|[^\p{L}])/iu;

function assertClaimRiskPolicy([id, , claim, risk]) {
  if (highRiskClaim.test(claim)) assert.equal(risk, 'high', `${id} causal/diagnostic/quantitative/treatment/safety claim is high risk`);
  if (explicitUniversal.test(claim)) {
    assert.equal(risk, 'high', `${id} explicit Russian universal claim is high risk`);
  }
  if (genericUniversal.test(claim) && !clearlyScopedOrAttributed.test(claim)) {
    assert.equal(risk, 'high', `${id} unscoped Russian generic/universal claim is high risk`);
  }
  if (risk !== 'high') {
    assert.match(claim, clearlyScopedOrAttributed, `${id} non-high claim is explicitly scoped or attributed`);
  }
}

function assertPart2ClaimRiskPolicy([id, , , , claim, risk]) {
  if (id === 'P2-226') {
    assert.equal(risk, 'medium', 'P2-226 is exact arithmetic duplicated from the disclosed model');
    return;
  }
  if (highRiskClaim.test(claim)) assert.equal(risk, 'high', `${id} causal/diagnostic/quantitative/treatment/safety claim is high risk`);
  if (explicitUniversal.test(claim)) {
    assert.equal(risk, 'high', `${id} explicit Russian universal claim is high risk`);
  }
  if (genericUniversal.test(claim) && !clearlyScopedOrAttributed.test(claim)) {
    assert.equal(risk, 'high', `${id} unscoped Russian generic/universal claim is high risk`);
  }
}

function part1PracticeItems(part1) {
  const items = [];
  let inPractice = false;
  for (const line of part1.split(/\r?\n/u)) {
    if (line === '**Дополнение к практике недели:**' || line === '### Практика недели') {
      inPractice = true;
      continue;
    }
    if (inPractice && line.startsWith('- ')) {
      items.push(line);
      continue;
    }
    if (inPractice && line.trim() !== '') inPractice = false;
  }
  return items;
}

function part2PracticeItems(part2ThroughEof) {
  const items = [];
  let inPractice = false;
  for (const line of part2ThroughEof.split(/\r?\n/u)) {
    if (['**Дополнение к практике недели:**', '### Практика недели', '**Практика:**', '**Практика финала:**', '### Практика финала'].includes(line)) {
      inPractice = true;
      continue;
    }
    if (inPractice && line.startsWith('- ')) {
      items.push(line);
      continue;
    }
    if (inPractice && line.trim() !== '') inPractice = false;
  }
  return items;
}

test('editorial baseline collector records the current structural contract', () => {
  const metrics = collectEditorialMetrics(
    fs.readFileSync(coursePath, 'utf8'),
    fs.readFileSync(landingPath, 'utf8'),
  );

  assert.deepEqual(Object.keys(metrics), requiredMetricKeys);
  assert.equal(metrics.parts, 3);
  assert.equal(metrics.modules, 6);
  assert.equal(metrics.practices, 15);
  assert.equal(metrics.quizSituations, 8);
  assert.equal(metrics.chartReferences, 4);
  assert.equal(metrics.finaleHeadings, 7);
  assert.deepEqual(metrics.headingTexts.slice(-7), [
    'ФИНАЛ',
    'Авторство: руль, который никто не отдаст сам',
    'Амнистия: что делать с уже наделанным',
    'Когда всё нормально: инструкция к хорошим временам',
    'Выпускной тезис: версия Pure',
    'Ты уже встречал версию Pure. Это был ты',
    'Практика финала',
  ]);
});

test('immutable baseline is the exact UTF-8 JSON snapshot in the prescribed key order', () => {
  const baselineBytes = fs.readFileSync(baselinePath);
  const baselineText = baselineBytes.toString('utf8');
  assert.equal(baselineText.startsWith('\uFEFF'), false, 'baseline has no UTF-8 BOM');
  const baseline = JSON.parse(baselineText);

  assert.deepEqual(Object.keys(baseline), requiredMetricKeys);
  assert.equal(baselineText, `${JSON.stringify(baseline, null, 2)}\n`);
  assert.equal(crypto.createHash('sha256').update(baselineBytes).digest('hex'), baselineSha256);
});

test('current sources preserve the frozen structural baseline while prose metrics may change', () => {
  const baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
  const courseText = fs.readFileSync(coursePath, 'utf8');
  const landingText = fs.readFileSync(landingPath, 'utf8');
  const current = collectEditorialMetrics(courseText, landingText);

  const authorizedStructuralChanges = ['headings', 'practices', 'finaleHeadings', 'chartReferences', 'headingTexts'];
  assert.deepEqual(compareEditorialMetrics(baseline, current, { allowTextChange: true }), authorizedStructuralChanges);
  assert.equal(current.chartReferences, 4, 'PNG 01 is replaced by accessible text');
  // +42 — структурная сборка; ещё +11 — разделы, которыми достроена часть II
  // (шесть областей описи, четыре сферы «достаточно», плато в трёх областях,
  // дружба и разговор о трудном).
  assert.equal(current.headings, baseline.headings + 55, 'structural work and the Part II build-out add their reviewed headings');
  assert.equal(current.practices, baseline.practices + 7, 'the merged finale chapters and the escapes page add their own practice blocks');
  assert.equal(current.finaleHeadings, baseline.finaleHeadings + 2, 'both merged finale chapters sit inside ФИНАЛ');
  const registeredHeadingChanges = new Map([
    // Переименование курса: заголовок канона следует за названием.
    ['Обычная версия себя', 'Достаточная версия себя'],
    ['Скука и умение быть с собой: вымирающие навыки', 'Скука и умение быть с собой'],
    // Структурная сборка: модули названы своим предметом.
    ['Модуль 5. Обычность как связь: исключительность изолирует', 'Модуль 5. Взаимоотношения: обычность как связь'],
    ['Модуль 6. Экономика недостаточности: почему «не тянешь» — это не про тебя', 'Модуль 6. Финансы: экономика недостаточности'],
    ['Модуль 1 (он же вся часть I)', 'Модуль 1. Механизмы: кто и чем производит недостаточность'],
    ['Модуль 2. Инвентаризация без улучшений: увидеть себя не как черновик', 'Модуль 2. Самоописание: инвентаризация без улучшений'],
    ['Модуль 3. Достаточность вместо оптимизации: у «хватит» есть число', 'Модуль 3. Достаточность: у «хватит» есть число'],
    ['Модуль 4. Право на плато: мастерство выглядит как застой', 'Модуль 4. Плато: мастерство выглядит как застой'],
  ]);
  // Пустые заголовки-остатки: их единственные утверждения удалены фактчекингом (F-006), сами заголовки сняты структурным аудитом.
  const retiredHeadings = new Set(['Почему это ценно понять', 'Почему это ценно']);
  for (const heading of baseline.headingTexts) {
    if (retiredHeadings.has(heading)) continue;
    const expected = registeredHeadingChanges.get(heading) ?? heading;
    assert.ok(current.headingTexts.includes(expected), `merge preserves baseline heading: ${expected}`);
  }
  for (const removed of registeredHeadingChanges.keys()) {
    assert.equal(current.headingTexts.includes(removed), false, `registered decision F-281 removed: ${removed}`);
  }

  const proseOnly = collectEditorialMetrics(
    courseText.replace('Морковка прибита к палке, палка прибита к тебе.', 'Морковка навсегда прибита к палке, палка прибита к тебе.'),
    landingText,
  );
  assert.notEqual(proseOnly.words, baseline.words);
  assert.deepEqual(compareEditorialMetrics(baseline, proseOnly, { allowTextChange: true }), authorizedStructuralChanges);

  const structuralChange = collectEditorialMetrics(
    courseText.replace('# ЧАСТЬ II. ПРАКТИКА ДОСТАТОЧНОСТИ', '# РАЗДЕЛ II. ПРАКТИКА ДОСТАТОЧНОСТИ'),
    landingText,
  );
  assert.ok(compareEditorialMetrics(baseline, structuralChange, { allowTextChange: true }).includes('parts'));
});

test('Part I preserves its boundary, headings, module number, and every practice lead-in', () => {
  const courseText = fs.readFileSync(coursePath, 'utf8');
  const part1 = part1Text(courseText);
  const headings = [...part1.matchAll(/^#{1,6}\s+(.+?)\s*#*\s*$/gmu)].map((match) => match[1]);
  const moduleHeadings = [...part1.matchAll(/^##\s+(Модуль\s+\d+\b.*)$/gmu)].map((match) => match[1]);
  const practiceLeadIns = part1.match(/^\*\*Дополнение к практике недели:\*\*$/gmu) ?? [];

  assert.match(part1, /^# ЧАСТЬ I\. АНАТОМИЯ НЕДОСТАТОЧНОСТИ$/mu);
  assert.match(courseText.slice(part1.length), /^# ЧАСТЬ II\. ПРАКТИКА ДОСТАТОЧНОСТИ$/mu);
  assert.deepEqual(headings, part1HeadingTexts);
  assert.deepEqual(moduleHeadings, ['Модуль 1. Механизмы: кто и чем производит недостаточность']);
  assert.equal(practiceLeadIns.length, 20);
  assert.equal(headings.filter((heading) => heading === 'Практика недели').length, 2);
});

test('Task 5 fact-checking changes Part I only through registered decisions', () => {
  const part1 = part1Text(fs.readFileSync(coursePath, 'utf8'));
  assert.equal(part1PracticeItems(part1).length, 61, 'all Part I practice items remain present');
  assert.ok(part1.includes('Игровое расстройство признано ВОЗ'));
  assert.ok(part1.includes('Медленное дыхание может менять частоту и вариабельность сердечного ритма'));
  assert.doesNotMatch(part1, /Будда двадцать лет сидел под деревом/u);
});

test('canonical inputs stay frozen and every generated page is present and derived', () => {
  for (const [relativePath, expectedSha256] of frozenCanonicalInputs) {
    const fileBytes = fs.readFileSync(path.join(rootDir, ...relativePath.split('/')));
    assert.equal(sha256(fileBytes), expectedSha256, `${relativePath} retains its reviewed bytes`);
  }
  for (const relativePath of generatedPages) {
    const generatedPath = path.join(rootDir, ...relativePath.split('/'));
    assert.ok(fs.existsSync(generatedPath), `${relativePath} is generated`);
    const html = fs.readFileSync(generatedPath, 'utf8');
    assert.doesNotMatch(html, /\{\{[A-Z_]+\}\}/u, `${relativePath} has no unresolved build placeholder`);
  }
});

test('Parts II–III, tests, and finale preserve every heading, module, and chart placement', () => {
  const suffix = part2ThroughEofText(fs.readFileSync(coursePath, 'utf8'));
  const headings = [...suffix.matchAll(/^#{1,6}\s+(.+?)\s*#*\s*$/gmu)].map((match) => match[1]);
  const modules = headings.filter((heading) => /^Модуль [2-6]\./u.test(heading));
  const charts = [...suffix.matchAll(/^!\[([^\]]+)\]\(([^)]+)\)/gmu)].map((match) => `${match[1]} => ${match[2]}`);

  assert.deepEqual(headings, part2ThroughFinaleHeadingTexts);
  assert.deepEqual(modules, [
    'Модуль 2. Самоописание: инвентаризация без улучшений',
    'Модуль 3. Достаточность: у «хватит» есть число',
    'Модуль 4. Плато: мастерство выглядит как застой',
    'Модуль 5. Взаимоотношения: обычность как связь',
    'Модуль 6. Финансы: экономика недостаточности',
  ]);
  assert.deepEqual(charts, [
    'Два авторских способа смотреть на прогресс: «лучше» и «достаточно» => графики/04-лучше-vs-достаточно.png',
    'Один из возможных ритмов обучения: рывки и плато => графики/05-рост-vs-плато.png',
    'Минимальный платёж: иллюстративная траектория долга => графики/02-минимальный-платеж.png',
    'Дробление цены: сложите все платежи => графики/03-дробление-цены.png',
  ]);
  assert.ok(suffix.includes('> **Доступность жилья.**'), 'removed PNG 01 keeps an accessible conceptual location');
});

test('Parts II–III and finale preserve every practice body and concrete example', () => {
  const suffix = part2ThroughEofText(fs.readFileSync(coursePath, 'utf8'));
  const practiceItems = part2PracticeItems(suffix);
  const labels = practiceItems.map((line) => {
    const label = /^- \*\*(.+?)\*\*/u.exec(line)?.[1];
    assert.ok(label, `practice item keeps its bold label: ${line}`);
    assert.ok(line.slice(line.indexOf('**', 4) + 2).trim().length >= 24, `practice item keeps a substantive body: ${label}`);
    return label;
  });

  assert.deepEqual(labels, part2PracticeLabels);
  assert.equal(sha256(practiceItems.join('\n')), part2PracticeItemsSha256, 'all assigned-range practice bodies retain their reviewed text');
  for (const example of part2ExampleAnchors) assert.ok(suffix.includes(example), `assigned range keeps example: ${example}`);
});

test('course keeps all ten quiz situations and both reactions without unvalidated score bands', () => {
  const suffix = part2ThroughEofText(fs.readFileSync(coursePath, 'utf8'));
  const quizStart = suffix.indexOf('## Тесты:');
  const quizEnd = suffix.indexOf('\n---', quizStart);
  assert.ok(quizStart >= 0 && quizEnd > quizStart, 'quiz block has resolvable boundaries');
  const quiz = suffix.slice(quizStart, quizEnd);
  const titles = [...quiz.matchAll(/^\*\*(\d+\. .+?)\*\* \*\([^)]+\)\*$/gmu)].map((match) => match[1]);

  assert.deepEqual(titles, part2QuizTitles);
  assert.equal((quiz.match(/^- 🔘 \*\*Автопилот:\*\*/gmu) ?? []).length, 10);
  assert.equal((quiz.match(/^- 🔘 \*\*Критическое:\*\*/gmu) ?? []).length, 10);
  for (const band of ['**0–2**', '**3–5**', '**6–8**']) assert.equal(quiz.includes(band), false, `quiz removes unvalidated score band ${band}`);
  assert.ok(quiz.includes('### Как читать результат'));
  assert.doesNotMatch(quiz, /названный приём работает вдвое хуже/u);
});

test('finale preserves both arguments, structural circumstances, personal agency, and both practices', () => {
  const suffix = part2ThroughEofText(fs.readFileSync(coursePath, 'utf8'));
  const finale = suffix.slice(suffix.indexOf('# ФИНАЛ'));

  for (const anchor of [
    '## Авторство: руль, который никто не отдаст сам',
    '**Половина первая: руль.**',
    '**Половина вторая, без которой первая — самозванство: последствия.**',
    'Цены на жильё и случайные события относятся к внешним условиям',
    '«Обстоятельства не мои, ходы мои»',
    '**Практика финала:**',
    '## Выпускной тезис: версия Pure',
    '### Ты уже встречал версию Pure. Это был ты',
    '### Практика финала',
  ]) {
    assert.ok(finale.includes(anchor), `finale keeps ${anchor}`);
  }
});

test('edited Parts II–III and finale keep clean Markdown typography and normalized key terms', () => {
  const suffix = part2ThroughEofText(fs.readFileSync(coursePath, 'utf8'));
  const quizSource = fs.readFileSync(quizPath, 'utf8');
  const lines = suffix.split(/\r?\n/u);

  assert.deepEqual(lines.filter((line) => /[ \t]+$/u.test(line)), [], 'assigned range has no trailing whitespace');
  assert.deepEqual(lines.filter((line) => / {2,}/u.test(line)), [], 'assigned range has no doubled spaces');
  assert.deepEqual(lines.filter((line) => /[!?.,;:]{2,}/u.test(line)), [], 'assigned range has no doubled punctuation');
  assert.doesNotMatch(suffix, /\benough\b/iu, 'key term достаточность is no longer mixed with English enough');

  assert.deepEqual(lines.filter((line) => line.includes('"')), [], 'assigned prose has no legacy straight quote marks');
  for (const correctedQuote of ['„достаточно“', '„и у меня так бывает“', '„полезный“', '„зачем“']) {
    assert.ok(suffix.includes(correctedQuote), `course uses the correct inner closing quote in ${correctedQuote}`);
    assert.ok(quizSource.includes(correctedQuote), `quiz source stays synchronized in ${correctedQuote}`);
  }
  assert.ok(suffix.includes('В этом модуле факт отделяется от оценки как рабочий приём'), 'module 2 fact/evaluation contrast is scoped and direct');
  assert.ok(suffix.includes('Сон по стабильному расписанию'), 'module 4 routine example describes stable sleep timing idiomatically');
  assert.doesNotMatch(suffix, /Сон в одни часы/u, 'module 4 no longer uses the strained sleep-timing phrase');
  assert.ok(suffix.includes('работа с понятными границами'), 'module 4 routine example names its boundary practice clearly');
  assert.ok(suffix.includes('это непрокачанный навык выдерживать и чинить конфликт.'), 'module 5 names the promised relationship skill');
  assert.ok(suffix.includes('Достойное принятие последствий своих решений — без перекладывания их'), 'finale consequence sentence has a grammatical subject');
});

test('Part I preserves complete practice bodies, examples, and serious addiction-help passages', () => {
  const part1 = part1Text(fs.readFileSync(coursePath, 'utf8'));
  const practiceItems = part1PracticeItems(part1);
  const practiceLabels = practiceItems.map((line) => {
    const label = /^- \*\*(.+?)\*\*/u.exec(line)?.[1];
    assert.ok(label, `practice item keeps its bold label: ${line}`);
    assert.ok(line.slice(line.indexOf('**', 4) + 2).trim().length >= 24, `practice item keeps a substantive body: ${label}`);
    return label;
  });

  assert.equal(practiceItems.length, 61);
  assert.equal(sha256(practiceItems.join('\n')), part1PracticeItemsSha256);
  assert.equal(sha256(practiceLabels.join('\n')), part1PracticeLabelsSha256);
  const whole = fs.readFileSync(coursePath, 'utf8');
  // Разделы, переехавшие структурной сборкой, проверяем по всему курсу: важно, что пример жив.
  const relocatedExamples = new Set(['Проблемное отношение к тренировкам бывает трудно распознать']);
  for (const example of part1ExampleAnchors) {
    const scope = relocatedExamples.has(example) ? whole : part1;
    assert.ok(scope.includes(example), `курс сохраняет пример: ${example}`);
  }

  const lines = part1.split(/\r?\n/u);
  const helpPassages = [
    lines.find((line) => line.startsWith('**Честная черта.** Всё, что выше')),
    lines.find((line) => line.startsWith('**Честная черта — та же, что в разделе про гэмблинг.**')),
    lines.find((line) => line.startsWith('- **И черта — четвёртая в модуле')),
  ];
  assert.equal(helpPassages.filter(Boolean).length, 3, 'gambling, substance-use, and workaholism help boundaries remain present');
  assert.equal(sha256(helpPassages.join('\n')), part1AddictionHelpSha256);
  for (const passage of helpPassages) {
    assert.match(passage, /(?:специалист|медицин|методы оценки и лечения|обратиться[^.]{0,80}помощ|обращение за помощью)/u);
  }
});

test('Part I does not introduce promotional urgency or scarcity calls to action', () => {
  const part1 = part1Text(fs.readFileSync(coursePath, 'utf8'));
  for (const forbidden of [
    /(?:^|[^\p{L}])купи\s+сейчас(?=$|[^\p{L}])/iu,
    /(?:^|[^\p{L}])запишись\s+сейчас(?=$|[^\p{L}])/iu,
    /(?:^|[^\p{L}])успей\s+(?:купить|записаться|присоединиться)(?=$|[^\p{L}])/iu,
    /(?:^|[^\p{L}])последний\s+шанс(?=$|[^\p{L}])/iu,
    /(?:^|[^\p{L}])мест\s+осталось\s+\d+(?=$|[^\p{L}])/iu,
    /(?:^|[^\p{L}])цена\s+(?:скоро\s+)?(?:вырастет|повысится)(?=$|[^\p{L}])/iu,
  ]) {
    assert.doesNotMatch(part1, forbidden);
  }
});

test('Part I claim inventory has unique sequential IDs and complete searchable fields', () => {
  const inventory = fs.readFileSync(part1ClaimsPath, 'utf8');
  assert.match(inventory, /^\| ID \| location \| claim \| risk \| domain \| search_terms \|$/mu);

  const rows = claimRows();

  assert.equal(rows.length, 222);
  assert.deepEqual(
    rows.map((row) => row[0]),
    Array.from({ length: rows.length }, (_, index) => `P1-${String(index + 1).padStart(3, '0')}`),
  );
  for (const row of rows) {
    assert.equal(row.length, 6);
    assert.ok(row.every((cell) => cell.length > 0), `${row[0]} has no empty fields`);
    assert.ok(['low', 'medium', 'high'].includes(row[3]), `${row[0]} has an allowed risk`);
  }
});

test('Part I claim inventory locations, quotations, risk, and searches remain externally checkable', () => {
  const part1 = part1Text(fs.readFileSync(coursePath, 'utf8'));
  const anchorById = new Map(exactAnchorRows().map((row) => [row[0], row]));
  const mapByPId = new Map(inventoryMapRows(part1ClaimsPath, 'P1').map((row) => [row[0], row]));
  const genericClaimWords = new Set([
    'который', 'которая', 'которое', 'которые', 'чтобы', 'этого', 'этой', 'этот', 'есть',
    'после', 'только', 'может', 'является', 'становится', 'своим', 'свою', 'свои', 'одно',
    'одна', 'один', 'всем', 'всех', 'потому', 'также', 'между', 'тогда', 'самым', 'самая',
    'самой', 'было', 'были', 'быть', 'когда', 'очень', 'через', 'обычно', 'именно',
  ]);
  for (const [id, location, claim, risk, domain, searchTerms] of claimRows()) {
    const locationRoot = location.split(' → ')[0];
    const sourceHeading = claimLocationHeadings.get(locationRoot);
    assert.ok(sourceHeading, `${id} uses a recognized Part I location root: ${locationRoot}`);
    if (relocatedClaimLocations.has(locationRoot)) {
      assert.ok(
        fs.readFileSync(coursePath, 'utf8').includes(sourceHeading),
        `${id}: локация «${locationRoot}» переехала в ${relocatedClaimLocations.get(locationRoot)} и должна существовать в курсе`,
      );
    } else if (retiredClaimLocations.has(locationRoot)) {
      assert.equal(
        part1.includes(sourceHeading),
        false,
        `${id}: локация «${locationRoot}» удалена вместе с утверждением (${retiredClaimLocations.get(locationRoot)}) и не должна возвращаться`,
      );
    } else {
      assert.ok(part1.includes(sourceHeading), `${id} location exists in Part I: ${sourceHeading}`);
    }

    const mapRow = mapByPId.get(id);
    assert.ok(mapRow, `${id} has a fact-decision mapping`);
    const anchorRow = anchorById.get(mapRow[3]);
    assert.ok(anchorRow, `${id} maps to exact source anchor ${mapRow[3]}`);
    assert.match(anchorRow[1], /^content\/course\.md:L\d+-L\d+$/u, `${id} source anchor points to canonical course text`);
    assert.ok(exactBeforeText(anchorRow).length > 0, `${id} source anchor retains exact before text`);

    assertClaimRiskPolicy([id, location, claim, risk, domain, searchTerms]);
    assert.ok(domain.length >= 3, `${id} has a focused domain`);
    const searchWords = searchTerms.split(/\s+/u);
    assert.ok(searchWords.length >= 4, `${id} has at least four search terms`);
    assert.match(searchTerms, /[a-z]/iu, `${id} search terms include an external-search keyword`);
    assert.ok(new Set(searchWords).size >= 3, `${id} search terms stay focused rather than repeating filler`);
    assert.doesNotMatch(searchTerms, /\b(?:thing|things|stuff|information)\b/iu, `${id} search terms avoid generic filler`);
  }
});

test('risk policy rejects downgraded explicit and generic universal claims', () => {
  const rowsById = new Map(claimRows().map((row) => [row[0], row]));
  const mutations = [
    ['P1-044', /P1-044 unscoped Russian generic\/universal claim is high risk/u],
    ['P1-181', /P1-181 unscoped Russian generic\/universal claim is high risk/u],
    ['P1-125', /P1-125 explicit Russian universal claim is high risk/u],
  ];

  for (const [id, expectedFailure] of mutations) {
    const sourceRow = rowsById.get(id);
    assert.ok(sourceRow, `${id} exists in the inventory`);
    const downgradedRow = [...sourceRow];
    downgradedRow[3] = 'medium';
    assert.throws(
      () => assertClaimRiskPolicy(downgradedRow),
      (error) => {
        assert.match(error.message, expectedFailure);
        return true;
      },
      `${id} cannot be downgraded to medium`,
    );
  }
});

test('risk policy accepts the six explicitly scoped or attributed medium claims', () => {
  const rowsById = new Map(claimRows().map((row) => [row[0], row]));
  for (const id of ['P1-146', 'P1-186', 'P1-195', 'P1-199', 'P1-200', 'P1-201']) {
    const row = rowsById.get(id);
    assert.ok(row, `${id} exists in the inventory`);
    assert.equal(row[3], 'medium', `${id} remains medium`);
    assert.doesNotThrow(() => assertClaimRiskPolicy(row), `${id} has a legitimate scope or attribution`);
  }
});

test('Parts II–III claim inventory has unique sequential IDs and complete searchable fields', () => {
  const inventory = fs.readFileSync(part2ClaimsPath, 'utf8');
  assert.match(inventory, /^\| ID \| location \| source_span \| quotation \| claim \| risk \| domain \| search_terms \| model_assumptions \|$/mu);

  const rows = part2ClaimRows();
  assert.ok(rows.length > 0, 'assigned-range inventory contains claim rows');
  assert.deepEqual(
    rows.map((row) => row[0]),
    Array.from({ length: rows.length }, (_, index) => `P2-${String(index + 1).padStart(3, '0')}`),
  );
  for (const row of rows) {
    assert.equal(row.length, 9);
    assert.ok(row.every((cell) => cell.length > 0), `${row[0]} has no empty fields`);
    assert.ok(['low', 'medium', 'high'].includes(row[5]), `${row[0]} has an allowed risk`);
  }
  assert.deepEqual(new Set(rows.map((row) => row[5])), new Set(['low', 'medium', 'high']), 'risk levels are meaningfully calibrated across the inventory');
});

test('Parts II–III claim source spans, exact quotations, risk, and searches are externally checkable', () => {
  const anchorById = new Map(exactAnchorRows().map((row) => [row[0], row]));
  const mapByPId = new Map(inventoryMapRows(part2ClaimsPath, 'P2').map((row) => [row[0], row]));

  for (const row of part2ClaimRows()) {
    const [id, location, sourceSpan, quotation, claim, , domain, searchTerms] = row;
    const mapRow = mapByPId.get(id);
    assert.ok(mapRow, `${id} has a fact-decision mapping`);
    const anchorRow = anchorById.get(mapRow[3]);
    assert.ok(anchorRow, `${id} maps to exact source anchor ${mapRow[3]}`);
    assert.equal(normalizedClaimText(quotation), normalizedClaimText(exactBeforeText(anchorRow)), `${id} quotation exactly matches its immutable source anchor`);

    if (/^course\.md:L\d+-L\d+$/u.test(sourceSpan)) {
      assert.equal(anchorRow[1].replace(/^content\//u, ''), sourceSpan, `${id} course span agrees with its anchor source`);
    } else {
      assert.match(sourceSpan, /^assets\/charts\/[a-z0-9-]+\.png$/u, `${id} PNG span names a protected chart`);
      assert.equal(anchorRow[1], sourceSpan, `${id} PNG span agrees with its anchor source`);
      const pngBytes = fs.readFileSync(path.join(rootDir, ...sourceSpan.split('/')));
      const selectorHash = /sha256=([a-f0-9]{64})/u.exec(anchorRow[3])?.[1];
      assert.ok(selectorHash, `${id} PNG anchor records a SHA-256 selector`);
      assert.equal(sha256(pngBytes), selectorHash, `${id} PNG binary matches its protected selector`);
    }
    assert.ok(location.length >= 3, `${id} retains a human-readable location`);

    if (Number(id.slice(3)) <= 217) assertPart2ClaimRiskPolicy(row);
    assert.ok(domain.length >= 3, `${id} has a focused domain`);
    const searchWords = searchTerms.split(/\s+/u);
    assert.ok(searchWords.length >= 4, `${id} has at least four search terms`);
    assert.match(searchTerms, /[a-z]/iu, `${id} search terms include an external-search keyword`);
    assert.ok(new Set(searchWords).size >= 3, `${id} search terms stay focused rather than repeating filler`);
    assert.doesNotMatch(searchTerms, /\b(?:thing|things|stuff|information)\b/iu, `${id} search terms avoid generic filler`);
  }
});

test('inventory names every chart model and its numeric or conceptual assumptions explicitly', () => {
  const rowsById = new Map(part2ClaimRows().map((row) => [row[0], row]));
  const expectedModels = new Map([
    ['P2-211', ['chart=01-housing-vs-salaries', 'base_index=100', 'housing_2026≈650', 'salaries_2026≈215', 'scope=illustrative', 'country=unspecified']],
    ['P2-212', ['chart=02-minimum-payment', 'principal_thousand=300', 'annual_rate=25%', 'minimum_payment_monthly=3.5%_of_balance', 'horizon_years=15', 'balance_after_horizon_thousand≈23', 'cumulative_interest_thousand≈407']],
    ['P2-213', ['chart=03-price-slicing', 'monthly_payment=990', 'months=24', 'total=23760', 'fees=excluded', 'interest=excluded']],
    ['P2-214', ['chart=04-better-vs-enough', 'scale=conditional', 'wellbeing_measure=no', 'better=unbounded', 'enough=conceptual_plateau']],
    ['P2-215', ['chart=05-growth-vs-plateau', 'skill_level=conditional', 'time=conditional', 'trajectory=not_necessarily_linear', 'plateau=conceptual']],
  ]);

  for (const [id, fields] of expectedModels) {
    const row = rowsById.get(id);
    assert.ok(row, `${id} exists as an explicit chart-model row`);
    if (['P2-211', 'P2-212', 'P2-213'].includes(id)) assert.equal(row[5], 'high', `${id} keeps quantitative model claims high risk`);
    for (const field of fields) assert.ok(row[8].includes(field), `${id} records ${field}`);
  }
  for (const id of ['P2-216', 'P2-217']) assert.ok(rowsById.has(id), `${id} records the previously omitted course claim`);
});

test('reviewed claim wording removes stale certainty without hiding the source claim', () => {
  const rowsById = new Map(part2ClaimRows().map((row) => [row[0], row]));
  assert.match(rowsById.get('P2-069')?.[4] ?? '', /возможн/u);
  assert.doesNotMatch(rowsById.get('P2-091')?.[4] ?? '', /гарантирован/u);
  assert.equal(rowsById.get('P2-069')?.[5], 'high');
  assert.equal(rowsById.get('P2-091')?.[5], 'high');
});

test('P2-217 records self-irony as protection rather than duplicating the reciprocal-disclosure claim', () => {
  const rowsById = new Map(part2ClaimRows().map((row) => [row[0], row]));
  const row = rowsById.get('P2-217');
  assert.ok(row, 'P2-217 exists');
  assert.equal(row[2], 'course.md:L791-L791');
  assert.ok(row[3].includes('без самоиронии (самоирония — это защита, а нужна открытость'), 'P2-217 quotes the omitted source assertion');
  assert.equal(row[4], 'Самоирония при таком признании названа защитой, тогда как для практики нужна открытость.');
  assert.equal(row[5], 'high');
  assert.equal(row[6], 'психология защит и самораскрытия');
  assert.match(row[7], /self-deprecating humor defense mechanism vulnerability disclosure openness/u);
  assert.notEqual(normalizedClaimText(row[4]), normalizedClaimText(rowsById.get('P2-129')?.[4] ?? ''));
});

test('Parts II–III inventory has no exact or high-confidence semantic duplicate claims', () => {
  const rows = part2ClaimRows();
  const exactClaims = new Map();
  for (const row of rows) {
    const normalized = normalizedClaimText(row[4]);
    assert.equal(exactClaims.has(normalized), false, `${row[0]} does not duplicate ${exactClaims.get(normalized)}`);
    exactClaims.set(normalized, row[0]);
  }

  for (let leftIndex = 0; leftIndex < rows.length; leftIndex += 1) {
    const left = semanticClaimTerms(rows[leftIndex][4]);
    for (let rightIndex = leftIndex + 1; rightIndex < rows.length; rightIndex += 1) {
      const right = semanticClaimTerms(rows[rightIndex][4]);
      const smallerSize = Math.min(left.size, right.size);
      if (smallerSize < 5) continue;
      const shared = [...left].filter((term) => right.has(term)).length;
      const containment = shared / smallerSize;
      const jaccard = shared / (left.size + right.size - shared);
      assert.equal(
        shared >= 5 && (containment >= 0.9 || jaccard >= 0.72),
        false,
        `${rows[leftIndex][0]} and ${rows[rightIndex][0]} are high-confidence semantic duplicates`,
      );
    }
  }
});

test('editorial baseline CLI writes stable JSON and reports matching or changed metrics', (t) => {
  const fixtureDir = fs.mkdtempSync(path.join(os.tmpdir(), 'normis-editorial-baseline-'));
  t.after(() => fs.rmSync(fixtureDir, { recursive: true, force: true }));
  const writtenBaselinePath = path.join(fixtureDir, 'written-baseline.json');
  const changedBaselinePath = path.join(fixtureDir, 'changed-baseline.json');
  const run = (...args) => spawnSync(process.execPath, [collectorPath, ...args], {
    cwd: rootDir,
    encoding: 'utf8',
  });

  const write = run('--write', writtenBaselinePath);
  assert.equal(write.status, 0, write.stderr);
  assert.equal(write.stdout, `Editorial baseline written: ${writtenBaselinePath}\n`);
  const writtenBytes = fs.readFileSync(writtenBaselinePath);
  assert.deepEqual([...writtenBytes.slice(0, 3)], [0x7B, 0x0A, 0x20]);
  const writtenBaseline = JSON.parse(writtenBytes.toString('utf8'));
  assert.equal(writtenBytes.toString('utf8'), `${JSON.stringify(writtenBaseline, null, 2)}\n`);

  const identical = run('--compare', writtenBaselinePath);
  assert.equal(identical.status, 0, identical.stderr);
  assert.deepEqual(JSON.parse(identical.stdout).differences, []);

  fs.writeFileSync(changedBaselinePath, `${JSON.stringify({ ...writtenBaseline, parts: writtenBaseline.parts + 1 }, null, 2)}\n`, 'utf8');
  const changed = run('--compare', changedBaselinePath);
  assert.equal(changed.status, 1, changed.stderr);
  assert.deepEqual(JSON.parse(changed.stdout).differences, ['parts']);
});

test('editorial report exposes every required section and table schema', () => {
  const report = fs.readFileSync(reportPath, 'utf8');
  for (const heading of [
    '# Редакторский отчёт',
    '## Метод и объём',
    '## Существенные литературные правки',
    '## Реестр фактологических утверждений',
    '## Медицинская и финансовая безопасность',
    '## Источники',
    '## Спорные решения и неопределённость',
    '## Итоговая статистика',
  ]) {
    assert.ok(report.split(/\r?\n/u).includes(heading), `report contains ${heading}`);
  }
  assert.match(report, /^\| Раздел \| Было \| Стало \| Причина \|$/mu);
  assert.match(report, /^\| ID \| Раздел \| Исходный тезис \| Статус \| Редакторское решение \| Источники \|$/mu);
  assert.match(report, /способ гарантированно не получить близость[^\n]+способ не получить близость/u, 'report records the removal of the relationship guarantee');
});

test('Task 5 audit accounts for every fact decision with an allowed application state', () => {
  const report = fs.readFileSync(reportPath, 'utf8');
  const facts = factRegisterRows();
  const audits = factAuditRows();

  assert.equal(facts.length, 453);
  assert.equal(audits.length, 453);
  assert.deepEqual(
    facts.map((row) => row[0]),
    Array.from({ length: 453 }, (_, index) => `F-${String(index + 1).padStart(3, '0')}`),
  );
  assert.deepEqual(audits.map((row) => row[0]), facts.map((row) => row[0]));
  assert.match(report, /^\| ID \| P-ID\/locations \| Evidence note \| Exact anchor \| Integrated span patch \| Task 5 status \|$/mu);

  const allowed = new Set(['применено', 'без изменения', 'PNG — ожидает задачу 7', 'заблокировано']);
  for (const row of audits) {
    assert.equal(row.length, 6, `${row[0]} audit row includes Task 5 status`);
    assert.ok(allowed.has(row[5]), `${row[0]} has an allowed Task 5 status`);
  }
  assert.equal(audits.filter((row) => row[5] === 'применено').length, 437);
  assert.deepEqual(audits.filter((row) => row[5] === 'без изменения').map((row) => row[0]), ['F-185', 'F-405']);
  assert.deepEqual(
    audits.filter((row) => row[5] === 'PNG — ожидает задачу 7').map((row) => row[0]),
    [
      'F-435', 'F-436', 'F-437', 'F-438', 'F-439', 'F-440', 'F-441',
      'F-442', 'F-443', 'F-449', 'F-450', 'F-451', 'F-452', 'F-453',
    ],
  );
  assert.equal(audits.filter((row) => row[5] === 'заблокировано').length, 0, 'no fact decision is blocked');
  const auditStart = report.indexOf('### Аудиторские привязки реестра');
  const auditEnd = report.indexOf('\n### Реестр точных исходных якорей', auditStart);
  assert.doesNotMatch(report.slice(auditStart, auditEnd), /\.;|;;/u, 'audit evidence has no cosmetic separator artifacts');
});

test('every changing canonical anchor is consumed exactly once and every high-risk claim is accounted for', () => {
  const course = fs.readFileSync(coursePath, 'utf8');
  const factsById = new Map(factRegisterRows().map((row) => [row[0], row]));
  const audits = factAuditRows();
  const auditById = new Map(audits.map((row) => [row[0], row]));
  const anchorById = new Map(exactAnchorRows().map((row) => [row[0], row]));
  const fIdsByAnchor = new Map();

  for (const row of audits) {
    for (const match of row[3].matchAll(/A-(?:C-\d{3}|P2-\d{3})/gu)) {
      const ids = fIdsByAnchor.get(match[0]) ?? [];
      ids.push(row[0]);
      fIdsByAnchor.set(match[0], ids);
    }
  }

  for (const [anchorId, fIds] of fIdsByAnchor) {
    if (!anchorId.startsWith('A-C-')) continue;
    const changing = fIds.some((fId) => factsById.get(fId)?.[3] !== 'подтверждено');
    if (changing) assert.equal(course.includes(exactBeforeText(anchorById.get(anchorId))), false, `${anchorId} changing source span is consumed once`);
  }

  const mappings = [
    ...inventoryMapRows(part1ClaimsPath, 'P1'),
    ...inventoryMapRows(part2ClaimsPath, 'P2'),
  ];
  const highRiskPIds = new Set([
    ...claimRows().filter((row) => row[3] === 'high').map((row) => row[0]),
    ...part2ClaimRows().filter((row) => row[5] === 'high').map((row) => row[0]),
  ]);
  for (const row of mappings.filter((row) => highRiskPIds.has(row[0]))) {
    assert.ok(factsById.has(row[1]), `${row[0]} maps to a registered F decision`);
    assert.ok(auditById.has(row[1]), `${row[0]} maps to an audited F decision`);
    assert.notEqual(auditById.get(row[1])[5], 'заблокировано', `${row[0]} high-risk decision is not blocked`);
  }
});

test('every applied non-deletion is registered and its rejected source text stays out', () => {
  // Аппарат оговорок снят из прозы: утверждённая формулировка живёт в реестре,
  // а курс говорит своим голосом. Проверяем то, что защищает читателя на деле, —
  // отклонённое проверкой утверждение в текст не вернулось.
  const course = plainProse(fs.readFileSync(coursePath, 'utf8'));
  const auditById = new Map(factAuditRows().map((row) => [row[0], row]));
  const anchorById = new Map(exactAnchorRows().map((row) => [row[0], row]));
  const appliedReplacements = factRegisterRows().filter((row) => (
    row[3] !== 'удалено' && auditById.get(row[0])?.[5] === 'применено'
  ));

  assert.equal(appliedReplacements.length, 219);
  for (const [fId] of appliedReplacements) {
    const audit = auditById.get(fId);
    assert.ok(audit, `${fId} maps to an audited decision`);
    for (const match of audit[3].matchAll(/A-C-\d{3}/gu)) {
      const anchor = anchorById.get(match[0]);
      if (!anchor) continue;
      const before = exactBeforeText(anchor);
      if (!before) continue;
      assert.equal(course.includes(before), false, `${fId} rejected source span stays out of the course`);
    }
  }
});

const task5UnsafeHighRiskWording = [
  'самостоятельные «правила и лимиты» обычно не работают',
  'сон разрушен именно в восстановительной части',
  'Длинный выдох напрямую включает парасимпатику',
  'Самостоятельная борьба с химией силой воли',
  'Минимальный платёж по кредитной карте спроектирован так, чтобы долг гасился как можно дольше',
  'платя минимум, ты почти целиком платишь проценты',
  'проценты начисляются на проценты, и долг растёт сам',
  'не активирует ощущение большой траты',
];
const task5ApprovedHighRiskWording = [
  'Игровое расстройство признано ВОЗ',
  'одних самостоятельно заданных лимитов может быть недостаточно',
  'конкретный формат помощи подбирают по ситуации',
  'Алкоголь перед сном может дозозависимо менять структуру сна',
  'Медленное дыхание может менять частоту и вариабельность сердечного ритма',
  'Пониженное настроение или утрата интереса большую часть дня почти ежедневно не менее двух недель — повод обратиться за помощью',
  'Минимальный платёж: иллюстративная траектория долга',
  'остаток 23 001,23',
  'проценты 407 351,14',
  '990 × 24 = 23 760; до подписания проверьте комиссии и проценты',
];

function highRiskWordingFailures(course) {
  return [
    ...task5UnsafeHighRiskWording.filter((phrase) => course.includes(phrase)).map((phrase) => `unsafe:${phrase}`),
    ...task5ApprovedHighRiskWording.filter((phrase) => !course.includes(phrase)).map((phrase) => `missing:${phrase}`),
  ];
}

test('high-risk medical, addiction, and financial wording is scoped to the approved course-ready language', () => {
  const course = fs.readFileSync(coursePath, 'utf8');
  assert.deepEqual(highRiskWordingFailures(course), []);
});

test('high-risk wording guards reject all 18 in-memory red controls', () => {
  const course = fs.readFileSync(coursePath, 'utf8');
  for (const unsafe of task5UnsafeHighRiskWording) {
    assert.ok(highRiskWordingFailures(`${course}\n${unsafe}`).includes(`unsafe:${unsafe}`));
  }
  for (const approved of task5ApprovedHighRiskWording) {
    const withoutApproved = course.split(approved).join('');
    assert.ok(highRiskWordingFailures(withoutApproved).includes(`missing:${approved}`));
  }
});

test('every medical/addiction and financial/numeric clarification, softening, or deletion is enforced', () => {
  const course = fs.readFileSync(coursePath, 'utf8');
  const facts = factRegisterRows();
  const auditById = new Map(factAuditRows().map((row) => [row[0], row]));
  const anchorById = new Map(exactAnchorRows().map((row) => [row[0], row]));
  const targetFacts = facts.filter((row) => {
    const number = Number(row[0].slice(2));
    const inRiskOrderedDomain = (number >= 29 && number <= 110) || (number >= 350 && number <= 406);
    return inRiskOrderedDomain && new Set(['уточнено', 'смягчено', 'удалено']).has(row[3]);
  });

  assert.equal(targetFacts.length, 128);
  assert.equal(targetFacts.filter((row) => row[3] === 'удалено').length, 66);
  assert.equal(targetFacts.filter((row) => row[3] !== 'удалено').length, 62);
  for (const fact of targetFacts) {
    const [fId, , , status, decision] = fact;
    const audit = auditById.get(fId);
    assert.equal(audit?.[5], 'применено', `${fId} risk-ordered decision is applied`);
    for (const match of audit[3].matchAll(/A-C-\d{3}/gu)) {
      const before = exactBeforeText(anchorById.get(match[0]));
      assert.equal(course.includes(before), false, `${fId} unsafe exact source span is absent`);
    }
    // Присутствие утверждённой формулировки в прозе больше не проверяется:
    // после снятия аппарата оговорок статус решения хранится в реестре.
    assert.ok(['уточнено', 'смягчено', 'удалено'].includes(status), `${fId} keeps a reviewed status`);
  }
});

test('credit calculations are reproducible and all five conceptual chart locations remain accessible', () => {
  let balance = 300_000;
  let cumulativeInterest = 0;
  let cumulativePayments = 0;
  const monthlyRate = 0.25 / 12;
  let month80;
  for (let month = 1; month <= 180; month += 1) {
    const opening = balance;
    const interest = monthlyRate * opening;
    const payment = 0.035 * opening;
    balance = opening + interest - payment;
    cumulativeInterest += interest;
    cumulativePayments += payment;
    if (month === 80) month80 = { balance, cumulativeInterest };
  }
  assert.equal(Number(month80.cumulativeInterest.toFixed(2)), 300_282.56);
  assert.equal(Number(month80.balance.toFixed(2)), 95_807.86);
  assert.equal(Number(balance.toFixed(2)), 23_001.23);
  assert.equal(Number(cumulativeInterest.toFixed(2)), 407_351.14);
  assert.equal(Number(cumulativePayments.toFixed(2)), 684_349.91);
  assert.equal(990 * 24, 23_760);

  const course = fs.readFileSync(coursePath, 'utf8');
  assert.doesNotMatch(course, /графики\/01-жилье-vs-зарплаты\.png/u);
  assert.ok(course.includes('Доступность жилья нужно сравнивать по конкретной стране, периоду и показателю; без них числовая кривая вводит в заблуждение'));
  for (const chart of [
    'графики/02-минимальный-платеж.png',
    'графики/03-дробление-цены.png',
    'графики/04-лучше-vs-достаточно.png',
    'графики/05-рост-vs-плато.png',
  ]) assert.ok(course.includes(chart), `retained conceptual chart stays in place: ${chart}`);
  for (const limitation of [
    'две ненумерованные концептуальные линии, без осей и делений',
    'не задаёт общую форму навыка, уровень или календарный срок',
    'без покупок, комиссий, штрафов и минимального фиксированного платежа',
    'арифметика иллюстрации; в ней комиссии и проценты не заданы',
  ]) assert.ok(course.includes(limitation), `retained PNG has an accessible limitation: ${limitation}`);
});

const mergedClaimsPath = path.join(rootDir, 'docs', 'editorial', 'claims-merged-sections.md');
const mergedSectionHeadings = [
  'Биохакинг и медикализация нормы: тело как вечный пациент',
  'ИИ-тревога: новое «в твоём возрасте уже пора»',
  'Достаточно хороший родитель: индустрия недостаточности в квадрате',
  'НЕДЕЛЯ ОБЫЧНОГО ЧЕЛОВЕКА',
  'Что делать после прочтения: маршрут на 7 дней',
  'Амнистия: что делать с уже наделанным',
  'Когда всё нормально: инструкция к хорошим временам',
];
const mergedClaimStatuses = new Set(['подтверждено', 'уточнено', 'смягчено', 'авторское наблюдение', 'удалено']);

function mergedClaimRows() {
  return fs.readFileSync(mergedClaimsPath, 'utf8')
    .split(/\r?\n/u)
    .filter((line) => /^\| M-\d{3} \|/u.test(line))
    .map(markdownTableCells);
}

test('every merged section is present in the canonical course exactly once', () => {
  const course = fs.readFileSync(coursePath, 'utf8');
  for (const heading of mergedSectionHeadings) {
    const occurrences = [...course.matchAll(new RegExp(`^#{1,3} ${heading.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&')}$`, 'gmu'))];
    assert.equal(occurrences.length, 1, `merged heading appears once: ${heading}`);
  }
  assert.match(course, /^# НЕДЕЛЯ ОБЫЧНОГО ЧЕЛОВЕКА$/mu, 'the week route is its own top-level part');
  const weekStart = course.indexOf('# НЕДЕЛЯ ОБЫЧНОГО ЧЕЛОВЕКА');
  const finaleStart = course.indexOf('# ФИНАЛ');
  const quizStart = course.indexOf('## Тесты:');
  assert.ok(quizStart < weekStart && weekStart < finaleStart, 'the week part sits between the quiz and the finale');
  for (const day of ['День 1', 'День 2', 'День 3', 'День 4', 'День 5', 'День 6', 'День 7']) {
    assert.ok(course.includes(`**${day}`), `week route keeps ${day}`);
  }
});

test('merged sections carry no diagnostic, guaranteeing, or urgency language', () => {
  const course = fs.readFileSync(coursePath, 'utf8');
  const lines = course.split(/\r?\n/u);
  const bounds = mergedSectionHeadings.map((heading) => lines.findIndex((line) => line.endsWith(` ${heading}`) && line.startsWith('#')));
  assert.equal(bounds.filter((index) => index < 0).length, 0, 'every merged heading resolves to a line');

  const mergedText = bounds.map((start) => {
    const level = /^(#{1,6})/u.exec(lines[start])[1].length;
    let end = lines.length;
    for (let index = start + 1; index < lines.length; index += 1) {
      const next = /^(#{1,6})\s/u.exec(lines[index]);
      if (next && next[1].length <= level) { end = index; break; }
    }
    return lines.slice(start, end).join('\n');
  }).join('\n');

  for (const forbidden of [/\bсимптом/iu, /\bдиагноз\b/iu, /гарантирован/iu, /успей\b/iu, /осталось \d/iu, /только сегодня/iu, /\bспеши\b/iu]) {
    assert.doesNotMatch(mergedText, forbidden, `merged sections avoid ${forbidden}`);
  }
  assert.doesNotMatch(mergedText, /[ \t]+$/mu, 'merged sections have no trailing whitespace');
  assert.doesNotMatch(mergedText, /"/u, 'merged sections have no straight quote marks');
  assert.ok(mergedText.includes('ортосомния'), 'the orthosomnia finding keeps its scoped wording');
  assert.ok(mergedText.includes('часть пользователей трекеров сна'), 'the tracker claim is scoped to a subset');
  assert.ok(mergedText.includes('в модели Винникотта'), 'the Winnicott claim is attributed to its model');
  assert.doesNotMatch(mergedText, /на основе тысяч наблюдений/u, 'the unsupported observation count is gone');
  assert.doesNotMatch(mergedText, /большинство «отстающих»/u, 'the unmeasured majority claim is gone');
});

test('merged claim inventory has sequential ids, allowed statuses, and complete fields', () => {
  const rows = mergedClaimRows();
  assert.ok(rows.length >= 25, 'the merged inventory covers the new material');
  assert.deepEqual(
    rows.map((row) => row[0]),
    Array.from({ length: rows.length }, (_, index) => `M-${String(index + 1).padStart(3, '0')}`),
    'merged claim ids are unique and sequential',
  );
  for (const row of rows) {
    assert.equal(row.length, 7, `${row[0]} has every inventory field`);
    for (const [index, field] of ['section', 'claim', 'risk', 'domain', 'search_terms', 'status'].entries()) {
      assert.ok(row[index + 1].length > 0, `${row[0]} fills ${field}`);
    }
    assert.ok(['low', 'medium', 'high'].includes(row[3]), `${row[0]} has a known risk level`);
    assert.ok(mergedClaimStatuses.has(row[6]), `${row[0]} has an allowed status`);
    if (row[3] !== 'low' && row[6] === 'авторское наблюдение') {
      assert.ok(row[5] !== '—', `${row[0]} records search terms for a non-low authorial claim`);
    }
  }
});

test('the editorial report documents the merge, its sources, and the landing changes', () => {
  const report = fs.readFileSync(reportPath, 'utf8');
  for (const section of [
    '## Влитые разделы (слияние 2026-08-18)',
    '### Правки при вливании',
    '### Источники по влитым разделам',
    '### Правки лендинга (задача 6)',
    '### Технические следствия слияния',
    '### После слияния 2026-08-18',
  ]) {
    const index = report.indexOf(section);
    assert.ok(index > 0, `report has section ${section}`);
    const body = report.slice(index + section.length, report.indexOf('\n#', index + section.length));
    assert.ok(body.replace(/\s/gu, '').length > 80, `report section is not empty: ${section}`);
  }

  const mergeStart = report.indexOf('### Источники по влитым разделам');
  const mergeEnd = report.indexOf('### Правки лендинга', mergeStart);
  const links = [...report.slice(mergeStart, mergeEnd).matchAll(/\]\((https?:\/\/[^)]+)\)/gu)].map((match) => match[1]);
  assert.ok(links.length >= 4, 'every merged factual decision cites a direct source');
  for (const link of links) {
    assert.doesNotMatch(link, /\/search\?|[?&]q=|google\.com\/search/u, `source is not a search page: ${link}`);
  }

  const editStart = report.indexOf('### Правки при вливании');
  const editEnd = report.indexOf('### Источники по влитым разделам', editStart);
  const editLines = report.slice(editStart, editEnd).split(/\r?\n/u).filter((line) => /^\| /u.test(line) && !/^\| -+ \|/u.test(line));
  const fourColumnRows = editLines.map(markdownTableCells).filter((row) => row.length === 4 && row[0] !== 'ID');
  const threeColumnRows = editLines.map(markdownTableCells).filter((row) => row.length === 3 && row[0] !== 'Было в исходнике');
  assert.ok(fourColumnRows.length + threeColumnRows.length >= 30, 'every substantive merge edit is registered');
  for (const row of fourColumnRows) {
    assert.ok(row[3].length >= 20, `merge edit row states a reason: ${row[0]}`);
  }
  for (const row of threeColumnRows) {
    assert.ok(row[2].length >= 20, `supplementary merge edit row states a reason: ${row[0]}`);
  }
});

test('the unreferenced housing chart is retained as audit evidence', () => {
  const course = fs.readFileSync(coursePath, 'utf8');
  assert.doesNotMatch(course, /графики\/01-[^)\s]*\.png/u, 'the canon no longer references chart 01');
  assert.ok(course.includes('> **Доступность жилья.**'), 'its accessible textual location remains');

  const png = path.join(chartDir, '01-housing-vs-salaries.png');
  assert.ok(fs.existsSync(png), 'the bitmap is kept: decisions F-444…F-453 adjudicate claims embedded in it');
  assert.equal(
    sha256(fs.readFileSync(png)),
    '2e620720391ad727afd94bf31c93c80a3e162e8fb634e3240714166e5df8415f',
    'the retained bitmap is the exact image the fact register audited',
  );
  assert.deepEqual(
    fs.readdirSync(chartDir).sort(),
    [
      '01-housing-vs-salaries.png', '02-minimum-payment.png', '03-price-slicing.png',
      '04-better-vs-enough.png', '05-growth-vs-plateau.png',
    ],
    'all five audited charts remain on disk',
  );
});

// Курс ссылается на собственный редакторский аппарат числами. Числа обязаны сходиться
// с файлами реестра, иначе текст, требующий проверять всё, сам оказывается непроверенным.
test('the self-referential audit numbers in the canon match the registry files', () => {
  const course = fs.readFileSync(coursePath, 'utf8');
  const paragraph = course.match(/Цифры такие:[^\n]*/u);
  assert.ok(paragraph, 'the canon still states its own audit figures');
  const claim = paragraph[0];

  const number = (pattern, label) => {
    const found = claim.match(pattern);
    assert.ok(found, `the canon states ${label}`);
    return Number.parseInt(found[1], 10);
  };

  // Первая сплошная проверка: источник истины — сводка статусов F в отчёте.
  const report = fs.readFileSync(reportPath, 'utf8');
  const fIds = new Set([...report.matchAll(/\bF-(\d{3})\b/gu)].map((m) => Number.parseInt(m[1], 10)));
  const fSummary = report.match(/- Статусы F: ([^\n]*)/u);
  assert.ok(fSummary, 'the report still summarises the F statuses');
  const fStatus = (name) => {
    const segment = fSummary[1].split(';').find((part) => part.includes(name));
    assert.ok(segment, `the report summary lists ${name}`);
    const found = segment.match(/(\d+)\s*$/u);
    assert.ok(found, `the report summary counts ${name}`);
    return Number.parseInt(found[1], 10);
  };

  assert.equal(number(/из (\d+) разобранных утверждений/u, 'the size of the first pass'), fIds.size);
  assert.equal(number(/\*\*(\d+) не пережили её и были удалены\*\*/u, 'the number deleted'), fStatus('удалено'));
  assert.equal(number(/Ещё (\d+) пришлось уточнить/u, 'the number clarified'), fStatus('уточнено'));

  // Поздние разделы: источник истины — сам файл реестра.
  const merged = fs.readFileSync(mergedClaimsPath, 'utf8');
  const mergedRows = merged.split('\n').filter((line) => /^\| M-\d+ \|/u.test(line));
  const counts = {};
  for (const row of mergedRows) {
    const status = row.split('|').map((cell) => cell.trim())[7];
    counts[status] = (counts[status] ?? 0) + 1;
  }

  assert.equal(number(/сейчас в реестре (\d+) запис(?:ей|и|ь)/u, 'the registry size'), mergedRows.length);
  assert.equal(number(/подтверждено (\d+)/u, 'the confirmed count'), counts['подтверждено']);
  assert.equal(number(/уточнено (\d+)/u, 'the clarified count'), counts['уточнено']);
  assert.equal(number(/смягчено (\d+)/u, 'the softened count'), counts['смягчено']);
  assert.equal(number(/(\d+) честно помечены как авторские наблюдения/u, 'the authorial count'), counts['авторское наблюдение']);
});

// Лендинг тоже называет цифры реестра. Держим их сверенными с файлами.
test('the audit figures on the landing page match the registry files', () => {
  const landing = fs.readFileSync(path.join(rootDir, 'content', 'landing.html'), 'utf8');
  const figures = landing.match(/<dl class="landing-figures">[\s\S]*?<\/dl>/u);
  assert.ok(figures, 'the landing still states the audit figures');
  const numbers = [...figures[0].matchAll(/<dt>(\d+)<\/dt>/gu)].map((m) => Number.parseInt(m[1], 10));
  assert.equal(numbers.length, 4, 'four figures are shown');

  const report = fs.readFileSync(reportPath, 'utf8');
  const fIds = new Set([...report.matchAll(/\bF-(\d{3})\b/gu)].map((m) => Number.parseInt(m[1], 10)));
  const summary = report.match(/- Статусы F: ([^\n]*)/u);
  assert.ok(summary, 'the report still summarises the F statuses');
  const fStatus = (name) => {
    const segment = summary[1].split(';').find((part) => part.includes(name));
    assert.ok(segment, `the report lists ${name}`);
    return Number.parseInt(segment.match(/(\d+)\s*$/u)[1], 10);
  };

  const merged = fs.readFileSync(mergedClaimsPath, 'utf8');
  const authorial = merged.split('\n')
    .filter((line) => /^\| M-\d+ \|/u.test(line))
    .filter((line) => line.split('|').map((cell) => cell.trim())[7] === 'авторское наблюдение')
    .length;

  assert.deepEqual(numbers, [fIds.size, fStatus('удалено'), fStatus('уточнено'), authorial],
    'the landing figures equal разобрано / удалено / уточнено / авторских наблюдений');
});
