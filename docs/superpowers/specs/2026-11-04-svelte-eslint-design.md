# Отдельная ESLint-конфигурация Svelte — #15

Владелец согласовал отдельный пакет и поручил реализацию после описания задач.
Работа: feature/gost-kit-15-svelte-eslint-config, база локальная интеграция #5
63cf1c9. Новые custom architecture rules #6/#16–#19 остаются отдельными outcomes.

## Поставка и API

@gost-kit/eslint-config-svelte — независимый npm development package, source
version 0.0.0 + minor changeset подготавливают первый 0.1.0. Использовать общую
@gost-kit/eslint-config как dependency, не менять её framework-independent scope.
ESLint ^10.14.0, TypeScript ^5.9.3 и Svelte ^5.57.2 — peers, проверяемые на
закреплённых версиях; Node ^26.0.0. Адаптеры eslint-plugin-svelte 3.24.0 и
svelte-eslint-parser (точная установленная версия) — production dependencies;
typescript-eslint 8.72.1 нужен для TS parser. Prettier остаётся отдельным пакетом.

Выбран перенос существующего адаптера с минимальным API:
`await createSvelteConfig({ tsconfigRootDir })` → `Linter.Config[]`.
ConfigOptions переэкспортируется из публичного @gost-kit/eslint-config.
Factory асинхронна: публичный ESLint.calculateConfigForFile получает полную
shared TS policy без копирования rules или привязки к private config names.
Используется синтетический .ts path только для расчёта config, не для парсинга;
он не требует существующего файла или root-level tsconfig. Factory не пишет файлы.
Неверный root отклоняется общей factory; отсутствие consumer tsconfig даёт
понятную parser diagnostic при проверке TS. Браузерные/Node globals не навязываются.

К shared config добавляются Svelte base/parser, compatibility с Prettier,
единый extraFileExtensions для TS/component, поддержка .svelte.ts и .svelte.js,
shared TS rules для component scripts и явный согласованный набор Svelte rules.
Builtin plugin @ не переносится из calculated config между ESLint instances.
Собственный Svelte config/compiler options потребитель добавляет overrides.

## Выбранные правила

S01–S14 и AS01–AS03 из отдельного списка selection включены на error.
AS02: script ts, enforceScriptPresent false. AS04–AS06 не включаются.
Никакого неявного полного recommended preset: он содержит дополнительные
политики и Kit-specific rules. Шаблонный CSS/HTML formatting остаётся Prettier.
Границы каждой проверки документируются. Feature selector
`const user = $derived(root.state.user)` и вызов `userPresenter(user)` сохраняются.
State ownership и вычисления derived не реализуются готовым upstream preset;
их отдельно проверят #16/#19. В imperative shell $state.raw сохраняется.

## Перенос потребителей

Локальный tooling/eslint-config.ts становится тонким config consumer с project
ignores/globals. Общая parser/policy composition перемещается в новый пакет.
Root build собирает новый пакет последним; check на чистом checkout сначала
строит exports. Example явно зависит от нового пакета локально. Публичные
runtime-пакеты, FC и поведение компонентов не меняются.

## Проверка и границы

Сначала отрицательные и положительные fixtures: каждый выбранный rule даёт
свой rule ID без parser failure; JS без tsconfig, components/rune TS/JS,
config defaults, forwarded props, feature-selector, overrides и missing project.
Фиксы ESLint и Prettier должны сходиться; Svelte API/compiler version фиксируются.
Проверить реальные tarballs в отдельном consumer, explicit.js declarations/ESM,
отсутствие tests/helpers/private material и отсутствие runtime common/svelte
как навязанной зависимости приложения. Svelte peer устанавливается явно.
Полные root/example type/unit/build/browser проверки и Node minimum26.0.0.
Независимое review полного результата. Без merge или публикации.

Источники: https://sveltejs.github.io/eslint-plugin-svelte/user-guide/ ,
https://sveltejs.github.io/eslint-plugin-svelte/rules/ ,
существующий проверенный локальный адаптер #5.

## Результат реализации

Реализован createSvelteConfig и выбранные 23 правила (плюс infrastructure
Svelte base), публичный dependency на общий config; локальный adapter содержит
только environments. Root/example используют новый пакет. Существующий
runtime-код и компоненты этим change не меняются.

Проверка:

- 34 теста нового пакета, включая ожидаемый rule ID каждой выбранной проверки,
  component/rune TS/JS scopes, props forwarding и feature selector.
- Полный check: 213 package tests + 11 project config tests + 26 example tests,
  typechecks и style gates; example build и 2 browser scenarios прошли.
- Удалены dist всех трёх config-пакетов, выполнены npm ci в корне и example;
  общий check строит отсутствующие exports и проходит на чистой установке.
- Полный check и внешний consumer прошли на Node 26.0.0 и 26.11.1.
- Реальные tarballs трёх configs устанавливаются во внешний consumer,
  повторный npm ci --offline проходит. Component/rune policies, overrides,
  NodeNext declarations и fix/format convergence проверены вне checkout;
  @gost-kit/common и @gost-kit/svelte не устанавливаются.
- Архивы содержат только разрешённые metadata/docs/build outputs, без tests,
  исходников и приватных fixtures; imports declarations/ESM используют .js.
- Независимое review не выявило существенных findings; отдельно подтверждены
  activation Svelte rules на TS/JS rune modules и содержимое tarballs.
  Уточнена AS03 формулировка: no-ignored-unsubscribe проверяет прямой .subscribe
  синтаксически, не распознавая тип API. Это ограничение одинаково описано
  в selection и package README.

Known dependency audit: 15 moderate reports minimatch advisory
GHSA-g3hv-75wg-m249 и 2 low reports deepmerge GHSA-gcqx-w48m-w2h4 в общем
repository tree. Audit не чистый; непроверенные major overrides не применялись.

#5 отдельно закоммичена/отправлена как 63cf1c9; #15 пока локально в своей ветке.
Публикация или merge не выполнялись. Custom architecture rules остаются
отдельными outcomes; упрощённые upstream проверки не объявляются их заменой.

Follow-up #5 16fb363: локальные ESLint configs/helper переведены на TS, загрузка через jiti2.7, root check:tooling и example tsconfig проверяют типы. #15 сохранён поверх этого follow-up, без возврата .mjs конфигов.

Follow-up #5 41e6f13: Prettier configs и helper tests также TS, включены в tsc. Test runner и Prettier используют nativeNode26; helper type-safe import сохраняет локальный jiti без globalhook. #15 перенесена поверх follow-up с сохранением Svelte package изменений.
