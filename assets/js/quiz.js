(function exposeOrdinaryQuiz(global) {
  'use strict';

  var questions = [
    {
      title: "Лента показала ровесника: дом, машина, «наконец-то сбылось»",
      autopilot: "укол в груди → «а я что в жизни сделал» → полчаса доскролливания с ощущением собственной просроченности.",
      critical: "«Лента показывает отобранные удачные эпизоды чужой жизни; доля „лучшие 5%“ не измерена и удаляется. Что осталось за кадром — кредит, годы, помощь родителей, удача? И главное: я хотел именно дом — или хочу перестать чувствовать этот укол?»",
    },
    {
      title: "Реклама курса: «Освой профессию за 3 месяца и выйди на доход мечты»",
      autopilot: "«Вот оно. Вот с понедельника новая жизнь» → покупка на эмоции → курс присоединяется к трём предыдущим на полке.",
      critical: "«Кто мне это говорит и что он продаёт? Хотел ли я эту профессию вчера, до рекламы? Если реклама показывает только истории выпускников, попроси полную статистику; FTC не устанавливает типичные числа «три из трёх тысяч» для курсов.» (Привет, ошибка выжившего.)",
    },
    {
      title: "«Всего 990 в месяц, первый платёж через 30 дней»",
      autopilot: "«990 — это же ничего» → оформлено за 40 секунд → будущий я разберётся, он вообще молодец.",
      critical: "«990 × 24 = 23 760. Произнесение полной суммы и сравнение с ценой за наличные — упражнение этой главы: оно делает условия рассрочки заметнее, но его эффект отдельно не проверен. Купил бы я это за 23 760 сразу, наличными из конверта? Если нет — почему нарезанное ломтиками стало съедобным?»",
    },
    {
      title: "Внезапная премия",
      autopilot: "«Я заслужил» → к вечеру премия конвертирована в вещи, о которых утром я не знал, что они мне нужны.",
      critical: "«Деньги пришли — значит, у меня появился выбор, а не обязанность потратить. Что говорит мой список „достаточно“? Дыра в подушке закрыта? Радость, кстати, тоже легальная статья — но выбранная, а не рефлекторная».",
    },
    {
      title: "Друг рассказывает, что не справляется и всё запустил",
      autopilot: "«Да брось, всё у тебя нормально! Вот попробуй вставать в шесть…» → друг кивает и больше эту тему не поднимает.",
      critical: "«Он не просил решение — он рискнул снять фасад. Моя задача не починить, а подтвердить, что так можно: „и у меня так бывает“. Совет — только если спросит».",
    },
    {
      title: "Третий год без повышения, лента полна чужих карьерных скачков",
      autopilot: "«Я застрял. Я деградирую. Все растут, один я стою» → вечер самокопания, ночь вакансий, к утру ничего, кроме тревоги.",
      critical: "«Стою — или владею? Работу я делаю стабильно хорошо, на меня полагаются. Хочу ли я расти, потому что хочу, — или потому что стоять стыдно? Это два разных мотива, и решения из них выходят разные».",
    },
    {
      title: "Вечер свободен. Внезапно — никаких дел",
      autopilot: "«Нельзя терять время» → подкаст на ×1,5 про продуктивность поверх мытья посуды, и почему-то усталость.",
      critical: "«Кому я должен этот „полезный“ вечер? Ребёнок во мне знал, что вечер без цели — это не потерянное время, а просто вечер. Один час без „зачем“ — по расписанию версии Pure».",
    },
    {
      title: "«Успей до конца дня! Осталось 2 места / 3 штуки / 4 часа»",
      autopilot: "сердцебиение → «потом такого не будет» → покупка → таймер, как ни странно, назавтра снова там же.",
      critical: "«Срочность — это инструмент отключения вот этого самого вопроса, который я сейчас задаю».",
    },
    {
      title: "Утром в зеркале лицо не то, что вчера на фото",
      autopilot: "«Надо что-то делать» → час в поиске процедур и средств, вечер испорчен.",
      critical: "«Зеркало и камера показывают разное, а снимок с расстояния вытянутой руки искажает черты геометрией объектива. Ни то ни другое не отчёт о том, каким меня видят».",
    },
    {
      title: "У знакомого умер близкий; прошло полгода, а он всё ещё «не в порядке»",
      autopilot: "мысль «пора бы уже двигаться дальше» → аккуратный совет отвлечься.",
      critical: "«У этого срока нет источника, кроме неудобства окружающих. Человек, которому сообщили, что пора перестать, обычно не перестаёт горевать — он перестаёт это показывать».",
    },
  ];

  function makeElement(document, tagName, className, text) {
    var element = document.createElement(tagName);
    if (className) element.className = className;
    if (typeof text === 'string') element.textContent = text;
    return element;
  }

  function resultText(count) {
    if (count <= 3) {
      return '0–3 — либо ты уже прошёл курс, либо слегка себе льстишь. Перечитай модуль 2 про честную выборку.';
    }
    if (count <= 6) {
      return '4–6 — норма живого человека: автопилот и должен вести большую часть маршрута, важно лишь забирать руль на поворотах с деньгами и самооценкой.';
    }
    return '7–10 — поздравляем, ты идеальный клиент индустрии недостаточности; хорошая новость — теперь ты знаешь её приёмы поимённо, а названный приём работает вдвое хуже.';
  }

  function mount(rootElement) {
    if (!rootElement || !rootElement.ownerDocument) return;

    var document = rootElement.ownerDocument;
    var state = { step: 0, answers: questions.map(function () { return null; }) };
    var closed = false;
    var status = makeElement(document, 'p', 'sr-only');
    var result = makeElement(document, 'p', 'quiz__result');
    var panel = makeElement(document, 'div', 'quiz__panel');
    status.setAttribute('data-quiz-status', '');
    status.setAttribute('aria-live', 'polite');
    status.setAttribute('aria-atomic', 'true');
    result.setAttribute('data-quiz-result', '');
    result.setAttribute('aria-live', 'polite');
    result.setAttribute('aria-atomic', 'true');
    rootElement.replaceChildren(status, panel, result);

    function focusHeading(heading) {
      heading.setAttribute('tabindex', '-1');
      heading.focus();
    }

    function reset() {
      state = { step: 0, answers: questions.map(function () { return null; }) };
      closed = false;
      render();
    }

    function closeButton() {
      var button = makeElement(document, 'button', 'button button--secondary quiz__dismiss', 'Закрыть тест');
      button.setAttribute('type', 'button');
      button.addEventListener('click', function () {
        closed = true;
        render();
      });
      return button;
    }

    function resetButton() {
      var button = makeElement(document, 'button', 'button button--secondary', 'Сбросить тест');
      button.setAttribute('type', 'button');
      button.addEventListener('click', reset);
      return button;
    }

    function renderIntroduction(moveFocus) {
      var heading = makeElement(document, 'h3', 'quiz__heading', 'Мастер проверки автопилота');
      var copy = makeElement(document, 'p', '', 'Восемь житейских ситуаций. Отвечай как есть: неправильных ответов нет, есть неотрефлексированные. Ответы остаются только на этой странице.');
      var actions = makeElement(document, 'div', 'quiz__actions');
      var start = makeElement(document, 'button', 'button button--primary', 'Начать');
      start.setAttribute('type', 'button');
      start.addEventListener('click', function () {
        state.step = 1;
        render();
      });
      actions.append(start);
      panel.replaceChildren(closeButton(), heading, copy, actions);
      status.textContent = 'Введение. Вопросов: 8.';
      result.textContent = '';
      if (moveFocus !== false) focusHeading(heading);
    }

    function renderQuestion() {
      var index = state.step - 1;
      var question = questions[index];
      var heading = makeElement(document, 'h3', 'quiz__heading', question.title);
      var fieldset = makeElement(document, 'fieldset', 'quiz__options');
      var legend = makeElement(document, 'legend', 'sr-only', 'Выбери реакцию');
      var actions = makeElement(document, 'div', 'quiz__actions');
      var back = makeElement(document, 'button', 'button button--secondary', 'Назад');
      var next = makeElement(document, 'button', 'button button--primary', index === questions.length - 1 ? 'Показать результат' : 'Далее');
      var name = 'ordinary-quiz-question-' + String(state.step);

      fieldset.append(legend);
      [
        { value: 'autopilot', label: 'Автопилот', text: question.autopilot },
        { value: 'critical', label: 'Критическое мышление', text: question.critical },
      ].forEach(function (option) {
        var label = makeElement(document, 'label', 'quiz__option');
        var input = makeElement(document, 'input');
        var copy = makeElement(document, 'span');
        var optionName = makeElement(document, 'strong', '', option.label + ': ');
        var optionText = makeElement(document, 'span', '', option.text);
        input.setAttribute('type', 'radio');
        input.setAttribute('name', name);
        input.setAttribute('value', option.value);
        input.type = 'radio';
        input.name = name;
        input.value = option.value;
        input.checked = state.answers[index] === option.value;
        if (input.checked) label.className = 'quiz__option quiz__option--selected';
        input.addEventListener('change', function () {
          state.answers[index] = option.value;
          next.disabled = false;
          Array.prototype.forEach.call(fieldset.children, function (child) {
            if (child.tagName === 'LABEL') child.className = 'quiz__option';
          });
          label.className = 'quiz__option quiz__option--selected';
        });
        copy.append(optionName, optionText);
        label.append(input, copy);
        fieldset.append(label);
      });

      back.setAttribute('type', 'button');
      back.addEventListener('click', function () {
        state.step -= 1;
        render();
      });
      next.setAttribute('type', 'button');
      next.disabled = state.answers[index] === null;
      next.addEventListener('click', function () {
        if (state.answers[index] === null) return;
        state.step += 1;
        render();
      });
      actions.append(back, resetButton(), next);
      panel.replaceChildren(closeButton(), heading, fieldset, actions);
      status.textContent = 'Вопрос ' + String(state.step) + ' из 8.';
      result.textContent = '';
      focusHeading(heading);
    }

    function renderResult() {
      var count = state.answers.filter(function (answer) { return answer === 'autopilot'; }).length;
      var heading = makeElement(document, 'h3', 'quiz__heading', 'Результат проверки');
      var explanation = makeElement(document, 'p', '', 'Цель — не жить в режиме вечной критической проверки. Достаточно одного вопроса в момент, когда кто-то очень хочет, чтобы ты не успел его задать.');
      var actions = makeElement(document, 'div', 'quiz__actions');
      var back = makeElement(document, 'button', 'button button--secondary', 'Назад');
      var restart = makeElement(document, 'button', 'button button--primary', 'Пройти ещё раз');
      var verdict = 'Обнаружено автопилотов: ' + String(count) + ' из ' + String(questions.length) + '. ' + resultText(count);
      back.setAttribute('type', 'button');
      back.addEventListener('click', function () {
        state.step = questions.length;
        render();
      });
      restart.setAttribute('type', 'button');
      restart.addEventListener('click', reset);
      actions.append(back, restart);
      panel.replaceChildren(closeButton(), heading, explanation, actions);
      status.textContent = 'Проверка завершена.';
      result.textContent = verdict;
      focusHeading(heading);
    }

    function renderClosed() {
      var heading = makeElement(document, 'h3', 'quiz__heading', 'Тест закрыт');
      var copy = makeElement(document, 'p', '', 'Ответы остались на месте только в этой вкладке. Можно вернуться к тесту или продолжить читать страницу.');
      var reopen = makeElement(document, 'button', 'button button--primary', 'Вернуться к тесту');
      reopen.setAttribute('type', 'button');
      reopen.setAttribute('data-quiz-reopen', '');
      reopen.addEventListener('click', function () {
        closed = false;
        render();
      });
      panel.replaceChildren(heading, copy, reopen);
      status.textContent = 'Тест закрыт.';
      result.textContent = '';
      reopen.focus();
    }

    function render(moveFocus) {
      if (closed) {
        renderClosed();
      } else if (state.step === 0) {
        renderIntroduction(moveFocus);
      } else if (state.step <= questions.length) {
        renderQuestion();
      } else {
        renderResult();
      }
    }

    render(false);
  }

  global.OrdinaryQuiz = { mount: mount };
}(window));
