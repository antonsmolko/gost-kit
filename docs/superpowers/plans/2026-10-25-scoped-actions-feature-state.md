# Scoped actions, feature state и presenter — план

> For agentic workers: use `superpowers:executing-plans` to implement the steps in this session. Работа идёт по блокам с пользовательским ревью перед следующим блоком.

**Goal:** разделить действия по namespace и обеспечить вычисление view state чистыми presenter-функциями без повторных вызовов при изменении другой фичи.

**Architecture:** functional core вычисляет обычные immutable-снимки корня. Стор хранит один снимок в `$state.raw`. Компонент сначала выбирает фичу отдельным `$derived`, затем связывает результат с чистым presenter через второй `$derived`.

**Tech Stack:** TypeScript 5.9, Svelte 5, Vitest, Playwright; существующие `@gost/common` и `@gost/svelte`.

**Spec:** решения пользователя, зафиксированные ниже; [FRONTEND-ARCH-002](https://github.com/antonsmolko/gost-spec/blob/main/packages/domains/frontend/architecture/presenter-composition.md). Прочитан локальный файл `gost-spec/packages/domains/frontend/architecture/presenter-composition.md`: он имеет статус proposed. Здесь подход применяется по запросу пользователя; статус самого стандарта не меняется.

## Договорённости и предлагаемая реализация

### Действия и маршрутизация

Идентичность действия — пара `scope + type`. Одинаковые `type` разрешены в разных фичах; payload зависит от обоих полей.

```ts
type UserAction =
  | { type: 'LoadAction' }
  | { type: 'SetEmailAction'; email: string };

type RootAction = ScopedActions<{
  users: UserAction;
  root: { type: 'ShowAlertAction'; status: 'error'; message: string };
}>;

dispatch({ scope: 'users', type: 'LoadAction' });
dispatch({ type: 'ShowAlertAction', status: 'error', message: 'Ошибка' });
```

- Действие без `scope` относится к `root`. В исходных типах корневых действий не требуется `scope?: 'root'`.
- Ранее согласованный явный вызов с `scope: 'root'` поддерживается через внутреннюю нормализацию типов на границе dispatch, без добавления этого поля вручную к исходным типам.
- Scope объявляется ключом карты, переданной прямо в ScopedActions, а не полем в локальном типе фичи. ScopedActions автоматически добавляет namespace в итоговый RootAction; отдельный RootActionMap не требуется.
- Вызовы dispatch с фичевыми действиями требуют явного scope. Отсутствие scope не означает поиск подходящего `type` среди фич.
- Namespace действия независим от ключа состояния. `users` может соответствовать `RootState.user`.

```ts
const reducer: Reducer<RootState, RootAction, RootEffect> = reducing({
  users: scope('user', userReducer),
  root: appReducer,
});
```

Корневая композиция выбирает таблицу по namespace, затем обработчик по `type`. Внутри таблицы фичи остаются ключи `LoadAction`, `SetEmailAction` и т. п.

### Functional core и обновление состояния

Уже реализованный контракт сохраняется:

```ts
LoadAction: ({ state, action }, rootState) => ({
  state: { ...state, status: 'loading' },
  effects: [],
}),
```

- Входной `state` — состояние фичи; второй аргумент — весь root state. Оба входа глубоко readonly на уровне типов.
- Feature reducer возвращает полное состояние своей фичи. Автоматического слияния её полей нет.
- `scopeHandler` подставляет результат в корень и сохраняет ссылки остальных веток.
- Прежняя ссылка feature state или отсутствие нового состояния сохраняет прежний корень; эффекты при этом не теряются.
- `dispatch` получает полный commit, синхронно записывает его до запуска эффектов и ожидает эффекты и вложенные awaited dispatch.
- Сохраняются категории ошибок `readState`, `reducer`, `writeState`, `effect` и существующая обработка ошибок.
- Рабочим остаётся простой `ExactState`. `ExactStateStrict` хранится отдельно для сравнения.

### Реактивность и presenter

Уточнённое решение пользователя: использовать стандартную цепочку из двух `$derived`, без дополнительного state binding.

```ts
const user = $derived(root.state.user);
const viewState = $derived(userPresenter(user));
```

- Стор хранит один обычный immutable-снимок в `$state.raw`. UI и reducer работают с этим снимком; отдельного стабильного представления нет.
- Корневая ссылка следует commit reducer. Ссылки неизменённых фич сохраняет functional core.
- При замене корня выбор фичи проверяется заново. Если ссылка на результат прежняя, downstream presenter не вызывается повторно.
- Входы из разных фич выбираются отдельно, затем передаются в presenter явно. Не создавать новый объект в selector при каждом чтении, если нужна остановка пересчёта по ссылке.
- Примитивы, массивы, классы и изменения состава свойств используют обычную замену снимка. Proxy, SvelteMap, обход свойств и дополнительная синхронизация корня не нужны.
- Presenter — обычная чистая функция или композиция по FRONTEND-ARCH-002: без store-import, эффектов, мутаций, скрытого состояния и rune API. Реактивные bindings остаются в компоненте.
- Добавление lint-правила для прямого чтения ветки при вызовах внутри `$derived`/`$derived.by` оформляется отдельной задачей, связанной с #5. Чтение в обработчиках событий само по себе не запрещается.

## Ограничения

- Соблюдать действующий `AGENTS.md`: общие типы и guards, публичные импорты пакетов, описательные generics, отдельный файл для публичного типа.
- Framework-independent код остаётся в `packages/common/src/fc`; Svelte binding — в `packages/svelte/src/shell/domain`.
- Скоупы вводятся для actions. Существующая маршрутизация effects по `type` сохраняется.
- Не добавлять action creators, обязательный presenter-класс, presenter factory, memoization API или глубокое сравнение данных.
- Входы functional core — доверенные типизированные объекты приложения; новая runtime-валидация внешних данных сюда не переносится.
- Изменения `gost-spec`, автоматическое принятие proposed-стандартов и публикация пакетов не входят в работу.

## Review focus

1. Два `LoadAction` с разными scopes и payload должны независимо типизироваться и маршрутизироваться.
2. Пропуск scope в вызове фичевого действия не должен неявно выбирать фичу; root-default не ослабляет проверки payload.
3. Обычный снимок reducer должен оставаться immutable; UI читает тот же snapshot, без отдельного представления.
4. Выбор фичи может пересчитываться при замене корня, но presenter не должен вызываться, пока ссылка выбранной фичи не изменилась.
5. Проверять именно вызовы presenter и использование view state: сравнения ссылок сами по себе не доказывают реактивную изоляцию.

## Блок 1. Действия по scopes

**Files:** `packages/common/src/fc/types/`, `lib/define.ts`, `lib/reducing.ts` и их тесты, публичный `fc/index.ts`; пример `features/user/domain/fc/action.ts`, `reducer.ts`, `store/types/action.ts`, `store/fc/reducer.ts`, компоненты, receivers и связанные тесты.

Пользовательский checkpoint 1 завершён коммитами `84e9369` и `02e08ad`: типы, вход dispatch, actions примера и замечания ревью. Scope задаётся в карте, переданной прямо в ScopedActions; локальные actions не содержат namespace.

Checkpoint 2 завершён коммитом `a533669` (pushed): `reducing` принимает карту пространств и выбирает обработчик по scope/type. Контракты выводятся из аннотации результата `Reducer` через `NoInfer`, чтобы сохранить контекстную типизацию inline handlers. Полноту проверяет `ScopedReducerHandlers`; уникальность ключей одной пары обеспечивает объектная карта. Перезапись, уже выполненная object spread до передачи карты, не обнаруживается. `Unique`/`Complete` продолжают проверять таблицы эффектов. Пример, документация и проверки state-flow/ошибок/логирования обновлены. Пользователь одобрил переход к реактивным веткам.

- [x] Сначала подготовить type-тесты для двух фич с одинаковым `LoadAction` и разными payload. Проверить narrowing `action` в каждом обработчике.
- [x] Добавить отрицательные случаи: неверный scope, чужой handler, неверный/отсутствующий payload, пропущенная таблица, пропущенный handler, optional/undefined handler и конфликт одной пары scope/type. Не обещать обнаружение конфликтов, уже стёртых ручным object spread до передачи в API.
- [x] Проверить root-action без scope в объявлении и вызове; явный `scope: 'root'`; ошибку вызова feature action без scope, если такого действия у root нет.
- [x] Выделить минимальные типы определения namespace и выбора его action-union. Уточнить тип Dispatch для ранее согласованного явного root-вызова, сохранив исходные объявления root-actions без scope.
- [x] Реализовать `reducing({ users: ..., root: ... })`: выбор таблицы и handler, нормализацию draft в commit. Исходный action передаётся обработчику и в ошибки без добавления поля scope во время выполнения.
- [x] Проверки покрытия и единственного владельца привязать к scope/type. Существующие `Unique`/`Complete` для effecting сохранить; не усложнять их ради общего механизма, если reducer-таблицы можно проверить отдельно.
- [x] Мигрировать пример: `UserLoadAction` → `{ scope: 'users', type: 'LoadAction' }`, аналогично остальные действия user. `ShowAlertAction` остаётся без scope. Обновить receivers, UI dispatch и тестовые ожидания.
- [x] Проверить общий state-flow, awaited nested dispatch и полный action-контекст ошибок/логирования.
- [x] Запустить корневой check, check/build примера и браузерные сценарии.
- [x] Пользовательское ревью checkpoint 2, правки и отдельный коммит перед следующим пунктом.

## Блок 2. Выбор feature state и presenter → view state

**Files:** `packages/svelte/src/shell/domain/createStore.test.ts`, test-only rune fixture в `__tests__`, README пакета/примера. `createStore.svelte.ts` сохраняет прежний `$state.raw` и единый snapshot. Затем отдельный checkpoint для presenter в user feature и `UserForm.svelte`.

Checkpoint 3 пересмотрен по выбору пользователя: локальный createStateBinding и его тесты удалены, они не попадали в коммиты. Выбрана цепочка из двух `$derived`. Это сохраняет контракт ссылок снимков и убирает отдельный механизм реактивных веток.

- [x] Проверить RED: без промежуточного выбора presenter повторно вызывается после изменения другой фичи.
- [x] Добавить промежуточный `$derived` в test-only fixture, проверить отсутствие лишнего вызова, обновление view state при замене user и сохранение результата при новой ссылке корня с прежним user.
- [x] Восстановить `$state.raw` в createStore и проверки равенства снимков по ссылке. Сохранить config handlers/this, commit-before-effects и обработку ошибок.
- [x] Проверить прежние снимки reducer после следующих commit и примитивный корень.
- [x] Обновить документацию выбранного подхода. Завести отдельную задачу на lint-правило.
- [x] Проверить Svelte-код, полный check/build и браузерные сценарии; пользовательское ревью и коммит checkpoint 3 (`7dc0aeb`). Дополнительные review-тесты массивов/классов и контроль прямого presenter — `7b3ce83`.
- [x] Следующим checkpoint добавить чистый presenter-пример по FRONTEND-ARCH-002 и unit-тесты входов/выходов и отсутствия мутаций.
- [x] Подключить presenter в UserForm через отдельный выбор user и вычисление view state.
- [ ] Проверить компонент браузерными сценариями, пользовательское ревью и коммит checkpoint presenter.

## Финальная проверка и документация

- [ ] Обновить README common, svelte и примера: root-default, независимость namespace/state key, новый reducing и цепочка выбора feature state перед presenter/view state.
- [ ] Описать границу производительности: core по-прежнему собирает immutable-корень, выбор фичи перепроверяется при его замене; цепочка derived устраняет лишние вызовы presenter, а не все операции над корнем.
- [ ] Выполнить `npm run check` в корне.
- [ ] Выполнить `npm run check`, `npm run build`, `npm run test:e2e` в `examples/functional-core`.
- [ ] Проверить package build/pack: корректные `.js`-импорты, публичные типы, отсутствие тестов, fixtures и временных probe-файлов в dist/пакетах.
- [ ] Сверить итоговый diff с решениями этого плана. Не заявлять ускорение без измерений: подтверждённый критерий здесь — отсутствие лишних вызовов presenter и корректное обновление view state.
- [ ] Коммитить блоки после пользовательского ревью; push — по запросу пользователя.
