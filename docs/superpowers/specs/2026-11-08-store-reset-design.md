# Сброс store и фабрики scope state — #32

## Цель и согласованные решения

Добавить `store.reset()` и `store.reset({ excluded })` к существующему store.
Экземпляр store, dispatch и обработчики сохраняются. Shell не определяет, когда
приложению нужен сброс: маршрутизация, загрузка, отмена запросов и persistence
остаются отдельными задачами #33/#34.

Владелец выбрал одну RootState-фабрику в `initState` и уточнил: каждый scope
имеет свою фабрику с возможностью переопределения полей. Корневая фабрика
композирует scope factories. Это одновременно способ инициализации, сброса и
подготовки состояния для тестов.

```ts
const usersState = define.state<UsersState>((options = {}) => ({
  data: [],
  errors: [],
  ...options,
}));

const rootState = define.state<RootState>((options = {}) => ({
  users: usersState(),
  auth: authState(),
  ...options,
}));

const store = createStore({
  initState: rootState,
  reducer,
  effector,
});

// Подготовка данных для reducer-теста:
const state = rootState({
  users: usersState({ errors: [apiError()] }),
});

store.reset();
store.reset({ excluded: ['auth'] });
```

Имена usersState/authState/apiError здесь иллюстрируют композицию, а не добавляют
новые бизнес-фичи в пример. В существующем примере сохраняются реальные имена
`initialState`/`userState`; root factory переводится на `define.state` для
поддержки overrides.

## Рассмотренные подходы

1. Одна root factory, вызывающая scope factories — выбран владельцем. Сохраняет
   существующую композицию приложения; shell работает только с RootState.
2. Карта отдельных фабрик по root keys — позволяет не вычислять исключённые
   scopes, но переносит сборку RootState в shell и требует нового формата config.
3. Готовый объект с клонированием при reset — не выбран: клонирование не заменяет
   доменные фабрики и не подходит произвольным типам данных.

`StoreConfig.initState` становится синхронной фабрикой `AnyFn<[], TState>`.
При создании store она вызывается один раз, при каждом reset — ещё один раз.
Переход `initState: initialState()` → `initState: initialState` применяется ко
всем потребителям в репозитории, документации и compile-time fixtures.
Примитивный counter использует `initState: () => 0`.

Это осознанное изменение API на стадии разработки. Старое требование issue о
совместимости готового `initState` заменяется выбранным фабричным контрактом;
не вводим legacy-вариант или автоматическое клонирование. Требуется отражение
breaking API change в changeset для текущей версии 0.x.

## Свежесть и overrides

Каждый вызов фабрики создаёт новые изменяемые объекты/массивы своего scope.
Вложенные scopes получают данные из собственных фабрик. Переданные overrides
сохраняются как есть: `rootState({ users })` использует именно ссылку `users`.
Это shallow override, не deep merge и не clone.

Существующий `define.state(factory)` уже поддерживает этот контракт. Его
реализацию менять не требуется. Вариант `define.state(object)` остаётся общим
существующим API, но его shallow spread не обеспечивает свежесть вложенных
данных и не рекомендуется для resettable state с изменяемыми вложениями.
Store не проверяет глубину, не клонирует результат и не замораживает его:
свежесть обеспечивают фабрики, а не реактивный runtime.

Два store из одного config независимо вызывают factory. Если factory возвращает
общий объект, библиотека не превращает его в отдельную копию.

## Контракт reset

- Синхронный метод с результатом `void`; нет аргументов либо именованный объект
  `{ excluded?: readonly ...[] }`.
- Без excluded, с `undefined` или с пустым списком — полный сброс.
- Для частичного сброса excluded содержит только верхнеуровневые ключи TState.
  Дубли допустимы и не меняют результат. Исключения задаются на каждый вызов.
- Полный свежий state создаётся root factory, затем исключённые поля заменяются
  текущими значениями из store, включая прежние ссылки на объекты/массивы.
  Factory исключённых scopes тоже вызывается: это цена выбранной root-композиции.
- Возвращаемое фабрикой состояние не мутируется при композиции исключений;
  текущий state также не мутируется.
- Только после успешного вычисления всего результата выполняется один writeState.
  Нет промежуточных публикаций по scopes. Каждый reset вызывает factory заново.
- Если factory бросает исключение, reset синхронно бросает его, текущее состояние
  не меняется. Существующий action-bound StoreError не получает фиктивный action.
- Если все scopes исключены, их ссылки сохраняются; root factory всё равно
  вызывается. Не обещаем уведомление Svelte-потребителей при равных результатах:
  одна запись состояния не означает обязательный rerun каждого derived.

Полный reset поддерживает существующие корни-примитивы и массивы. Непустой
excluded предназначен для object root со scope keys, а не индексов массива или
методов примитивов. Типы запрещают такие исключения для primitive/array/function
root; `reset()` и пустой список доступны. Частичный reset поддерживает root
фиксированной структуры с независимыми scopes. Для union root разрешён только
полный reset: сохранение общего discriminator из текущего варианта вместе с
полями свежего варианта могло бы создать невалидное состояние. Типы исключают
непустой excluded для union root; union внутри отдельного scope разрешён,
поскольку scope сохраняется целиком. Статические numeric/symbol keys object root поддерживаются наряду со
строковыми; readonly scopes не мешают сборке нового состояния.

Для JavaScript/обхода типов неизвестный excluded key отклоняется синхронным
TypeError без записи. Ключ должен быть собственным полем текущего и свежего
root, унаследованные поля не считаются scopes. Непустой excluded для не-record
root также отклоняется. Ошибка проверки свежего root может произойти после
вызова factory, но до публикации. Поддерживаемый object root — обычная запись
данных; экземпляры классов, getters и произвольные property descriptors не
добавляются к текущему контракту store.

## Разделение common / Svelte

В common/fc добавляется framework-independent `createReset` по аналогии с
`createDispatch`: конфигурация `initState`, `readState`, `writeState`; результат —
типизированный reset method. Он отвечает за factory, исключения и одну запись.
Тесты чистого выполнения располагаются рядом с реализацией.

Публичные `Reset<TState>`, `ResetOptions<TState>` и конфигурация createReset
экспортируются из common, каждый публичный тип — в собственном файле.
`Store<TState, TAction>` получает `reset: Reset<TState>`, `StoreConfig.initState`
становится фабрикой. `createDispatch` не получает зависимости от reset/factory;
его config уже исключает initState. Точные имена вспомогательных приватных типов
оставлены реализации.

Svelte createStore один раз получает начальное значение из initState и создаёт
`$state.raw`. Общие readState/writeState подключаются к dispatch и reset.
В reset нет Svelte API, а common не зависит от Svelte. Сохраняются getter state,
отсутствие глубокого proxy и прежняя семантика dispatch.

## Уже выполняющиеся эффекты

Reset не отменяет эффекты, не завершает их promises и не вводит generation id.
Поздний dispatch читает актуальное состояние после reset и может снова заполнить
его данными. Эффект, начавшийся до reset, остаётся частью прежнего ожидания
dispatch. Не добавляем автоматическое игнорирование ответов, reset action или
запуск эффектов при reset. Фабрики состояния синхронные и без side effects.

## Проверки и поставка

1. Common tests: полный/частичный/пустой/повторный reset, несколько исключений,
   дубли, сохранение ссылок, свежие вложения через scope factories, overrides для
   reducer-теста, отсутствие мутаций, factory exception без записи, неверные
   runtime keys, numeric/symbol keys, primitive/array full reset и одна writeState.
2. Type tests: ключи RootState, readonly список, ошибочные ключи, исключения для
   non-record/union roots, union внутри scope; Store/StoreConfig inference и фабрики с
   необязательными overrides. Готовый объект в initState больше не принимается.
3. Svelte integration: reset виден настоящему реактивному потребителю после
   flushSync; смешанные scopes публикуются согласованно одним обновлением;
   presenter исключённого scope не пересчитывается; store/dispatch идентичны;
   два store независимы, dispatch после reset работает; отложенный effect может
   отправить action после reset согласно описанному контракту.
4. Миграция существующих tests/fixtures, README и createStore spec. В примере
   root factory получает overrides, user factory уже их поддерживает. Не
   добавляем кнопку reset или UI-навигацию для демонстрации инфраструктуры.
5. Полный root check, build примера и существующие browser scenarios;
   Svelte autofixer для изменённых rune modules/components. Реальные tarballs
   common/svelte проверяются внешним consumer: exports, типы и runtime reset,
   отсутствие tests в пакете и Svelte dependency у common.
6. Changeset common + svelte с учётом изменения initState и публичного store.
   Один независимый whole-branch review перед PR. Публикация пакетов и merge
   требуют отдельного указания владельца.

## Статус

Подход root factory и композиция scope factories подтверждены владельцем.
Независимый builder check выявил риск смешивания вариантов union root при
частичном reset. Решение автора дизайна: непустой excluded только для root
фиксированной структуры; union внутри scopes не ограничивается. Это не
добавляет поддержку восстановления коррелированных вариантов к задаче #32.
Документ готов к согласованию; реализация не начата.
