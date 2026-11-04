# Базовый API-клиент и ApiEffect

Статус: направление согласовано владельцем 2026-11-04: «давай так, бери задачу 10». Технические решения первой итерации приведены ниже.
Основание: [задача #10](https://github.com/antonsmolko/gost-kit/issues/10).

## Цель

Один фреймворконезависимый вход для API-запросов с общей обработкой ответа и
ошибок. Развивать небольшими проверяемыми этапами. Сначала клиент, затем
обработчик ApiEffect; бизнес-фичи asc-admin сейчас не мигрировать.

## Подходы

- Единый большой transport/request: мало функций, но смешаны настройки,
  исполнение, интерпретация ответа и ошибки; владелец хочет декомпозицию.
- Короткая композиция именованных хелперов: выбранное владельцем направление.
  У каждой функции отдельная ответственность, обработка результата общая.
- Полноценная система middleware/plugins: возможное развитие при конкретной
  потребности, для первой версии не требуется.

## Первая версия — предложение

Использовать openapi-fetch как готовый HTTP-транспорт. Конкретные paths и
настройки передаются приложением. Клиент не импортирует Svelte, window,
application store или схему asc-admin. Не терять связь method/path с типами
params, body и response при создании общей обёртки; избегать any и assertions,
которые позволяют произвольно объявить тип ответа.

Публичный request централизует результат, внутренние функции разделяют:

- исполнение типизированной операции транспорта;
- интерпретацию HTTP-ответа: успешные данные, пустой 204, HTTP-ошибка;
- преобразование ожидаемых сбоев запроса в единый результат ошибки.

Форма результата — различимые success/error ветки; точные имена и типы
определяются техническим планом с учётом существующих Result и AppError.
Имеющийся Result<T> содержит Error, а не AppError: он не считается подходящим
автоматически, общий контракт нельзя менять ради совпадения названий.
HTTP failure отличается от отсутствия ответа. Ошибки разбора JSON и отмена
не должны ошибочно называться сетевыми. Ошибки потребительских callbacks и
reducer не попадают в обработку сетевых ошибок.

openapi-fetch уже разбирает тело ответа: повторный response.json() не нужен.
TypeScript-типы OpenAPI не заменяют runtime-валидацию; первая версия не обещает
полную проверку соответствия тела схеме. Отдельная функция-валидатор может быть
добавлена следующим этапом. Никаких повторных ручных обработок HTTP в endpoints.

## Порядок разработки

1. Утвердить базовый контракт клиента и технический план с публичными типами,
   размещением, зависимостями и RED/GREEN-проверками.
2. Реализовать и проверить минимальный клиент: JSON success, пустой 204,
   HTTP failure, сбой сети, невалидный JSON и отмена. Конфигурация явно передаётся;
   общий request остаётся короткой композицией хелперов.
3. Подключить ApiEffect к внедряемому клиенту: type/method/url/params/body,
   onSuccess/onError возвращают actions; общий обработчик выполняет dispatch.
   Правила defaultError согласовать в этом контракте, обработку HTTP не дублировать.
4. Добавлять возможности отдельными изменениями по реальным сценариям:
   runtime-валидация, auth/refresh, timeout/retry, особенности приложения.

Не включать в базу CSRF/Origin, browser storage, уведомления, автоматические
повторы и refresh. Headers/credentials/cache/redirect задаются через поддерживаемую
конфигурацию транспорта, не получают скрытых глобальных значений из asc-admin.

## Проверка и границы

Тесты рядом с реализацией, каждый публичный тип в отдельном файле. Использовать
публичные common helpers по точной семантике; внутри common — относительные
imports. Перед runtime-изменениями запускать failing behavior tests, после —
пакетные проверки и пример. Изменения runtime требуют changeset. Этот дизайн
не разрешает публикацию или миграцию asc-admin.

## Технические решения первой итерации

- Модуль api внутри @gost-kit/common; handler и тип ApiEffect внутри fc.
  Отдельный npm-пакет пока не требуется. openapi-fetch 0.17.0 и его публичные
  type helpers используются без собственного HTTP serializer.
- createApiClient<TPaths>(options) возвращает ApiClient<TPaths> с
  request(method, url, options), где options содержит params/body/headers/signal.
  Объектное описание запроса сохраняется у ApiEffect. Method —
  lowercase get/post/put/patch/delete/options/head/trace; обязательность params
  и body, допустимые method/url и response выводятся из OpenAPI TPaths.
  parseAs ограничен json в этой итерации. Никакого request<TResponse> с
  произвольным, не связанным со схемой типом результата.
- ApiResult<TData>: { type: 'ok'; data: TData } либо
  { type: 'error'; error: ApiFailure }. ApiFailure содержит kind
  http/network/aborted/contract, optional HTTP status и массив AppError errors.
  Существующий Result<T> не меняется. Никаких сырых request/response/cause в failure.
- Ответы JSON, включая application/*+json, принимаются; JSON null допустим.
  204 и HEAD дают undefined. Для остальных успешных ответов отсутствие данных
  или JSON Content-Type — contract failure. Runtime shape validation вне базы.
- HTTP status проверяется до контрактных требований к успешному ответу.
  Настройка mapErrors(body, response) централизованно переводит ошибки конкретного
  API в AppError[]; по умолчанию errors пуст, поскольку формат backend неизвестен.
  Ошибка этого пользовательского mapper распространяется, а не становится network.
- Только rejected transport operation нормализуется: aborted signal/AbortError/
  TimeoutError -> aborted, SyntaxError -> contract, прочее -> network.
  signal.aborted не отменяет уже полученный успешный ответ задним числом.
- ApiEffect<TPaths, TAction> — union описаний запросов с type ApiEffect,
  обязательным defaultError и optional onSuccess/onError. Колбэки возвращают
  action; onSuccess получает выведенные данные, onError — AppError[] и ApiFailure.
  Отсутствующий onSuccess пропускает dispatch; отсутствующий onError передаёт
  failure существующему механизму ошибок effects через rejection.
  Пустой errors заменяется [defaultError]; непустой сохраняется.
- createApiHandler<TPaths, TAction>(api) создаёт таблицу обработчиков для
  effecting. Исключения клиента, mapper, callbacks и dispatch не перехватываются
  повторно; обработчик работает только с ApiResult, не разбирает HTTP.
- Работа выполняется в текущем checkout на отдельной ветке feature/gost-kit-10-api-client;
  исходный main не редактируется. Коммиты/публикация не требуются для review результата.

## Результат реализации — 2026-11-04

Реализован весь базовый scope #10 в ветке feature/gost-kit-10-api-client.
Публичные createApiClient/ApiClient/ApiResult/ApiFailure/ApiRequest/ApiResponse
находятся в common/api; ApiEffect/createApiHandler — в fc. Небольшие файлы
реализации отделяют создание, исполнение, чтение результата, нормализацию и
преобразование результата в action. В исходниках общих библиотек нет Svelte,
window, storage или схемы asc-admin.

Метаданные эффекта удаляются перед обращением к внедряемому клиенту. В динамическом
адаптере effects типовая корреляция method/url/callback стирается локально
с комментариями; публичный union и compile-time проверки сохраняются. При
самопроверке обнаружено, что constraint Rec исключал interface-операции OpenAPI;
отдельный type assertion сначала RED, затем constraint исправлен на object.
Vendor JSON, nullable responses, 204 и interface-схемы проверяются отдельно.

### Проверки

- До реализации npm test прошёл: 124 common + 6 Svelte. Новые API/effect tests
  сначала упали из-за отсутствующих modules; пример после обновления expectations
  дал 8 ожидаемых падений старого контракта. Logs: /tmp/gost-kit-10-*-red.log.
- После реализации на Node 26.11.1 полный npm run check прошёл: 155 common + 6 Svelte; среди них
  31 новый API/effect runtime/type test. Type assertions проверяет tsc, Vitest
  не выполняет сетевые вызовы из функций compile-time fixtures.
- Пример: check (26 tests), Vite build и Playwright Chromium (2 tests) прошли.
  Проверены успех, ошибка, global alert и повторная попытка через общий клиент.
- Реальный npm pack common после final type fix: 224 файла, tests/test helpers
  отсутствуют. Установка tarball во внешний temporary consumer offline прошла;
  ESM runtime client/effect и tsc NodeNext с отрицательными type assertions прошли.
  Относительные импорты emitted JS имеют явное .js расширение. Зависимости
  openapi-fetch/helpers доступны из установленного пакета, без workspace imports.
- Исходный полный diff, exports, зависимости, lockfiles, документация и changeset
  сверены отдельно от тестов. Версии обоих пакетов не менялись; minor changeset
  подготовлен только для common. src и package.json asc-admin не менялись.

### Независимое ревью

Fresh-context reviewer прочитал AGENTS, дизайн/план, исходные требования, весь
tracked/untracked diff, новые modules, пример, exports/dependencies и документацию.
Самостоятельно прошли common tsc, 31 focused API/effect test и дополнительный
interface-schema compilation probe. Actionable findings нет. Reviewer не
повторял full suite, packed consumer и browser checks; их выполнил автор.

### GitHub и границы завершения

Issue #10 прочитана вместе со всеми страницами comments (комментариев нет).
Итог реализации и verification синхронизированы в issue body и проверены повторным чтением. Задача остаётся
открытой до интеграции. Изменения подготовлены для review без автоматических
commit/push/merge или публикации. План выполнения находится в локальном ignored
каталоге docs/superpowers/plans согласно текущему .gitignore; публичный дизайн
содержит контракт и итоговое evidence. Auth/refresh/retry и runtime shape
validation остаются последующими возможностями, а не незавершённой базой.

## Правки читаемости по review владельца — 2026-11-04

В createApiClient, executeRequest, normalizeError, readResult и createApiHandler
добавлены многострочные блоки, фигурные скобки и пустые строки между логическими
шагами. Извлечение Content-Type вынесено в getMediaType, проверка JSON media type —
в isJsonMediaType; оба helper находятся внутри api/lib. Стандартные имена
AbortError/TimeoutError собраны во внутреннем api/enums/ErrorName, без нового
публичного экспорта. Поведение запросов и сигнатуры публичного API сохранены.

До/после прошли common typecheck и 31 focused test; итоговый полный check —
155 common + 6 Svelte. Pack dry-run содержит новые helpers/enum и не содержит
тесты (230 файлов после выделения modules); smoke compiled ESM клиента прошёл.
Предыдущие внешний consumer/browser результаты относятся к реализации до
этой правки читаемости, повторно за свежий browser run не выдаются.

Задача #5 на ESLint/Prettier назначена следующей после #10; критерии дополнены
обязательными скобками if, читаемыми переносами и пустыми строками между шагами.
Само подключение форматтера/линтера в scope этой правки не включалось.

## Уточнение сигнатуры клиента — 2026-11-04

После обсуждения TypeScript casts владелец согласовал нативную форму
request(method, url, options). Внутри request сохраняются связанные generic
параметры Method/Path/Init из контракта openapi-fetch. Method дополнительно
принадлежит keyof выбранного Path; ApiInit сохраняет optional/required init
аргументы upstream и ограничивает parseAs значением json.

Каст invoke удалён: client.request<Method, Path, Init> вызывается напрямую.
ApiResponse выводит результат из routing metadata без требования повторно
доказывать все options. Последующее уточнение владельца также убирает output-cast после readResult:
тип transport response сохраняется через generic helpers; см. раздел ниже.
Runtime shape validation не появилась.

ApiEffect остаётся объектом. В createApiHandler отдельно извлекаются method/url
и options, без callback/defaultError metadata. Динамический union adapter и
вызов соответствующего success callback сохраняют документированные внутренние
приведения; удаление invoke не объявляется устранением всех casts в проекте.
Публичные запросы и callbacks по-прежнему проверяются схемой.

Обновлённые runtime tests сначала дали RED из-за старой object-call сигнатуры;
tsc также зафиксировал arity errors. После реализации проходят common tsc и
31 focused test, включая прежние ошибки method/path/body и запрет parseAs text.
Старый object-call клиента теперь проверяется как compile-time ошибка.
Итоговые full/consumer/review результаты этого раунда записываются ниже отдельно.

## Сохранение типа результата без output-cast — 2026-11-04

Владелец отдельно запросил удалить приведение результата readResult. Для этого
executeRequest стал generic по полному результату операции. TransportResponse
разделяет success с обязательным data и error без data; TransportData выводит
тип именно из success, не добавляя undefined от error-ветки openapi-fetch.

readResult сохраняет data из типизированного transport response, а не создаёт
нетипизированный результат. Для HEAD используется conditional overload:
результат всегда undefined, даже если схема ошибочно объявляет response body.
Реализация явно обрабатывает эту ветку; для остальных методов data сохраняется.
204 получает undefined из уже разобранного ответа upstream. Перегрузка нужна
для зависимого типа результата; в helper и factory нет as/any assertion.

ApiClient<TPaths> выводится как ReturnType<typeof createApiClient<TPaths>>:
публичная сигнатура не дублируется вручную и сохраняет Method/Path/Init. Новые
type assertions сначала дали RED (unknown от обоих helpers), затем GREEN.
Отдельно проверяется HEAD со схемой JSON body. Обработчик effects сохраняет
свою документированную динамическую адаптацию; schema runtime validation всё
ещё не входит в первую итерацию.

### Итог уточнений сигнатуры и результата

Свежие проверки: полный npm run check — 156 common + 6 Svelte; пример check —
26 tests, Vite build и 2 Playwright cases прошли. Финальный tarball (234 files)
установлен offline в новый внешний consumer: runtime native request + object
ApiEffect, NodeNext declarations, nullable/interface/vendor response inference
и HEAD со схемой JSON body прошли. Tests/test helpers отсутствуют в артефакте,
относительные emitted JS imports имеют .js. Старые object-call примеры в
актуальном README заменены; такой вызов оставлен только как negative type test.

Independent reviewer без авторского рабочего разговора повторно проверил
нативную сигнатуру, typed pipeline и overload. Самостоятельно прошли common
tsc, 32 focused tests и дополнительный in-memory probe: required/optional init,
query/body, explicit undefined rejection, JSON-only parseAs, nullable/vendor/
interface/204/HEAD и effect callback inference. Actionable findings нет.
Full/browser/packed проверки выполнены автором; reviewer их не повторял.

Читаемость: tuple init явно деструктурируется в requestOptions вместо обращения
init[0]?.signal. executeRequest ловит только rejection транспортной операции;
HTTP errors обрабатывает readResult. Остальные исключения транспорта также
попадают в network по текущему минимальному контракту — это не точная
диагностика DNS/соединения и не обработка исключений всего приложения.

Текущие native request и typed-result решения синхронизированы в issue #10;
следующая задача остаётся #5. Изменения не закоммичены и не опубликованы.

## Подготовка PR по запросу владельца

Владелец явно запросил создание PR: это разрешает commit/push текущей issue-ветки
и supersedes прежнее состояние «локально, не закоммичено». База сверена после
fetch: HEAD и origin/main — fbf8a51. Повторный pre-PR check проходит с тем же
набором 156 common + 6 Svelte, пример — 26 tests. В PR входят исходники, пример,
этот дизайн, документация и common changeset; ignored implementation plan не
публикуется. Merge и выпуск остаются отдельными действиями.

## Интеграция после подключения общих правил

Владелец разрешил merge рабочих PR. При обновлении PR #11 из main сохранена
API-реализация и миграция примера; source-конфликты были между API-изменениями
и форматированием #5. Применены общие lint/format политики без ослабления правил.
Негативные type fixtures используют void и адресные @ts-expect-error у фактических
строк после форматирования. В тесте callbacks вместо non-null assertions есть
проверка через публичный guard. Discriminator ApiEffect намеренно удаляется
из native request init; адресное no-unused-vars исключение документирует это.
ApiResponse явно задаёт parseAs json вместо пустого object type; независимая
проверка подтверждает прежний nullable/vendor/204/HEAD контракт.

Независимое review выявило сдвиг четырёх type-error directives и отсутствовавший
import guard; оба воспроизведены, исправлены, полный suite проходит.
На базе main #20: 156 common +46 ESLint +3 Prettier +6 Svelte tests,
11 project-policy tests и26 example tests. Example build/browser2 проходят.
Свежий реальный common tarball установлен offline во внешний consumer:
native request, ApiEffect dispatch, metadata stripping и NodeNext types проходят.
Минимальная Node26.0.0 проверена common tsc и156tests. Публикация отдельно.
