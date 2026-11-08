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

Одно opt-in правило `gost/prefer-presenter` в существующем eslint-plugin.
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

| Контекст                                                | Проверка                                                                                                                                                                    |
| ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `{value}` и `{@html value}`                             | Ready forms; произвольные/presenter calls при отображении запрещены. HTML sanitization остаётся отдельной обязанностью.                                                     |
| HTML attributes и component props                       | Проверяются expression parts; shorthand готового имени допустим. Svelte literal text + ready interpolation остаётся обычной привязкой.                                      |
| Spread props                                            | Ready object либо упаковка готовых значений; вызов/оператор в operand запрещён.                                                                                             |
| `class:active`, `style:width`                           | Готовое значение; inline вычисления переносятся.                                                                                                                            |
| `{#each rows as row (row.id)}`                          | Список и key — ready forms; iterate/read row fields разрешено, map/filter/sort/calculate key — report.                                                                      |
| `{#key value}`                                          | Готовое значение identity, без расчёта при render. Не проверяем стабильность самого значения.                                                                               |
| `{@const value = ...}`                                  | Локальная реактивная привязка: те же формы, что derived, включая подтверждённый presenter. Это позволяет готовить row view внутри each без обязательного нового компонента. |
| `{@render children(value)}`                             | Внешний snippet call — синтаксис Svelte, разрешён. Callee — готовое чтение; аргументы — ready forms, без форматирования или presenter call при render.                      |
| `{#if}` / `{:else if}`                                  | Условия не проверяются этим правилом: ответственность #18. Содержимое branches проверяется.                                                                                 |
| `on*` attributes и legacy `on:`                         | Не проверяются: event wiring/handlers — #17. Наличие callback не разрешает вычисления в обычном display prop.                                                               |
| bind/use/transition/animate/attach, await source, debug | Не проверяются первой версией: browser/lifecycle/resource wiring. Display expressions в дочерней разметке по-прежнему проверяются.                                          |

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

`gost/require-feature-state-selector` (#6) сохраняет проверку прямого Store/raw
state в call внутри derived; здесь не дублируется анализ Store provenance.
Вызов presenter допустим по #19, но может нарушать #6 из-за несделанного selector.
Для @const этот существующий анализ не расширяется неявно; гарантии #6 на новый
контекст не заявляются. `ready-boolean-condition` и `single-intent-dispatch`
сохраняют собственные контексты и сообщения.

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
  spread, each/key, @const row presenter и @render outer-call exception. Events,
  lifecycle directives и if conditions не получают дублирующей диагностики.
- Существующее #6 вместе с новым правилом: imported presenter поддерживается,
  root.state внутри аргумента остаётся диагностикой selector, без повтора #19.
- Config tests: default off, explicit on, UI-Kit off при сохранении остальных
  checks. Документация RULES/README с точным syntactic scope и примерами обходов.
- Полный root check, пример build/2 browser scenarios; Svelte autofixer при
  изменении компонентов/rune modules. Реальные tarballs plugin/config во внешнем
  consumer с настоящими imports/barrels и parser services; без GOST runtime deps
  и без tests/source в опубликованных артефактах.

## Статус

Способ распознавания по модулю подтверждён владельцем. Остальные границы —
предложение автора для согласования. Независимый builder check завершён:
важных неразрешённых вопросов для планирования нет. Реализация не начата.
