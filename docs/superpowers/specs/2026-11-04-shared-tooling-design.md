# Общие ESLint и Prettier конфигурации

Статус: дизайн согласован владельцем 2026-11-04, включая error для всех правил
и запрет value! в tests. Реализация и локальная проверка завершены; публикация требует отдельного решения владельца.
Задача: [#12](https://github.com/antonsmolko/gost-kit/issues/12).
Ветка: feature/gost-kit-12-shared-tooling, база origin/main fbf8a51.

## Цель и подход

Общий фреймворконезависимый JS/TS baseline в двух независимо версионируемых
пакетах: @gost-kit/eslint-config и @gost-kit/prettier-config. Конкретные проекты
импортируют конфигурации и добавляют собственные окружения/overrides.

Рассмотрены: один пакет с eslint/prettier exports (одна версия связывает два
инструмента), два config-пакета (выбраны владельцем), сразу собственные plugins
(пока нет нового правила или parser, ради которого их нужно разрабатывать).
За основу берутся поддерживаемые upstream configs/rules. Airbnb служит
источником соглашений; его legacy preset не становится зависимостью.

Пакеты размещаются в packages/eslint-config и packages/prettier-config,
имеют собственные versions/changelogs/changesets. Целевой первый release — 0.1.0;
исходная development version 0.0.0 и minor changeset подготавливают этот release.
Они устанавливаются как devDependencies и не зависят от runtime common/svelte.
Исходники TS собираются по существующей схеме gost-kit с явными .js imports
в emitted ESM; tests/test helpers исключаются из артефактов.

## Область и уровни

Владелец выбрал E01–E12, T01–T07, P01–P08 и затем явно все A01–A06.
Все ESLint-политики ниже согласованы с уровнем error, включая T07 и всю A-группу.
Автоматических общих исключений для tests нет. A02 имеет заранее оговорённое
исключение для default exports в известных configuration files.

JS и TS обрабатываются раздельно: настройки TS не ломают обычные JS/config
files. T02–T06 включаются для TS с типовой информацией проекта; это часть первой
версии, а не отложенные rules. Потребитель явно задаёт корень своего tsconfig.
Browser/Node/test globals добавляются проектом для его files, не глобально
пакетом. Нет фиксированного src/, aliases, FSD или схемы конкретного приложения.
Фреймворк-компоненты и их parsers/rules подключаются отдельным слоем проекта.

## ESLint: принятые пункты

| ID  | Настройка                                                                                  | Поведение                                                                                                                                                                                                                            |
| --- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| E01 | @eslint/js recommended + typescript-eslint recommended                                     | Базовые проверки ошибок; версии presets закрепляются.                                                                                                                                                                                |
| E02 | curly: all                                                                                 | Скобки обязательны у if/циклов и других управляющих конструкций.                                                                                                                                                                     |
| E03 | eqeqeq: always                                                                             | Только === и !==.                                                                                                                                                                                                                    |
| E04 | no-var, prefer-const                                                                       | var запрещён; const, если нет переназначения.                                                                                                                                                                                        |
| E05 | no-unused-vars / TS variant                                                                | Неиспользуемые переменные — ошибка; намеренно неиспользуемые arguments начинаются с _.                                                                                                                                               |
| E06 | no-else-return                                                                             | Нет else после завершающего return.                                                                                                                                                                                                  |
| E07 | object-shorthand: always                                                                   | Краткая запись одноимённых object properties.                                                                                                                                                                                        |
| E08 | @typescript-eslint/consistent-type-imports, @typescript-eslint/no-import-type-side-effects | import type для только типов; inline type в смешанном импорте.                                                                                                                                                                       |
| E09 | import-x/no-duplicates, prefer-inline                                                      | Один совместимый импорт модуля, значения и типы объединяются.                                                                                                                                                                        |
| E10 | @stylistic/padding-line-between-statements                                                 | Пустая строка перед if, кроме первого statement блока.                                                                                                                                                                               |
| E11 | То же rule                                                                                 | Пустая строка перед return, кроме первого statement блока.                                                                                                                                                                           |
| E12 | То же rule                                                                                 | Группа const/let/var и любых export-объявлений отделяется от соседних шагов; соседние объявления внутри группы допустимы. Владелец подтвердил расширение на все export, поскольку готовое правило не выделяет export const отдельно. |
| T01 | @typescript-eslint/no-explicit-any                                                         | Нет явного any, допускается unknown.                                                                                                                                                                                                 |
| T02 | @typescript-eslint/no-floating-promises                                                    | Promise обработан или явно проигнорирован void.                                                                                                                                                                                      |
| T03 | @typescript-eslint/no-misused-promises                                                     | Async callbacks используются в подходящих местах.                                                                                                                                                                                    |
| T04 | @typescript-eslint/await-thenable                                                          | await применяется к подходящим значениям.                                                                                                                                                                                            |
| T05 | @typescript-eslint/switch-exhaustiveness-check                                             | Полнота switch для enum/union.                                                                                                                                                                                                       |
| T06 | @typescript-eslint/no-unnecessary-type-assertion                                           | Ненужные casts — ошибка; необходимые casts не запрещаются целиком.                                                                                                                                                                   |
| T07 | @typescript-eslint/no-non-null-assertion                                                   | Postfix value! запрещён, включая tests.                                                                                                                                                                                              |
| A01 | arrow-body-style: always                                                                   | Все стрелки имеют block body; возврат значения явный.                                                                                                                                                                                |
| A02 | import-x/no-default-export                                                                 | Named exports; default разрешён в configuration files. Default imports не запрещаются.                                                                                                                                               |
| A03 | no-param-reassign: props true                                                              | Нет переназначения parameters и присваивания их properties.                                                                                                                                                                          |
| A04 | no-await-in-loop                                                                           | await внутри циклов запрещён.                                                                                                                                                                                                        |
| A05 | no-plusplus                                                                                | ++/-- запрещены, в том числе в for-loop update.                                                                                                                                                                                      |
| A06 | no-restricted-syntax: ForOfStatement                                                       | for…of запрещён. Обычные for/while этим пунктом не запрещаются.                                                                                                                                                                      |

Таблица задаёт overrides и explicit policies. Перед включением фиксируется также
полный effective rule inventory унаследованных presets: rule ID, level/options,
source preset, owner policy. Не добавлять recommendedTypeChecked/strict целиком
под видом T02–T06: дополнительные type-aware rules отдельно не выбирались.

Configuration exceptions A02 ограничены известными eslint/prettier/vite и
аналогичными *.config файлами; точные globs перечисляются в README и fixtures.
Случайные source files не получают default-export исключение по имени каталога.
Prettier package entry сам является configuration file.

A03 проверяет присваивания, а не доказывает глубокую неизменность: вызов
изменяющего метода вроде array.push этим rule не запрещается автоматически.
A04/A06 не дают права менять последовательные операции на Promise.all ради
линтера. Нужные проекту исключения задаются явно, с обоснованием, через обычные
ESLint overrides/disable comments; общая поставка не содержит скрытых обходов.

## Prettier: принятые настройки

| ID  | Параметр           | Значение  |
| --- | ------------------ | --------- |
| P01 | tabWidth / useTabs | 2 / false |
| P02 | singleQuote        | true      |
| P03 | semi               | true      |
| P04 | trailingComma      | all       |
| P05 | printWidth         | 80        |
| P06 | arrowParens        | always    |
| P07 | endOfLine          | lf        |
| P08 | objectWrap         | preserve  |

printWidth — ориентир, не жёсткий max-len. objectWrap сохраняет намеренно
многострочные объекты, но не заставляет любой короткий объект занимать несколько
строк. Другие параметры берутся из закреплённой версии Prettier без скрытых
изменений. Framework plugins отсутствуют.

Prettier отвечает за своё форматирование, ESLint — за correctness и выбранные
структурные требования. eslint-config-prettier отключает конфликтующие правила;
padding/arrow body/curly проверяются на устойчивость совместно с formatter.
Не запускать Prettier как ESLint rule. Если выбранное требование нельзя
устойчиво выразить готовыми правилами, показать конфликт владельцу, а не
молчаливо отключить правило или написать новый printer.

## Пример согласованного стиля

До:

```ts
export const displayName = (user) => user.name;
export const load = async (api, id) => {
  const user = await api.get(id);
  if (!user) return null;
  return user;
};
```

После:

```ts
export const displayName = (user) => {
  return user.name;
};

export const load = async (api, id) => {
  const user = await api.get(id);

  if (!user) {
    return null;
  }

  return user;
};
```

Это иллюстрация оформления, не новый application API.

## Совместимость, проверка и границы

Проверенная комбинация версий: ESLint 10.14.0, @eslint/js 10.0.1,
typescript-eslint 8.72.1, @stylistic/eslint-plugin 5.10.0,
eslint-plugin-import-x 4.17.1, eslint-config-prettier 10.1.8, Prettier 3.9.10.
Peer ranges ESLint ^10.14.0, TypeScript ^5.9.3 и Prettier ^3.9.10
проверены установкой реальных tarballs во внешний consumer на Node 26.0.0
и 26.11.1. Эти проверки подтверждают конкретную комбинацию закреплённых
версий, а не все будущие версии внутри peer ranges.

Проверки первой версии: positive/negative JS/TS fixtures с ожидаемыми rule IDs,
включая каждую выбранную policy; required type information и разные окружения;
локальный override; default-export exception; импорты value/type; идемпотентный
format и отсутствие цикла ESLint fix → Prettier → ESLint. Реальные tarballs
устанавливаются во внешний consumer без исходного checkout.

Правила, меняющие accepted source или output форматирования, требуют явной
записи в changelog и оценки breaking change; версии двух пакетов независимы.
Публикация и release tags отдельно согласуются. Proposed нормы gost-spec этим
пакетом не становятся accepted.

Подключение в gost-kit и его пример — #5. Массовое форматирование runtime-кода,
изменение asc-admin, frameworks и custom reactive-state rule #6 вне #12.
Custom ESLint plugin появляется с первым конкретным новым правилом; у каждого
такого правила обязательны valid/invalid RuleTester tests и tests autofix, если
он предусмотрен. Пустой plugin заранее не создаётся.

## Официальный baseline

- [ESLint shareable configs](https://eslint.org/docs/latest/extend/shareable-configs)
- [ESLint arrow body](https://eslint.org/docs/latest/rules/arrow-body-style)
- [typescript-eslint configs](https://typescript-eslint.io/users/configs/)
- [Import-X duplicate imports](https://github.com/un-ts/eslint-plugin-import-x/blob/master/docs/rules/no-duplicates.md)
- [Import-X named exports](https://github.com/un-ts/eslint-plugin-import-x/blob/master/docs/rules/no-default-export.md)
- [Stylistic padding](https://eslint.style/rules/padding-line-between-statements)
- [Prettier sharing](https://prettier.io/docs/sharing-configurations)
- [Prettier options](https://prettier.io/docs/options)
- [Prettier integration](https://prettier.io/docs/integrating-with-linters)

## Результат проверки 2026-11-04

- Полный `npm run check` на Node 26.0.0 и 26.11.1: сборка, типизация и
  179 тестов (common 124, svelte 6, eslint-config 46, prettier-config 3).
- Исходники двух новых пакетов проходят собственный ESLint config и Prettier.
- Существующий functional-core example: check (26 тестов), build и
  2 browser-сценария прошли; runtime-пакеты и example не изменены.
- Реальные tarballs установлены вне checkout на обеих версиях Node;
  после начальной загрузки зависимостей повторный `npm ci --offline` прошёл.
  Проверены rule IDs без parser errors, overrides, ESLint/Prettier fix stability,
  NodeNext types и явные `.js` imports. Common/Svelte не устанавливаются.
- В tarballs нет tests, test helpers, исходников и локальных материалов.
  Changeset готовит только два новых minor releases 0.0.0 → 0.1.0.
- Независимое ревью выявило E12 для export const. Два regression tests сначала
  воспроизвели ошибку; после согласованного расширения группы на любые export
  прошли. Повторное ревью: открытых находок нет.

Ограничение dependency audit: npm сообщил 14 moderate записей, связанных
с одним advisory [minimatch GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249)
для разрешённого minimatch 10.2.6 в цепочках ESLint/typescript-eslint/Import-X.
Предложенные audit откаты меняют выбранный совместимый baseline; принудительный
major override не применялся. Также остаются две low записи прежней Svelte-цепочки
[deepmerge GHSA-gcqx-w48m-w2h4](https://github.com/advisories/GHSA-gcqx-w48m-w2h4).
Dependency audit не считается чистым; требуется отдельно проверить совместимое
обновление upstream. Публикация этой задачей не выполняется.
