# Один intent dispatch в бизнес-обработчике — #17

## Контракт владельца

В бизнес-компоненте UI-Kit сообщает готовое намерение или значение; обработчик
отправляет одно action. Выбор бизнес-перехода и эффектов находится в reducer.
Presenter вычисляет представление и не заменяет reducer или mutable store.

UI-Kit вправе содержать локальное состояние, browser events и условия их
обработки. В бизнес-фиче этих механизмов быть не должно: если механизм нужен,
следует спроектировать компонент библиотеки и использовать его через контракт.
Для `KeyboardEvent`, `SubmitEvent`, `preventDefault`, проверки клавиш и прочей
DOM-адаптации нет специальных послаблений в бизнес-обработчиках.

```svelte
<UserEditor onsubmit={handleSubmit} onemailchange={handleEmailChange} />
```

```ts
const handleSubmit = () => {
  void dispatch({ type: 'SubmitUserAction' });
};
const handleEmailChange = (email: string) => {
  void dispatch({ type: 'ChangeEmailAction', email });
};
```

Примеры показывают контракт, а не обещают поставку `UserEditor` или UI-Kit в #17.
Решение локального UI-state остаётся отдельной #27. Существующее ref-исключение
#16 не расширяется в разрешение browser-event логики в бизнес-фичах.

## Подход и подключение

Предлагается `gost/single-intent-dispatch` в существующем ESLint-плагине.
Подключение как в #16: публичный Svelte config регистрирует правило, но оставляет
выключенным; потребитель включает его для бизнес-компонентов и исключает UI-Kit
обычными overrides. Никакого `architecture`/`fc-presenter` флага.

Распознавание только по имени `dispatch` даёт ложные срабатывания. Структурная
совместимость `(action) => Promise<void>` недостаточна: это может быть обычная
функция или `AsyncTap`. Поэтому используется происхождение публичного типа
`Dispatch` из настоящего `@gost-kit/common`, а не одноимённого локального типа.
Это единственный подход, соответствующий уже заданному критерию #17.

Read-only эксперимент с TypeScript 5.9.3 подтвердил различимость `Dispatch`,
`Store.dispatch`, результата `createStore`, const alias и destructuring;
отдельный type alias меняет `aliasSymbol`, поэтому нужна поддержка цепочки
деклараций aliases, а не сравнение имени. Обычный callback и общий `AsyncTap`
не должны считаться Dispatch. Никаких изменений runtime API ради линтера.

## Область первой версии — техническое предложение

- Только TypeScript instance scripts выбранных `.svelte` файлов. Module scripts,
  `.svelte.ts` effectors/shell и обычные TS-функции сами по себе не UI-handlers.
- Обработчик определяется через передачу в `on*` attribute/component prop,
  включая camelCase callback names, и legacy `on:` directive. Имена `handle*`
  сами по себе ничего не доказывают. Произвольные callback props без `on` prefix
  в первой версии не угадываются; ограничение явно документируется.
- Поддерживаются inline arrow/function, локальная function declaration,
  const function expression и простые const aliases по lexical binding.
  Forwarding `onconfirm={presenter.confirm}` не запрещается сам по себе;
  импортированный или вычисленный метод и произвольные helper-графы не
  анализируются межмодульно. Чистота presenter остаётся отдельным контрактом.
- В собственном теле найденного handler считаются настоящие прямые Dispatch
  calls, включая await/void. Вложенная функция сама по себе не исполняется:
  её calls не прибавляются к handler, если только она отдельно не передана
  как обнаруживаемый callback. Поддержка произвольного call graph не обещается.
- Обычные эффекторные callbacks вне обнаруженных UI handlers не проверяются.
  Правило не распространяется на весь файл просто из-за наличия Dispatch.

В TS script включённое правило без parser services/type information выдаёт
configuration error, как существующее typed selector rule. JS scripts и файлы
вне поддержанного scope пропускаются до запроса services. Отсутствие доступных
типов не выдаётся за успешно проверенную бизнес-архитектуру.

## Диагностики

1. Два и более Dispatch calls в одном handler — несколько намерений. Проверяется
   статический набор вызовов, а не максимальное число на одном executed path:
   `if (condition) dispatch(A); else dispatch(B)` также является нарушением.
2. Handler с настоящим Dispatch и `if`, `switch`, циклом, тернарным выражением
   или short-circuit управлением в его собственном теле — логика выбора в UI.
   Вложенные функции исключаются из обхода. Ранний `return` по условию перед
   одним dispatch также диагностируется; browser-event guard не исключение.
3. Условный выбор внутри переданного action (`type: condition ? 'A' : 'B'`)
   входит в предыдущий случай. Литерал action и прямое чтение готового значения
   (`{ type: 'ChangeEmailAction', email }`) допустимы. Произвольное вычисление
   action, спрятанное в импортированном helper, не считается проверенным.

На один handler выдаётся одна диагностика: несколько Dispatch calls имеют
приоритет над условной логикой; иначе сообщается первое найденное условие.
Это исключает каскад однотипных сообщений для `if/else` с двумя dispatch.

Диагностика предлагает одно intent action и перенос выбора в reducer; для
browser-механизма нужен библиотечный компонент. Нет autofix/suggestions,
создающих action, reducer или компонент: их контракты требуют проектирования.

Успех правила не доказывает отсутствие всех browser APIs, скрытых вычислений
или бизнес-логики. Полный запрет DOM/browser API не добавляется скрытно в #17.
В частности, одиночный `preventDefault` без ветвления не становится автоматически
диагностикой этого dispatch-правила, хотя нарушает контракт бизнес-компонента.
Сравнения/вычисления presentation — #19, включая шаблоны; boolean `{#if}` — #18.

## Проверки и поставка

- Valid: один прямой/await/void dispatch, готовое значение callback, локальный
  alias, unrelated function named dispatch, direct callback forwarding,
  обычный effector с несколькими dispatch, UI-Kit off override.
- Invalid: последовательные calls, mutually exclusive branches, early guard,
  switch/loop, ternary action type, short-circuit dispatch, aliases реального
  Dispatch, `Store.dispatch` и inferred `createStore`.
- Provenance: type aliases/reexports и const/destructuring aliases, nested common
  installation, локальный одноимённый тип, any/unknown/смешанная union и `AsyncTap`.
  Nullable genuine Dispatch определяется после исключения null/undefined.
  Смешанные unions с обычным callback/AsyncTap не признаются доказанным Dispatch;
  если TypeScript стёр различие происхождения, анализ не угадывает его обратно.
- Scope: inline/named/aliased handlers, одинаковые имена в разных scopes,
  module/instance separation, nested function не прибавляет вызовы внешнему
  handler, ready callbacks без browser-event параметров.
- Настоящие Svelte compiler/parser fixtures; ожидаемые rule ID/message и отсутствие
  fix. Type/parser errors не служат доказательством архитектурной диагностики.
- Реальные packed plugin/config во внешнем consumer; default off, explicit on,
  UI-Kit off сохраняет прочие checks. Нет новых runtime dependencies common/Svelte.
- Полный root check и существующий пример; README/RULES/changeset обновляются.
  Нативный DOM-пример не объявляется эталоном новой UI-Kit границы: миграция
  самого примера на библиотечные компоненты не входит в поставку этого правила.

## Статус

Требования владельца о границе UI-Kit/бизнес-фичи закреплены в issue #17;
расширение #19 на шаблоны также записано в задаче. Технические границы первой
версии выше предложены исполнителем и ожидают подтверждения дизайна до
реализации. Нормативные документы gost-spec не объявляются автоматически
утверждёнными этим локальным дизайном.

Builder-check выполнен: уточнены поведение без type services и отказ от
распознавания смешанных unions; иных важных вопросов для плана не осталось.
