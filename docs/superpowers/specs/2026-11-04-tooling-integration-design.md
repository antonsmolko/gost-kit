# Подключение общих конфигураций — #5

Основание: владелец поручил смержить #13 и подключить готовые конфигурации.
PR #13 смержен в main (656024a), реализация ведётся в отдельной ветке #5.
Правила и уровни уже согласованы в дизайне shared-tooling; повторного выбора нет.

## Подход и область

Потреблять публичные API двух workspace config-пакетов. Добавить локальный слой
Svelte через eslint-plugin-svelte base/parser и prettier-plugin-svelte;
не добавлять ещё один набор рекомендованных Svelte-правил без обсуждения.
Альтернатива копирования правил расходится с целью единого источника.
Расширять framework-independent npm-пакеты Svelte-зависимостями не требуется.

Локальный helper конфигурации получает shared TypeScript policy через публичный
ESLint calculateConfigForFile и применяет её к .svelte с Svelte parser. Так новые
политики не теряются в компонентах и не копируются вручную. Рунные .svelte.ts
остаются TypeScript с поддержкой Svelte globals. Browser globals только в исходниках
Svelte-пакета/SPA, Node globals — в конфигурациях, скриптах и тестах.

Корень проверяет все packages и свои configs/tooling; самостоятельный example
имеет собственные configs и зависимости, вызывается корневыми командами.
Команды lint/lint:fix/format/format:check охватывают авторские TS/JS/Svelte,
поддерживаемые project config и documentation. Игнорировать build/generated,
lockfiles, зависимости, отчёты, локальные agent/review материалы.

Существующий код привести к правилам без изменения публичных API и поведения.
Не ослаблять правила глобально; точечное исключение допустимо с объяснением
семантики (например, последовательный dispatch нельзя сделать параллельным).
Добавлять регрессионный тест только при содержательной правке поведения.
Намеренные негативные примеры типов/тестов сохраняются с адресным обоснованием.

#6 (собственное правило реактивного feature state) остаётся отдельной задачей;
#5 не считается полностью закрытой до его подключения. Публикация не выполняется.

## Проверка

Негативные disposable probes доказывают охват JS/TS/Svelte/rune/test/config,
включая type-aware ошибки, импорты и project globals. ESLint fix + Prettier
должны сходиться, повторный прогон не меняет файлы. Полный check пакетов,
example check/build/browser и чистая установка из lockfiles должны проходить.
Независимое ревью проверяет охват и сохранение семантики миграции.

## Результат проверки

Подключены команды lint/lint:fix/format/format:check/fix в корне и example.
Корневой fix охватывает оба проекта; check выполняет build config exports,
тесты адаптера, lint/format, типизацию и тесты всех пакетов и example.
Example check сохраняет самостоятельные style/type/test gates; check:code
позволяет корню не повторять уже выполненные style gates. CI устанавливает
оба dependency tree до общей проверки и отдельно выполняет build/browser.

- `npm ci` в корне и example после удаления dist обоих config-пакетов,
  затем полный check: проходят. Bootstrap не требует опубликованных configs.
- 179 тестов пакетов, 11 тестов подключения, 26 тестов example.
- На Node 26.0.0 и 26.11.1 выполнена общая проверка.
- Example build и 2 Playwright-сценария прошли.
- Повторный fix не меняет файлы. Все Svelte/rune-модули проверены
  Svelte autofixer: ошибок нет. Единственная рекомендация относится
  к записи наблюдений в обычный массив внутри тестового $effect;
  это намеренное наблюдение, не обновление реактивного состояния.
- Сравнение AST подтверждает сохранение публичных типов и runtime-логики
  после нормализации оформления и arrow bodies. Ручные изменения:
  синхронный обход результатов dispatch/clean-build через forEach,
  явное игнорирование уже перехваченного результата safeRun.async,
  проверка mount element вместо non-null assertion. Негативный тест
  копирует readonly items при построении результата, исключая постороннюю
  ошибку присваивания массива. @ts-expect-error перенесены к точным строкам
  после форматирования; intentional readonly assignments имеют узкие
  ESLint exceptions с объяснением.
- Независимое ревью: существенных находок нет. Дополнительный regression
  test выявил отсутствие .svelte-kit ignore; RED → явное исключение → GREEN.

Пакеты configs не изменялись; framework-зависимости остались у потребителей.
Новых package releases этот tooling/formatting change не требует.
Audit остаётся не чистым: в корне 15 moderate dependency reports одного
minimatch advisory GHSA-g3hv-75wg-m249 и 2 low deepmerge reports
GHSA-gcqx-w48m-w2h4; новых advisory по сравнению с #12 нет.
Принудительные несовместимые обновления не применялись.

#5 остаётся открытой для подключения будущего правила #6. Публикация
и интеграция API-клиента из отдельного PR #11 не входят в эту работу.

## Уточнение: TypeScript-конфиги ESLint

По запросу владельца root/example eslint.config и tooling helper переведены
с .mjs на .ts. Jiti 2.7.0 — явная devDependency обоих проектов; ESLint
использует штатный TS config loader без unstable flags. Node 26 сам поддерживает
стирание типов, но default loader ESLint10 для TS config требует jiti.
Root tsconfig.json включает eslint.config.ts и tooling/**/*.ts; check:tooling
входит в общий check. Example config проверяется существующим tsconfig.
Типы Linter.Config[] и параметры helper проверяются tsc; jiti не проверяет типы.
Дополнение владельца: Prettier configs root/example и helper tests тоже переведены на TS. Prettier загружает TS нативно на Node26; node:test запускает TS нативно на Node26, сохраняя точечную типизированную загрузку helper через createJiti.import для extensionless imports. Глобальный jiti/register не используется: его wrapping CommonJS зависимостей несовместим с LazyLoadingRuleMap установленного ESLint (воспроизведено при проверке). Все root tooling/config TS-файлы входят в tsc, example configs покрыты его tsconfig.
