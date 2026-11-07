# Описание API-операции и доменный результат — #35

## Подтверждённые решения

Одна операция — переиспользуемое описание method/url и mapper успешного DTO.
Общий API-клиент выполняет транспортную работу; приложение не создаёт отдельный
HTTP-клиент на каждый endpoint. Mapper принадлежит data/api-операции, реализация
может находиться в data/mappers и возвращает доменные данные.

Владелец выбрал `createApiEffect`: экшены и эффекты остаются обычными объектами.
Классы и `instanceof` не вводятся. Базовый тест проверяет `effect.type`; полный
тест reducer дополнительно проверяет операцию и параметры. Создание операции,
эффекта и вызов reducer не выполняют HTTP, mapper, callbacks или dispatch.

Исключение mapper проходит через `onError` как `ApiFailure` kind `contract`,
с текущим `defaultError` при отсутствии AppErrors. Простой проброс в store не
обеспечивает UI-сообщение/выход из loading и для этого сценария не выбран.
Ошибки самих onSuccess/onError/dispatch не превращаются в ошибки ответа API.

## Подходы и выбор

Рассмотрены отдельная FC-фабрика, метод `operation.effect` и класс-конструктор.
Выбрана отдельная фабрика: data/api описывает операцию, FC связывает её с actions.
Проверка объекта по type соответствует существующим ApiEffect/DispatchActionEffect
и `effecting`, который выбирает handler по discriminator. Фабрика не требует
конструкторов для остальных эффектов и не становится их исполнителем.

Имя `defineApiOperation` оставлено отдельным от `define.state/reducer/effector`
намеренно: существующий `define` относится к FC, а описание API-операции — к
слою `api` и используется без actions/reducers. Функция экспортируется из `api`,
`createApiEffect` — из `fc`; `api` не импортирует FC ради определения операции.
Добавлять API-специфику в существующий FC namespace для этой задачи не требуется.

## Предлагаемый публичный API

```ts
// features/user/data/api/load-user.ts
export const loadUser = defineApiOperation<Paths>()({
  method: 'post',
  url: '/user',
  mapResponse: mapUserDto,
});
```

DTO берётся из Paths для конкретных method/url. `mapUserDto` принимает этот DTO
и возвращает User; data/api не импортирует feature actions или reducers.
Когда преобразование не нужно, mapResponse в definition не требуется: фабрика
сохраняет identity-преобразование. Возвращённое описание содержит readonly
method/url/mapResponse; оно не захватывает API-клиент.

```ts
// features/user/domain/fc/reducer.ts, LoadAction handler
return {
  state: { ...state, status: 'loading', errors: [] },
  effects: [
    createApiEffect(loadUser, {
      body: { email: state.email },
      defaultError: loadUserError,
      onSuccess: (user) => {
        return { scope: 'users', type: 'SuccessReceiveAction', response: user };
      },
      onError: (errors) => {
        return { scope: 'users', type: 'ErrorReceiveAction', errors };
      },
    }),
  ],
};
```

`createApiEffect(operation, options)` — прямой вызов, без generic доменного
response и без отдельного instance factory на каждый запрос. Тип user выводится
из mapper; отдельные success/error action types выводятся независимо и затем
проверяются при включении эффекта в RootEffect. Это сохраняет literal type/scope
и не требует, чтобы два callbacks возвращали один и тот же вариант action.

Эффект содержит `type: 'ApiEffect'`, ту же ссылку operation, копии её method/url,
request options, defaultError и исходные callbacks. Поля открыты для проверки;
никакой скрытый исполнитель не заменяет onSuccess другим callback.
Method/url задаёт операция, они не переопределяются options.
Фабрика возвращает один эффект; `Commit.effects` — массив, поэтому reducer
возвращает `effects: [createApiEffect(...)]`, а тест проверяет
`result.effects[0].type`, ссылку operation и параметры этого элемента.

## Типизация

Публичный `ApiOperation` связывает схему Paths, маршрут и mapResponse на уровне
типов. Paths передаётся generic-параметром; пользователь не задаёт поле schema,
а объект не содержит runtime OpenAPI-документа или клиента. Если для вывода типов
нужен phantom-маркер, он остаётся внутренней деталью типов, без runtime поля.
Конкретные внутренние witness/helpers выбирает реализация. Mapper input всегда
выводится из ApiResponse выбранного маршрута; свободного generic, подменяющего DTO ответа, не добавляется.

Definition — discriminated union method/url с contextual DTO mapper. Request
options выводятся из того же upstream FetchOptions для выбранной операции,
с сохранением required params/body и JSON-only parseAs. Повторное разворачивание
всей тяжёлой ApiRequest union ради одного endpoint избегается: read-only TS 5.9.3
эксперимент показал union-too-complex у наивного Extract, а endpoint lookup
проверяет required body/params, mapper input и доменный callback без этой ошибки.

Поддерживается только JSON (`parseAs` отсутствует либо равен `'json'`). Это
ограничение действует для `ApiClient.request` и `ApiEffect`.
Операции не добавляют поддержку blob/text. Другие форматы ответа потребуют отдельного изменения API.
Термин mapper ниже обозначает именно функцию поля `mapResponse`.

Единственный формат эффекта содержит обязательную operation. Владелец уточнил,
что модуль находится в разработке: сохранять прежний формат не требуется.
Публичный тип связывает операции с отдельными SuccessAction и ErrorAction,
без отдельного generic Paths. onSuccess возвращает только SuccessAction,
onError — только ErrorAction; каждый может быть union. Фабрика выводит типы
callbacks независимо, прикладной ApiEffect закрепляет допустимые роли. Если
callback отсутствует, можно указать never. Handler проверяет, что оба типа
результатов входят в RootAction:

```ts
type ApiOperation = typeof loadUser;
type SuccessAction = Extract<RootAction, { type: 'SuccessReceiveAction' }>;
type ErrorAction = Extract<RootAction, { type: 'ErrorReceiveAction' }>;
type AppApiEffect = ApiEffect<ApiOperation, SuccessAction, ErrorAction>;

// Один общеприкладной handler, без runtime реестра endpoint handlers.
const handlers = createApiHandler<Paths, RootAction, ApiOperation>(api);
```

Несколько операций агрегируются union типов: `typeof loadUser | typeof updateUser`.
Handler проверяет соответствие операций схеме клиента. Общий клиент по-прежнему
знает только Paths. Операция без mapResponse использует identity-преобразование;
прямой api.request возвращает DTO и не зависит от FC.

Это сохраняет корреляцию operation/params/mapper/onSuccess и проверку actions
в рамках RootAction, без публичного стирания callback до any/never. Type erasure
разрешён только в едином внутреннем runtime-adapter handler, как у существующей
динамической отправки request; несовместимые публичные запросы/callbacks должны
отклоняться TypeScript. Compile-time tests проверяют также прямой вызов handler.
При runtime выборе definition из union сохраняется union отдельных операций,
а не один объект с объединёнными method/url. Перед createApiEffect такая
операция должна быть сужена до конкретной ветки; несуженный union отклоняется,
чтобы options одного маршрута не обходили обязательные параметры другого.
RootEffect/handler продолжают принимать union уже корректно созданных эффектов.

## Исполнение и ошибки

1. Все API-эффекты имеют `type: 'ApiEffect'` и обязательную operation. Handler
   отделяет operation/callback metadata от native request options; альтернативных
   форматов и проверки наличия operation нет.
2. Выполняет один запрос через внедрённый общий ApiClient.
3. ApiResult error сразу направляется в существующий error path: mapper и
   onSuccess не вызываются; классификация http/network/contract/aborted сохраняется.
4. ApiResult ok для operation вызывает её mapper ровно один раз. Предлагается
   поддержать sync и Promise-returning mapper одним await; onSuccess получает
   Awaited result, а не Promise. Ни mapper, ни callbacks не запускаются в reducer.
5. Только выполнение mapper находится внутри catch. Исключение/rejection даёт
   `{ kind: 'contract', errors: [] }`, без ложного HTTP status: ApiResult success
   не сохраняет response.status. onSuccess не вызывается, existing onError path
   получает `[defaultError]` и failure. mapErrors клиента повторно не вызывается.
6. При успешном mapper onSuccess, если есть, возвращает action; handler ожидает
   dispatch. Исключения callbacks/dispatch выходят в прежний store error reporter.

Mapper вызывается при успешном ответе и без onSuccess: преобразование/проверка
описанной операции сохраняется. Если mapper успешен и onSuccess отсутствует,
нет dispatch. Если onError отсутствует, failure отклоняется в общий store error
reporter, как сейчас; UI-сообщение требует прикладного onError.

JSON null остаётся допустимым DTO: mapper получает null, если это допускает
схема. HEAD/204 дают undefined; mapper получает undefined либо identity сохраняет
его. Нет truthiness-пропуска валидных null/undefined результатов. Mapper input
и callback type учитывают соответствующие unions.

Aborted failure транспорта не запускает mapper. Поздняя отмена после получения
ответа не вводит новую отмену mapper; исключение внутри mapper относится к фазе
преобразования, а не повторно к network/aborted. Дополнительная нормализация
клиента не дублируется. Исходное исключение mapper не включается в текущий
ApiFailure контракт; диагностика/расширение логгера остаётся отдельной #4.

## Пример и зависимости

Обновляется существующий functional-core example: synthetic Paths содержит DTO
с snake_case полями, доменный User сохраняет id/name/email. DTO alias извлекается
из schema через публичный ApiResponse; сгенерированные shape не дублируются.

Добавляются data/dto, data/mappers и data/api/load-user.ts по необходимости.
Reducer описывает createApiEffect и работает с User в SuccessReceiveAction;
shared handler остаётся один. Synthetic transport/fake API возвращают DTO,
mapper переводит его в User. DOM/поведение успеха, ошибки и retry сохраняются.

Направление: FC → data/api → mapper → domain/entities. DTO/операция не импортируют
feature actions, RootEffect или reducer. Общий ApiClient не импортирует User.
Не нужны зависимости common от Svelte, новые пакеты или сторонняя runtime schema
validation library. Mapper не объявляется автоматическим валидатором всех DTO.

## Проверки и поставка

- Compile-time: route/method, required path/query/body, JSON-only parsing,
  schema-derived mapper input, mapped callback result, optional identity,
  несколько разных action variants, неверные actions в RootEffect и handler.
- Type tests отклоняют эффект без operation и не-JSON parseAs. Прямой request
  сохраняет DTO-контракт. Operation metadata не передаётся в API-клиент.
- Runtime: mapped success, identity, null/204/HEAD, sync/async mapper failure,
  все transport kinds, optional callbacks, fallback AppErrors, awaited dispatch.
- Mapper не вызывается для failure; callbacks/dispatch errors не переклассифицируются;
  operation/callback metadata никогда не доходит до injected client.
- Spy-tests подтверждают отсутствие HTTP/mapper при definition/effect construction
  и вызове reducer. Reducer tests проверяют type/operation identity/request payload;
  поведение mapper/callback/action/dispatch — через настоящий createApiHandler.
- Pure mapper/example tests и существующие browser tests подтверждают различные
  DTO/domain shape и сохранение интерфейсного результата.
- Полный root check, production example build, public exports/docs, actual
  tarball и внешний TS/runtime consumer, отсутствие src/tests в пакете.
- Changeset common minor для нового API; публикация и изменение gost-spec #88
  не выполняются автоматически. #18 остаётся в своей сохранённой ветке.

## Основания и статус

Источник — gost-kit #35 и согласованная архитектура gost-spec #88. Изучены
существующие createApiClient/ApiEffect/createApiHandler, установленный
openapi-fetch 0.17.0 и его официальная API-документация:
https://openapi-ts.dev/openapi-fetch/api . Upstream отвечает за route/options/DTO,
а operation mapper — добавляемая прикладная граница домена.

Фабрика/обычные объекты и UI-путь ошибки mapper подтверждены в обсуждении.
Дизайн утверждён владельцем перед реализацией; техническое уточнение о сужении
union операций добавлено по результатам ревью реализации. Примеры нового API пока не являются опубликованными
возможностями библиотеки.
