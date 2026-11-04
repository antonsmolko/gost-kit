# Исправления ревью gost-kit #25

Исходное ревью: https://github.com/antonsmolko/gost-kit/issues/25.
База: d6883b7, реализация #6 уже включена. Дизайн #16 и локальный UI-state #27
не входят в эту работу. Здесь исправляются существующие tooling/API boundaries.

## 1. Общая TypeScript policy

Дополнительный экземпляр ESLint и проход calculateConfigForFile убраны из
Svelte factory. Публичная `createTypeScriptPolicy({ tsconfigRootDir })`
композирует рекомендованные JS/TS rules, Prettier compatibility и собственные
rules/plugins/language options. Она не задаёт filenames; adapter выбирает свою
область файлов и parser. `createConfig` использует ту же фабрику для TS-блока.
Async signature `createSvelteConfig` сохранена.

Предложенный lookup одной записи по приватному name не используется: defineConfig
разворачивает extends в несколько слоёв, и одиночная запись не равна всей policy.
Порядок рекомендаций/compatibility/explicit policy сохранён. Эффективные rules
и plugin namespaces фактически сравнены с конфигом до рефакторинга.

Уточнение фактов ревью: calculateConfigForFile не парсил синтетический TS-файл;
предыдущая реализация намеренно не требовала его существования. Устранён лишний
проход нормализации, а не выполнение TypeScript parser над placeholder.

## 2. JSX/TSX

Общий config покрывает JSX/TSX синтаксис и общие JS/TS rules. React/прочие
framework-specific rules не добавлены. JSX работает без TypeScript project;
TSX использует проект и JSX-настройки потребителя. Проверяются rule IDs вместо
успешного игнорирования файла, а valid JSX component references не считаются unused.
Svelte project-extension scope согласован с расширенным TS glob.

## 3. Зависимости

Убраны прямые @typescript-eslint/utils и eslint-import-resolver-node из общего
config package. В закреплённом import-x 4.17.1 default resolver использует
bundled unrs-resolver; legacy fallback нужен лишь отдельным consumer settings.
README описывает самостоятельную установку optional peer для legacy options.
Utils остаётся там, где используется другими пакетами/транзитивными зависимостями.
Оба lockfile обновлены; platform-native entries не удалялись. Из root lock
удалено 102 ненужные записи legacy resolver dependency tree.

## 4. Content-Type

Content-Type — singleton, несколько значений не становятся корректным заголовком
из-за того, что body содержит JSON. Политика клиента остаётся строгой:
combined значения, включая одинаковые, означают contract failure.

Обнаружен реальный дефект: при первом значении с `; charset=...` старый split
терял следующую часть списка и принимал combined header. Исправлено отклонение
запятых вне quoted strings. Запятые и escaped quotes в quoted parameters остаются
допустимыми. Essence извлекается из исходной строки, а не из очищенной копии.
JSON null, 204/HEAD и приоритет HTTP-ошибок сохраняются.

Предложенный безусловный split(',')[0] отклонён: он скрыл бы конфликтующие
значения. Политика и риск неоднозначного восстановления описаны в
[RFC 9110 §8.3](https://www.rfc-editor.org/rfc/rfc9110.html#section-8.3),
quoted-string grammar — в [§5.6.4](https://www.rfc-editor.org/rfc/rfc9110.html#section-5.6.4).
Это API contract policy, не реализация browser MIME sniffing или полного MIME parser.

## 5. Synthetic API примера

Фактическая дублирующаяся реализация находилась в examples/functional-core/src/api,
а не в указанном в ревью packages/common/src/api. Production module
`create-synthetic-api.ts` переиспользуется demo fakeApi и тестами. Test-only helper
в production imports не попадает. Demo operation сохраняет success payload,
400ms delay и failure email. Проверка некорректного payload теперь предшествует
симулированной операции/задержке; она по-прежнему не вызывает operation и даёт
тот же нормализованный network result.

## Проверка

Регрессии Content-Type и JSX/TSX/adapter-policy наблюдались красными до исправлений.
Тесты synthetic adapter и demo delay прошли на старой и общей реализации.
Полный check, browser scenarios, реальные tarballs, installation/typecheck/resolver
consumer и независимое ревью подтверждаются перед PR. Release changeset:
minor общего config с новым публичным API/coverage, patch Svelte config и common.
Merge и публикация в эту задачу не входят.

## Подтверждённый результат

- Полный check исходного дерева: 369 тестов, типы/style gates; production build
  примера и два Playwright scenarios прошли.
- Полный check повторён в чистой disposable копии после version:packages,
  нового npm ci корня/примера и реального повышения версий: также 369 тестов.
- Проверены generic config 0.2.0, Svelte config 0.2.0, plugin 0.1.0 и common
  0.2.1; Svelte config действительно требует новый generic 0.2.0 и plugin 0.1.0.
- Реальные tarballs всех шести пакетов не содержат src/tests/helpers. Внешний
  consumer подтвердил JSX/TSX diagnostics, JSX component references, Svelte
  typed rules и public policy declarations. Legacy resolver и GOST runtime
  отсутствовали при проверке tooling; default import resolver работал.
- После установки runtime tarballs проверены неоднозначные headers, quoted comma
  success и public API/NodeNext typecheck. Svelte export импортируется.
- Независимое whole-branch review без material findings; reviewer отдельно
  повторил 51 generic-config, 39 Svelte-config, 167 common и 33 example tests.

Исходный untracked дизайн #16 сохранён отдельно и не входит в коммит #25.
