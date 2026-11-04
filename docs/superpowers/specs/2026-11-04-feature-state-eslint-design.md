# Выбор feature state перед вычислением — gost-kit #6

## Цель и существующий контракт

`createStore` хранит immutable root snapshot в `$state.raw`. Прямое чтение
ветки root внутри вычисления подписывает его на замену root. Промежуточный
`$derived` позволяет остановить последующие обновления, если выбранная ссылка
не изменилась. Правило напоминает об этой границе без изменения runtime API.

Задача: https://github.com/antonsmolko/gost-kit/issues/6.
Новые проверки владения состоянием, вычислений presenter, условий шаблона
и dispatch остаются в #16–#19. Реализация #6 позволяет завершить исходную
интеграцию #5 после проверки её критериев.

## Подходы и решения

В #6 уже согласованы отдельный plugin и определение настоящего Store по типам.
Синтаксическая проверка имени `root` или формы `{ state, dispatch }` отвергнута:
она затронет посторонние объекты. Брендирование runtime Store также не требуется:
это меняло бы публичный контракт ради линтера.

Поставка: новый `@gost-kit/eslint-plugin` с первым полезным правилом
`gost/require-feature-state-selector`; следующие архитектурные правила смогут
расширять тот же plugin. Названия пакета и правила — предложение исполнителя.
Plugin подключается как dependency `@gost-kit/eslint-config-svelte`; общий
framework-independent config и Prettier не получают Svelte-политик.

## Уточнение владельца во время реализации

Проверяем источник реактивности, а не имя `root.state`: кроме публичного Store
включаем явно объявленный локальный `$state.raw`. TypeScript возвращает `T`
для `$state` и `$state.raw`, поэтому один shape/type не доказывает реактивность.
Raw rune распознаём по исходному lexical binding, без затенённого `$state`.
Простая копия raw snapshot не становится реактивным alias; Store aliases
сохраняют getter и поддерживаются. Глубокий proxy `$state` автоматически
не запрещаем: у него другой характер отслеживания зависимостей.

## Что проверяем

Авторские `.svelte` с TypeScript script и `.svelte.ts`. Внутри `$derived(expr)`
и синхронного тела `$derived.by(() => ...)` диагностируем прямое чтение
`Store.state` или его ветки, которое участвует в аргументе либо receiver
обычного вызова. Включаем обычные и optional вызовы, статические обращения
через точку и строковый литерал, несколько входных веток, цепочки методов.
На одно обращение выдаём одну диагностику.

Недопустимо:

```ts
const view = $derived(userPresenter(root.state.user));
const view = $derived.by(() => userPresenter(root.state.user));
const view = $derived(presenter(root.state.user, root.state.config));
const names = $derived(root.state.users.map(readName));
```

Разрешено:

```ts
const user = $derived(root.state.user);
const config = $derived(root.state.config);
const view = $derived(userPresenter(user));
const combined = $derived(presenter(user, config));
const selected = $derived.by(() => root.state.user);
const handleClick = () => {
  consume(root.state.user);
};
```

Простое чтение без обычного вызова не диагностируется. Вызовы самой rune
не считаются вычислением presenter. Прямое использование всего `root.state`
в обычном вызове тоже диагностируется: при необходимости можно отдельно
выбрать весь snapshot, но такая ссылка будет изменяться после каждого dispatch.

Тело callback, переданного в функцию как значение, не считается исполненным
только из-за расположения внутри derived. Первая версия не анализирует
поздний вызов callback, async continuation и межпроцедурные зависимости.
Прямой синхронный callback `$derived.by` — явное исключение, которое проверяем.
Nested derived анализируется в своём контексте без дублирования сообщений.
Локальное затенение имени `$derived` обычной функцией не считается rune.

## Идентификация Store и ограничения

Используем parser services и публичный TypeScript checker. Сравниваем
происхождение декларации свойства `state` с декларацией публичного
`Store` из разрешённого для consumer модуля `@gost-kit/common`.
Не сравниваем лишь строковое имя типа или абсолютный путь checkout.

В существующем example проверено чтением TypeScript program: alias `RootStore`
сохраняет декларацию `state` из `Store` в опубликованном declaration entry.
Конкретные parser mappings для Svelte проверяются в реализации до подключения
правила. Если они не позволяют выполнить согласованный контракт, возвращаемся
к дизайну; не заменяем проверку эвристикой имени `root`.

Поддерживаем типизированные aliases Store, переэкспорты, переменные с другим
именем, inferred return `createStore`, nullable Store с optional access.
Для union признаём Store только при подтверждённом происхождении у каждой
не-nullish ветки; смешанные union, any/unknown и утраченная после структурного
переопределения provenance не становятся Store по догадке.
Intersections и mapped types проверяем только при сохранённой provenance.
Aliases самого snapshot/feature и динамические computed keys в первую версию
не отслеживаем; ограничения явно описываем в README.

Нет runtime-зависимости plugin от Svelte store. Для чтения потребительских
типов используется его TypeScript program; фикстуры явно устанавливают common
и Svelte runtime. Не навязываем runtime-пакеты обычным потребителям config.
Shared types/guards реализации используем по AGENTS.md через публичный common,
если они действительно требуются; необходимая production dependency при таком
использовании декларируется, без обращения к исходникам соседнего пакета.

Svelte config включает typed rule на error только для TS Svelte scopes.
Обычные JS-файлы сохраняют работу без tsconfig. Для `.svelte.js`/JS script
проверка по умолчанию не обещается: текущий JS parser не предоставляет
TypeScript program. Отдельное ручное включение typed rule требует parser services;
их отсутствие даёт понятную configuration error, а не тихий успешный прогон.
Для stateless `.svelte` без TS script правило ничего не проверяет.

## Диагностика и поставка

Сообщение показывает причину и схему исправления:
`const user = $derived(store.state.user); const view = $derived(presenter(user));`.
По уточнению владельца добавляем ограниченный автофикс для простого отдельного
объявления `const view = $derived(presenter(store.state.user))` в component
instance script или rune module. Selector вставляется перед этим объявлением
в том же scope; исходный доступ заменяется локальной переменной.

Имя берётся из последнего статического поля пути: `store.state.user` → `user`.
По выбору владельца при конфликте используем суффикс `V2`, затем `V3` и далее:
`user`, `userV2`, `userV3`. Проверяем bindings всего scope, включая последующие
объявления, imports и ссылки, которые новое объявление могло бы затенить.
Если последнее поле не образует допустимый identifier или безопасное имя
не может быть подтверждено, оставляем диагностику без fix.

Первая версия fix ограничена одним прямым статическим обращением к ветке в
аргументе обычного вызова, единственным declarator и безопасной вставкой
отдельного top-level объявления в module/instance script. Не переносим обращения через optional chains,
динамические ключи, вызовы/getters на пути, условные/короткозамкнутые выражения,
spread и несколько веток одним общим fix. Безопасный путь для fix начинается
с локального identifier Store; property chains наподобие `getRoot().state.user`
или `container.root.state.user` сохраняют диагностику без автоматической правки.
Receiver cases и `$derived.by` в первой версии также остаются без fix.
Перед выпуском тестами подтверждаем сохранение порядка чтения/вычислений;
если для конкретной формы безопасность не доказана, fix не предлагается.
Повторный запуск линтера после исправления не создаёт новых selectors.

Plugin имеет публичный flat-config-compatible export с metadata и rules,
TS declarations и explicit `.js` в emitted imports. Тесты и test helpers
располагаются рядом с реализацией, не входят в npm artifacts.
Настройка workspace build/check учитывает порядок зависимостей. Обновляются
root/example locks, package READMEs, описание правила и minor changesets
для нового plugin и Svelte config. Merge и публикация отдельными действиями.

## Проверка

1. RuleTester valid/invalid fixtures проверяют ожидаемый rule ID и location,
   оба вида derived, receiver, несколько веток, aliases, inferred Store,
   переэкспорты, plain objects, union/optional access, обработчики событий,
   callback boundaries. Fix cases покрывают точный output, суффиксы V2/V3,
   imports/последующие bindings/shadowing, повторный прогон без изменений и
   отсутствие fix для неподдерживаемых/небезопасных случаев.
2. Реальный ESLint + Svelte parser подтверждает type-aware диагностику в
   `.svelte` и `.svelte.ts`; stateless/JS consumers не ломаются.
3. Регрессия реактивности на настоящем Store показывает разницу числа вызовов
   при замене другой ветки; отдельный selector сохраняет результат presenter.
   Та же проверка применяется к результату автофикса.
4. Реальные tarballs нового plugin и Svelte config устанавливаются во внешний
   consumer. Проверяются imports/declarations, diagnostic и отсутствие tests
   в artifacts; обычная конфигурация не требует app runtime.
5. Полный root check, example build и существующие browser scenarios.
   Независимое ревью до объявления реализации завершённой.

Источники:

- https://svelte.dev/docs/svelte/$derived#Update-propagation
- https://typescript-eslint.io/developers/custom-rules/
- Текущие `Store`, `createStore`, parser setup и example в этом репозитории.

## Результат реализации и проверка

Создан plugin с именованным flat-config export `plugin` и правилом
`gost/require-feature-state-selector`. Svelte config подключает его на error.
Runtime Store и public API приложения не менялись. Ограниченный fix реализован
для top-level single-argument declarations; в сложных случаях остаётся диагностика.

- Plugin: 59 тестов, включая 58 valid/invalid RuleTester-сценариев и проверку
  isolated layout. Точные outputs, Store provenance,
  aliases/reexports/inferred return, nullable/mixed union, mapped/intersection,
  raw binding, глубокий proxy и plain snapshot, callback boundaries, V2/V3.
- Svelte config: 39 тестов, включая настоящие component/rune diagnostics,
  raw-state fix и повторный запуск без новых изменений.
- Общий check: 346 тестов с tooling/example, проверки типов и стиля.
  Example production build и два browser scenarios прошли.
- Tarballs всех шести пакетов проверены на отсутствие src/tests/helpers.
  Plugin: 20 файлов; Svelte config: 11. Пакеты установлены во внешний consumer.
- Во внешнем consumer raw rule/fix и Prettier работают до установки
  `@gost-kit/common`/`@gost-kit/svelte`: tooling не навязывает их production deps.
- После установки runtime tarballs проверены Store diagnostic, точный autofix,
  TypeScript NodeNext declarations и idempotence. Результат fix скомпилирован
  Svelte compiler и выполнен с настоящим Store: unrelated branch не увеличивает
  число вызовов presenter, замена user увеличивает его и обновляет результат.
- Независимое ревью полного изменения не выявило material findings.

Внешний consumer и pack-проверки выполнялись в disposable temp directories;
их скрипты не входят в distribution. RED-проверки подтвердили отсутствие
диагностик до реализации правила, raw-поддержки и подключения config.
Merge и публикация в рамках этой задачи не выполняются; результат поставляется PR.

## Уточнения после ревью PR #24

Store определяется по декларации свойства и экспортированному Store из
фактического пакета `@gost-kit/common`; резолв common из файла потребителя
больше не требуется. Регрессия использует реальные declarations common/svelte
во вложенной installation layout без hoisting и без прямого импорта common.

Автофикс не создаёт bindings с префиксом `$`: Svelte запрещает и имя руны,
и имена вроде `$stateV2`. Для таких полей остаётся диагностика. Набор обычных
зарезервированных слов вынесен на уровень модуля; Svelte AST parent проверяется
через тип parser без `String(...)`.

Генераторы и instance field initializers исключены из синхронного derived-контекста.
Static fields и computed keys остаются в нём. Деструктуризация `$state.raw`
захватывает snapshot и не создаёт реактивный binding; распознаём только прямой
identifier declarator. `new` и tagged templates добавлены как синхронные
вычисления с диагностикой без автофикса. В смешанных компонентах гейт применяется
к диапазону конкретного TS script; соседний JS script остаётся вне typed rule.

После исправлений полный check подтвердил 346 тестов, production build примера
и два browser scenarios прошли. Новые tarballs plugin/config проверены на
exclusions и установлены во внешний consumer: raw fix без GOST runtime,
JS/TS script gating, dollar-field nofix, nested common без прямого resolve,
компиляция результата fix, idempotence, constructor/tag diagnostics и NodeNext
проверка деклараций. Повторное независимое ревью исправлений без material findings.
