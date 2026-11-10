# Local UI-component state (#27)

## Goal and agreed boundary

Переиспользуемый UI-компонент владеет своим состоянием взаимодействия, когда
потребитель не передал controlled value. Переходы тестируются без Svelte, DOM,
store и сети. Бизнес-state/решения приложения остаются у потребителя.

Владелец согласовал первый пример Disclosure и оба режима:

- uncontrolled: defaultOpen и собственное состояние экземпляра;
- controlled: open и onOpenChange, без внутренней mutable копии open.

## Approach

Выбранное направление — существующие common/svelte API. createStore уже создаёт
независимый raw state на каждый вызов. createDispatch принимает readState и
writeState, поэтому может работать с внешним controlled value.

Рассмотрены:

1. Переиспользовать createStore/createDispatch и описать небольшой компонентный
   adapter в примере — выбранное предложение, общий runtime уже достаточен.
2. Добавить generic createComponentStore в библиотеку — пока нет функционального
   пробела, который оправдывал бы новый публичный export.
3. Написать отдельный UI-state engine — дублировал бы reducer/dispatch semantics.

Первая поставка — рабочий UI-Kit пример и руководство по композиции. common и
svelte не получают новых exports; Disclosure не публикуется как библиотечный
виджет. Если практика покажет повторяющийся adapter, его вынос — отдельное
обоснованное изменение. Остальные точные контракты ниже — предложение автора
для утверждения, не ранее принятые решения владельца.

## Functional core

Компонентный FC использует public imports @gost-kit/common:

- DisclosureState: { readonly open: boolean }.
- disclosureState(options = {}) создаёт state через define.state(factory).
- DisclosureAction: ToggleAction или SetOpenAction с open: boolean.
- DisclosureEffect: { type: 'OpenChangeEffect'; open: boolean }.
- define.reducer + reducing дают Reducer<State, Action, Effect>.

ToggleAction инвертирует текущее open. SetOpenAction выбирает переданное open.
Если значение изменилось, reducer возвращает новый state и один OpenChangeEffect.
Если SetOpenAction оставляет то же значение, возвращаются исходный state и [].
Входы не мутируются; DOM events, callbacks и props не попадают в core.

OpenChangeEffect — одно семантическое уведомление о новом значении, а не эффект
для каждого браузерного механизма. Pure tests проверяют state и описание эффекта.
Это также сохраняет уведомления true/false при двух быстрых переключениях:
не нужно после await читать уже изменившийся state и терять промежуточное значение.

## Component model and effects

createDisclosureModel — частная фабрика примера в Svelte adapter module, вызывается
один раз на экземпляр. Она предоставляет readonly state getter, dispatch и reset.
Это примерный DisclosureModel, не новая реализация публичного Store-контракта.

Общий effector определяется через define.effector и effecting. OpenChangeEffect
вызывает актуальный onOpenChange(effect.open); callback возвращает void или
Promise<void>. Тип callback использует AnyFn<[open: boolean], void | Promise<void>>.
Callback читается через getter, поэтому замена callback prop не захватывает
устаревшую функцию. Состояние и callbacks разных экземпляров не разделяются.

### Uncontrolled

Фабрика создаёт ровно один createStore<State, Action, Effect>. initState —
zero-argument factory со свежим объектом и initialOpen. initialOpen берётся из
defaultOpen при создании; при отсутствии defaultOpen это false.

Изменение defaultOpen после mount не меняет текущее значение или reset baseline.
dispatch коммитит state до уведомления; onOpenChange опционален. Его отсутствие
не мешает локальной работе. Прямые записи в state не используются.

### Controlled

Mutable local store/open не создаётся. createDispatch читает текущий props.open
через readState при каждом intent; временный State с этим boolean — вход reducer,
не хранимая конкурирующая копия. readonly state getter также читает актуальный
внешний value. writeState — no-op: публикацией значения владеет потребитель.
Общий reducer/effecting отправляет onOpenChange с предложенным значением.

Потребитель может принять, изменить, отложить или проигнорировать предложение.
До нового props.open интерфейс показывает прежнее значение. Внешние prop updates
обновляют UI и не вызывают onOpenChange. Несколько intents до принятия нового
value считаются от текущего value владельца, без optimistic buffer.

### Error, reset and lifecycle semantics

dispatch сохраняет common error reporting: callback throws/rejections считаются
effect errors, сообщаются через существующий reporter, Promise разрешается.
Uncontrolled state к этому моменту уже записан и не откатывается. Controlled
adapter не выбирает политику обработки бизнес-ошибок потребителя. Callback
completion/cancellation не вводит дополнительных правил поверх common.

model.reset() отправляет SetOpenAction с initialOpen, захваченным при создании.
Для uncontrolled это исходный defaultOpen; для controlled — исходный props.open.
Baseline — неизменяемый boolean для reset, не mutable текущее состояние.
Reset вызывает onOpenChange только при отличии от текущего value; в controlled
это запрос, который владелец вправе не принять. Метод возвращает Promise<void>.
Он не подменяет синхронный Store.reset: внутренний Store не выдаётся потребителю.
Компонент экспортирует reset(), делегирующий model.reset().

Модель не создаёт timers, subscriptions, observers или DOM refs. Поэтому отдельный
dispose/destroy API и фиктивный cleanup не добавляются. Уничтожение компонента
снимает Svelte bindings, но не сбрасывает другой экземпляр или app state. Уже
вызванные внешние async callbacks не отменяются; их дальнейшее поведение принадлежит
потребителю. Remount создаёт новый экземпляр с новым initialOpen.

## Component props and ownership

Disclosure.svelte принимает label: string и optional children: Snippet, а также
discriminated union:

- controlled: open: boolean, обязательный onOpenChange, defaultOpen?: never;
- uncontrolled: open?: undefined, defaultOpen?: boolean, optional onOpenChange.

Bind-open/$bindable не используются. Mode определяется при создании и фиксирован
на жизнь экземпляра. Для смены ownership нужно remount. Переход open из boolean
в undefined или обратно создаёт понятный TypeError через общий validator
ownership props. При создании модели или прямом чтении state getter ошибка
бросается наружу. В dispatch/reset validator выполняется внутри readState:
common сообщает { kind: 'readState', error: TypeError, action } через reporter
и разрешает Promise, без commit/уведомления. Валидация перед вызовом dispatch
не дублируется. Оба пути проверяются JS/runtime-тестами. Одновременные open/defaultOpen и
отсутствующий callback в controlled отвергаются типами и runtime validation.
Некорректные props — ошибки использования, не бизнес-валидация или AppError.

UI не выбирает бизнес-actions. Native button handler отправляет ToggleAction,
без DOM event в core. Потребитель получает только готовый boolean:
onOpenChange={(open) => root.dispatch({ type: 'SetDetailsOpenAction', open })}.
В бизнес-компоненте это отдельный именованный handler с одним dispatch.

## Presentation and accessibility

disclosurePresenter({ state }) — чистая функция в disclosure.presenter.ts:
готовит isOpen и isHidden. Component отдельно выбирает $derived(model.state),
затем вызывает presenter в другом derived. Имена модулей/тестов следуют AGENTS.

Markup: native button type=button, label, aria-expanded и aria-controls;
панель с соответствующим id и hidden={view.isHidden}. Содержимое остаётся
смонтированным при закрытии; скрытие не сбрасывает дочернее состояние.
Идентификатор экземпляра берётся из $props.id(); служебный panel id подготавливается
в script. Native button обеспечивает Enter/Space; custom keyboard/focus logic
не требуется для этого простого Disclosure.

Основа — [WAI-ARIA disclosure](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/)
и [Svelte props/id](https://svelte.dev/docs/svelte/$props).
Presenter guidance прочитана из FRONTEND-ARCH-002, gost-spec revision
f0a936c36458225dd58a896e7f5f6257dcf99821, proposed/Pending; стандарт не объявляется
принятым. Более точный file naming задан локальным AGENTS. Владелец явно разрешил
UI-Kit собственный interaction state; business ownership не переносится в UI-Kit.

## Placement and application integration

Все новые widget-specific файлы находятся в examples/functional-core:

- src/ui-kit/disclosure/domain/fc/ — State, Action, Effect, factory, reducer,
  pure colocated tests; отдельный файл на публичный тип.
- src/ui-kit/disclosure/model/ — private Svelte adapter и модельные тесты.
- src/ui-kit/disclosure/ui/ — Disclosure.svelte, presenter и его pure tests.
- src/ui-kit/disclosure/index.ts — удобный public entry примера.
- документация примера: подключение, оба режима, reset и границы.
- src/DisclosureExamples.svelte — потребитель для демонстрации двух независимых
  uncontrolled экземпляров и controlled экземпляра с app-owned значением.

В root примера добавляется detailsOpen: boolean с initial false и один root
SetDetailsOpenAction. Root reducer обновляет этот флаг, сохраняя user/alert refs.
DisclosureExamples выбирает root.state.detailsOpen, передаёт готовый prop и
именованный callback с одним root.dispatch; существующая авторизация/API фича
примера не меняется. UI-Kit не импортирует rootStore или RootAction.

В example ESLint config добавляется поздний override только для
src/ui-kit/**/*.svelte: no-component-state/single-intent-dispatch/
ready-boolean-condition/require-presenter выключены. Typed selector rule и обычные
Svelte/TypeScript проверки остаются. Глобальные config packages/policies не меняются.

## Verification

- Pure FC tests: Toggle из обоих состояний, SetOpen смена/no-op, identity,
  frozen inputs, effect type/payload, независимые factory states.
- Pure presenter: оба полных результата и input preservation.
- Adapter tests: два экземпляра; rapid toggles дают true/false по порядку;
  reset восстанавливает baseline только своего экземпляра; defaultOpen updates
  не меняют seed; actual callback replacement; optional callback и ошибки.
- Controlled: актуальное внешнее значение, принятие/отклонение/задержка,
  повторные requests до принятия, отсутствие optimistic copy; reset proposal;
  внешние updates не дают callback; mode/conflicting props errors.
- Real Svelte browser fixtures: две независимо открываемые панели, reset первой
  сохраняет вторую; unmount/remount первой сохраняет вторую; controlled внешний
  update и непринятое предложение; callback replacement; unique aria-controls/id,
  hidden content сохраняет mounted child state; keyboard Enter/Space.
- Application integration: готовый boolean приводит к одному root action;
  root state обновляет controlled UI, refs user/alert сохраняются.
- Существующие API browser scenarios остаются зелёными; compiler/typecheck,
  Svelte autofixer, полный root check, example build и Playwright checks.
- Без новых test dependencies: использовать существующие Vitest/Playwright,
  Svelte mount/unmount в browser-only test fixtures; pure FC tests не монтируют DOM.

## Delivery and non-goals

Новый пакет/движок/универсальный widget framework, общий контроллер библиотечных
компонентов и новые ESLint rules не входят. Нет dropdown navigation, focus trap,
click-outside, animations или миграции asc-admin/UI-Kit. Дополнительные component
contracts появляются отдельными задачами.

Это изменения private example/docs, не public package exports: changeset и npm
публикация не требуются. Библиотечный helper может появиться по результатам
повторного реального применения. Коммиты [gost-kit-27], отдельный draft PR;
merge/publish по отдельной команде владельца.

## Status

Два режима согласованы. Независимый builder check завершён: единственный вопрос
касался TypeError внутри dispatch/reset; контракт уточнён в соответствии с
существующим createDispatch (reporter + resolved Promise), отдельно от прямого
getter/создания. Дизайн готов к утверждению владельцем. Product implementation
не начат.
