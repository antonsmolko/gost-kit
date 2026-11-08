# Вычисления в presenters: derived и Svelte templates — #19

## Цель и источник контракта

В явно выбранных бизнес-компонентах вычисления представления выполняются в
отдельных presenter-функциях. Компонент связывает реактивные входы и отображает
готовые значения. Не запрещаем Svelte-разметку, rune bindings или вызов presenter.

Владелец уточнил scope #19: проверять не только `$derived`/`$derived.by`, но и
интерполяции и значения атрибутов/props. Выбран способ распознавания разрешённых
вызовов: модуль `*.presenter.ts`, с переэкспортами и импортами под другим именем.
Название функции само по себе не является признаком presenter.

Основание: [gost-spec #78](https://github.com/antonsmolko/gost-spec/issues/78),
FRONTEND-ARCH-002 на revision f0a936c36458225dd58a896e7f5f6257dcf99821,
proposed/Pending. Requirement, Applicability и Verification сверены с pinned
Git source; выбор файла — конвенция gost-kit, а не универсальное требование
стандарта. Skill gost-view-presenter также проверен; его более узкая рекомендация
о независимых presenters не превращается здесь в lint запрет композиции функций.

## Рассмотренные подходы

1. Запрещать inline операции, но разрешать любые импортированные функции в
   derived. Проще, но обычный helper не отличается от принятого presenter API.
2. Дополнительно распознавать presenter по исходному модулю через TypeScript
   symbol resolution. Выбрано владельцем; учитывает reexports/import aliases.
   Это проверка принятого размещения, не доказательство purity.

Одно opt-in правило `gost/require-presenter` в существующем eslint-plugin.
Один контракт: разрешённые read/binding forms и видимые calculations в заданных
контекстах. Не вводим presenter runtime, новый пакет или architecture mode.
Если реализация потребует отдельного самостоятельного механизма за пределами
этих форм, выносим его в другую задачу вместо расширения анализатора скрытых
зависимостей.

## Разрешённое и запрещённое

```ts
const user = $derived(root.state.user);
const view = $derived(userPresenter({ state: user }));
const title = $derived(view.title);

// Presentation calculation: перенести в presenter.
const title = $derived(user.name.trim());
const total = $derived(price * quantity);
const error = $derived(message ?? 'Failed');
```

```svelte
<span>{view.total}</span>
<div title={view.title} />
{#each view.rows as row (row.id)}<span>{row.title}</span>{/each}

<!-- Report: вычисление либо вызов при отображении. -->
<span>{price * quantity}</span>
<div title={formatTitle(user)} />
```

### Общие формы готовых значений

- Identifier, чтение member properties и optional access. Computed access
  допускается, если сам ключ — готовое чтение или literal: `labels[locale]`,
  `rows[0]`. `rows[index + 1]` и `rows[getIndex()]` вычисляют ключ и запрещены.
- Literal constants, включая null, boolean, строки, числа, bigint и signed
  numeric literals. Template literal без substitutions — константа.
- Object/array literals разрешены как упаковка готовых значений: именованные
  параметры presenter, составные props, постоянные списки. Рекурсивно проверяются
  значения, computed keys и spread operands. Не допускаются getters/methods,
  inline function expressions и операции, спрятанные внутри контейнера.
- TS wrappers (`as`, non-null, satisfies) не скрывают внутреннюю форму: проверка
  проходит внутрь. Это не runtime validation и не рекомендация обходить nullable
  контракт assertions. Отдельное boolean-правило сохраняет собственные границы.
- Прочие unary, binary/logical/conditional expressions, interpolation template
  literals, assignment/update, new, tagged templates, await/yield и вычисляющие
  вызовы — report. Сравнения/negation/fallback/formatting/list transformations
  не становятся разрешёнными от того, что выражение короткое.

### Derived bindings

Проверяются intrinsic `$derived` и `$derived.by`, с текущей shadowing-проверкой
rune-callee. Пользовательская функция с таким именем не считается rune.
Включённое правило работает в component instance script и rune modules
`.svelte.ts`/`.svelte.js`; module script компонента и обычные TS/JS файлы вне scope.

Помимо общих ready forms, в derived разрешён вызов подтверждённого presenter.
Аргументы проверяются рекурсивно: read/literal/упаковка/другой presenter call,
но не `presenter({ title: user.name.trim() })`. Несколько presenters могут
вызываться независимо или связываться ready containers. Чтение поля результата
presenter также допустимо. Optional calls сохраняют тот же критерий происхождения.

Для `$derived.by` допустимы синхронный callback с expression body либо простой
block с `const` bindings и одним завершающим `return`. Initializers и return
подчиняются тому же контракту. Destructuring готового значения допускается;
default initializers проверяются как fallback decisions и не допускаются.
Ветвления, циклы, мутации и function definitions внутри callback переносятся
в presenter. Не пытаемся доказать эквивалентность сложного control flow.

Одна диагностика на нарушенный derived root, а не сообщение на каждый вложенный
оператор. Внутренние узлы и вложенный callback не дают дублирующих reports.

### Распознавание presenter

Используется program/type checker из parser services. Symbol aliases и export
chains разрешаются к верхнеуровневой функции или function-valued declaration в
`*.presenter.ts`. Для опубликованных TypeScript-модулей принимается также
`*.presenter.d.ts`; классификация по declaration source, не по type name.
Исходный presenter должен быть TypeScript-модулем `*.presenter.ts`.
JavaScript-файл `*.presenter.js` не считается исходным presenter по этому
контракту. `.presenter.d.ts` — допустимое представление TypeScript API в
скомпилированном пакете. Import specifier `.js`, который TypeScript разрешает
к `.presenter.ts` или `.presenter.d.ts`, не меняет происхождение функции:
проверяется найденная декларация, а не строка импорта.

Поддерживаются named/default imports, import rename, `export { ... }`, `export *`
и статические обращения к namespace import. Простые неизменяемые `const` aliases
могут вести к тому же binding; mutable aliases, function props, arbitrary factories
и вычисляемые callees не считаются доказанным presenter. Циклы разрешения
останавливаются. Методы экземпляров/произвольные presenter objects не добавляются.

Callable из `format.ts`, локальная функция с именем `userPresenter` и сама строка
импорта, заканчивающаяся похожим именем, не заменяют проверку symbol declaration.
Переэкспорт через `index.ts` не должен заставлять потребителя обходить публичный
API slice. Типы функции через общие Fn helpers также не меняют её исходный модуль.

Services/checker и результаты разрешения кэшируются в пределах файла. Ready
reads/literals и явно неверные операции не требуют type services. Проверка
candidate presenter call требует настоящий program; если его нет — config error,
не молчаливый пропуск и не диагностика о якобы неправильном имени функции.
JS-script компонентов может пользоваться typed Svelte parser services.

### Шаблон

Общее правило обхода: интерполяции и display attributes/props проверяются на
любой глубине template независимо от вида родителя. Snippet/await/special element
не создают исключения для своей дочерней разметки. Исключение из таблицы относится
только к конкретному expression slot (например await source или event value),
а не ко всему enclosing block/element. Для будущего неизвестного специального
узла не заявляем покрытие его новых slots: обычные mustache/attribute descendants
остаются под общей проверкой.

| Контекст                                                | Проверка                                                                                                                                                                                                                                                                                                    |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `{value}` и `{@html value}`                             | Ready forms; произвольные/presenter calls при отображении запрещены. HTML sanitization остаётся отдельной обязанностью.                                                                                                                                                                                     |
| HTML attributes и component props                       | Проверяются expression parts; shorthand готового имени допустим. Svelte literal text + ready interpolation остаётся обычной привязкой.                                                                                                                                                                      |
| Spread props                                            | Ready object либо упаковка готовых значений; вызов/оператор в operand запрещён.                                                                                                                                                                                                                             |
| `class:active`, `style:width`                           | Готовое значение; inline вычисления переносятся.                                                                                                                                                                                                                                                            |
| `{#each rows as row (row.id)}`                          | Список и key — ready forms; iterate/read row fields разрешено, map/filter/sort/calculate key — report.                                                                                                                                                                                                      |
| `{#key value}`                                          | Готовое значение identity, без расчёта при render. Не проверяем стабильность самого значения.                                                                                                                                                                                                               |
| `{@const value = ...}`                                  | Локальная реактивная привязка: те же формы, что derived, включая подтверждённый presenter. Это позволяет готовить row view внутри each без обязательного нового компонента.                                                                                                                                 |
| `{@render children(value)}`                             | Внешний snippet call — синтаксис Svelte, разрешён. Callee — готовое чтение; аргументы — ready forms, без форматирования или presenter call при render.                                                                                                                                                      |
| `{#snippet name(...)}`                                  | Display body проверяется по общим правилам, включая вложенные const/render/blocks. Параметры snippet — bindings, не вычисления; defaults проверяются как derived initializers; literal/read/presenter binding допустимы, inline calculations нет. `{#snippet price(v)}{v * 100}{/snippet}` получает report. |
| `{#await source}` и pending/then/catch                  | Source — исключение для resource wiring. Вся разметка pending, then и catch проверяется, включая текст/props, row/branch-local bindings и вложенные snippets.                                                                                                                                               |
| `<svelte:head>`                                         | Дочерняя разметка, title/meta и их display expressions проверяются по обычным правилам.                                                                                                                                                                                                                     |
| `<svelte:element>`, `<svelte:component>`                | Display body и attributes/props проверяются. Special directive `this={...}` принимает ready form; вычисление выбора tag/component должно быть подготовлено заранее. Browser/event slots сохраняют только собственные исключения.                                                                            |
| `{#if}` / `{:else if}`                                  | Условия не проверяются этим правилом: ответственность #18. Содержимое branches проверяется.                                                                                                                                                                                                                 |
| `on*` attributes и legacy `on:`                         | Не проверяются: event wiring/handlers — #17. Наличие callback не разрешает вычисления в обычном display prop.                                                                                                                                                                                               |
| bind/use/transition/animate/attach, await source, debug | Не проверяются первой версией: browser/lifecycle/resource wiring. Display expressions в дочерней разметке по-прежнему проверяются.                                                                                                                                                                          |

Решение автора дизайна: разрешить `{@const rowView = rowPresenter({ row })}` как
binding, но не `{rowPresenter({ row }).title}` как display expression. Это
уточняет первоначальное предложение держать все presenter bindings в script:
row существует только внутри each. Pure function остаётся во внешнем модуле.
В отличие от текстовой интерполяции `{@const}` ничего непосредственно не выводит.

Ready container не является разрешением писать алгоритм в class/props. Например,
`class={['base', view.className]}` допустим, а `class={active ? 'a' : 'b'}` нет.
При смешанных attributes вида `title="Hello {view.name}"` нет дополнительного
запрета на нативную Svelte-композицию literal text и ready fields; JS выражение
`title={'Hello ' + view.name}` остаётся вычислением. Граница синтаксическая и
явно документированная, без заявления о распознавании всех видов форматирования.

## Соседние правила и ограничения

`gost/require-feature-state-selector` (#6) явно расширяется на синхронные
вычисляющие вызовы в initializer `{@const}`. Store provenance и `$state.raw`
распознаются существующими checks; #19 не дублирует их. Проверяются те же call,
new и tagged-template контексты, что и в derived, а не только вызовы функций
из presenter-файлов. Вложенные отложенные function bodies не становятся
синхронным вызовом и сохраняют существующую границу #6.

Следствие: `{@const v = userPresenter({ state: root.state.user })}` допустим
по форме #19, но получает report #6. Для root scope используется отдельный
script selector `$derived(root.state.user)`; внутри template можно сначала
выбрать branch самостоятельным `{@const user = root.state.user}`, а затем
передать `user` в presenter. Для row, уже полученной от each, дополнительный
selector не требуется. Само чтение без вычисляющего вызова не запрещается.

Технические границы расширения #6: фильтр inScript допускает initializer const
только в этом новом контексте; reactive-context различает derived и template
const. Existing selectorFix применяется исключительно к derived; для @const
только диагностика с примером подходящей локальной привязки, без вставки runes
в HTML и без переноса row bindings в script. Исходную TS-применимость #6 не
расширяем на JS-only components этой задачей; ограничение описывается в RULES.
Гарантии не распространяются на скрытый store access через arbitrary helpers.

Новый контекст #6 и его отсутствие autofix явно документируются рядом с #19
в RULES/README и changeset. Существующие derived diagnostics/fixes сохраняются.
Совместный тест проверяет, что подтверждённый presenter с прямым Store/raw-state
read в @const даёт selector report и не получает дублирующий report #19.
`ready-boolean-condition` и `single-intent-dispatch` сохраняют свои контексты.

Не доказываем purity тела presenter, отсутствие скрытого store access, корректность
его выходного типа, alias provenance всех ready variables или отсутствия расчёта
в обычном script/helper. Переименование helper файла в presenter принимает
конвенцию, но не доказывает её соблюдение. Эти вопросы остаются review/tests.

Правило без autofix и без suggestions, создающих функции/файлы либо меняющих
реактивность, scope или владение состоянием.

## Подключение и поставка

Публичный Svelte config регистрирует правило с `off`. Потребитель включает его
для своих бизнес-компонентов; UI-Kit может исключить отдельным поздним override.
Внутренний createProjectConfig включает правило для `src/**/*.svelte`, как #16–18.
Не добавляем architecture flag. Для rune modules можно включить отдельный glob.

Example уже использует выбранные user/alert scopes и presenters. Его display
bindings должны остаться валидными. DOM handlers примера сохраняют существующее
поведение: их переработка в UI-Kit не входит в #19.

Changeset: eslint-plugin minor, eslint-config-svelte patch. Common/Svelte runtime
не меняются. Публикация и merge — отдельные указания владельца.

## Проверки

- Compiler-validated RuleTester fixtures для чтений/optional/computed reads,
  literals/containers, операций и вложенных calculations; синхронный derived.by,
  shadowed runes, rune modules, nested blocks и корректное число диагностик.
- Настоящие .presenter.ts fixtures, import rename/default/namespace/barrel chains,
  readonly aliases, mutable aliases, unresolved/ordinary calls и отсутствие
  services. Отдельно declaration-only .presenter.d.ts consumer и Fn annotations.
- Template fixtures для каждого контекста таблицы: text/raw/attribute/style/class,
  spread, each/key, @const row presenter и @render outer-call exception. Для
  snippet body, каждой ветви await, head и dynamic element/component обязательны
  отдельные valid/invalid fixtures; глубоко вложенный display slot не пропускается.
  Для special this и compiler-valid snippet defaults проверяются свои slots.
  Events, lifecycle directives и if conditions не получают дублирующей диагностики.
- Расширенное #6 вместе с новым правилом: derived и @const с прямым Store/raw
  read внутри вызова дают selector diagnostic, без повтора #19 на допустимый
  presenter call. Отдельный @const selector и row input валидны. Проверяются
  mixed contexts, namespace/import aliases, несколько scopes, deferred callbacks,
  обычные object reads и отсутствие autofix в template; старые derived fixes
  и их idempotence остаются зелёными. Новая проверка #6 работает и без #19.
- Происхождение presenter: исходный .presenter.ts распознаётся, обычный
  .presenter.js не принимается; .presenter.d.ts опубликованного TypeScript API
  и импорты .js с TS substitution распознаются корректно.
- Config tests: default off, explicit on, UI-Kit off при сохранении остальных
  checks. Документация RULES/README с точным syntactic scope и примерами обходов.
- Полный root check, пример build/2 browser scenarios; Svelte autofixer при
  изменении компонентов/rune modules. Реальные tarballs plugin/config во внешнем
  consumer с настоящими imports/barrels и parser services; без GOST runtime deps
  и без tests/source в опубликованных артефактах.

## Статус

Дизайн и план утверждены владельцем. Реализация завершена: правило, template
контексты, расширение selector checks, конфигурация и документация. Полный check
проходит (823 теста), пример собирается, 2 браузерных сценария и внешний
tarball consumer с public barrel/declaration imports проходят. Независимое финальное ревью завершено: пропуск destructuring bindings each/await
исправлен через compiler-valid regressions RED→GREEN. Дублирование
диагностик вложенного derived также исправлено по указанию владельца: один report
на внешний нарушенный root, независимые bindings проверяются отдельно.

## Исправления ревью дизайна

Уточнён общий recursive scope шаблона и явно добавлены snippet bodies, все ветви
await, head и dynamic elements/components со своими fixtures. Read-only AST probe
на установленных Svelte 5.57.2 / svelte-eslint-parser 1.10.1 подтвердил nodes и
корректную компиляцию примеров; this представлен отдельным SvelteSpecialDirective.

Для @const выбран вариант явного расширения #6 вместо принятия известного
пропуска: добавлены границы синхронного вызова, TS scope, diagnostic-only для
нового контекста и совместные проверки. Требование TypeScript-исходника presenter названо явно;
новое имя правила — gost/require-presenter. Синтаксис snippet defaults и двух последовательных @const bindings отдельно
проверен compiler/parser. Уточнённый дизайн утверждён владельцем.

## Уточнение после финального ревью

Each context и then/catch bindings проверяются тем же рекурсивным binding
классификатором, что snippet parameters: defaults принимают ready/confirmed
presenter forms, computed keys — ready reads. Восемь compiler-valid invalid
fixtures воспроизвели пропуск до исправления; добавлены шесть valid counterparts.
Selector extension по-прежнему ограничен @const: pattern defaults не получают
его гарантий, что явно указано в RULES. Вычисления вне видимых проверяемых slots,
purity presenter и wiring exceptions остаются ранее принятыми границами.
