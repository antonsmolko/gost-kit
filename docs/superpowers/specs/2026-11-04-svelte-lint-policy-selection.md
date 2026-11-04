# Выбор правил Svelte 5

Статус: согласованы S01–S14 и AS01–AS03 на error; AS04–AS06 выключены. Реализация #15.
Основание: владелец согласовал отдельный @gost-kit/eslint-config-svelte
и порядок «список правил → выбор → дизайн/план → реализация».
Текущая локальная интеграция #5 остаётся рабочей; её изменения сохраняются.

## Поставка

Третий независимо версионируемый config-пакет использует публичный API
@gost-kit/eslint-config и добавляет parser/правила для компонентов и rune-модулей.
Потребитель Svelte устанавливает Svelte-конфигурацию; общая основа приходит
её зависимостью. Не копировать общие E/T/A policies. Среда browser/Node,
исключения проекта и Svelte config задаются явно на уровне потребителя.
SvelteKit-specific правила в первую SPA-версию не включаются.

Prettier-конфигурация остаётся общей; prettier-plugin-svelte подключается
проектом. Новый Prettier config-пакет не нужен.
Собственное правило #6 подключается позже с отдельной реализацией и тестами.

## Предлагаемый набор S

Во всех именах ниже префикс svelte/. Рекомендуемый уровень — error,
включая tests; адресные исключения должны объяснять причину.
Это перечисленный набор, а не неявное включение всех recommended rules.

| ID  | Правила                                                                                              | Требование                                                                                               |
| --- | ---------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| S01 | no-dupe-else-if-blocks                                                                               | Не повторять условия веток if/else if в шаблоне.                                                         |
| S02 | no-not-function-handler                                                                              | Обработчик события должен быть функцией.                                                                 |
| S03 | no-object-in-text-mustaches                                                                          | Не выводить объект непосредственно в текстовую интерполяцию.                                             |
| S04 | require-each-key, valid-each-key                                                                     | Каждый each имеет ключ, использующий переменные этого блока.                                             |
| S05 | button-has-type                                                                                      | Кнопка явно объявляет type.                                                                              |
| S06 | no-bind-value-on-checkable-inputs                                                                    | Для checkbox/radio не использовать неподходящий bind:value.                                              |
| S07 | no-dupe-style-properties, no-shorthand-style-property-overrides, no-unknown-style-directive-property | Проверять дубли CSS properties, перекрытия shorthand и имена style directives.                           |
| S08 | no-conflicting-module-names                                                                          | Не размещать Foo.svelte и одноимённый Foo.svelte.ts/Foo.svelte.js, конфликтующие при разрешении модулей. |
| S09 | no-svelte-internal                                                                                   | Не импортировать внутренний API svelte/internal.                                                         |
| S10 | no-at-debug-tags, no-inspect                                                                         | Не оставлять @debug и $inspect в проверяемом коде.                                                       |
| S11 | no-unused-svelte-ignore, no-unused-props                                                             | Удалять неиспользуемые svelte-ignore и объявленные, но неиспользуемые Props.                             |
| S12 | no-unnecessary-state-wrap                                                                            | Не оборачивать уже реактивные классы в лишний $state.                                                    |
| S13 | prefer-derived-over-derived-by                                                                       | Использовать $derived(expr), если функция derived.by только возвращает выражение.                        |
| S14 | prefer-writable-derived                                                                              | Предпочитать derived распознаваемому простому сочетанию state + effect с единственным присваиванием.     |

S04 не доказывает уникальность/стабильность ключа и не запрещает index-key:
это более слабый контракт, чем «всегда использовать item.id». Проверка уникальности
и правильного выбора ключа остаётся в ревью до отдельного усиления.
S12 не запрещает $state.raw обычного immutable state в нашем shell.
S14 не является общим запретом $effect и не доказывает эквивалентность произвольных
реактивных алгоритмов; автоматическую миграцию сложных эффектов не предполагаем.
У S11 поведение spread/forwarded props проверяется fixtures перед включением.

## Дополнительный выбор A

| ID   | Правило                                    | Предлагаемый выбор и причина                                                                                                                                                                                                                                                                                                               |
| ---- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| AS01 | no-at-html-tags                            | Включить: любой @html требует осознанного локального исключения и безопасного источника HTML. Правило запрещает синтаксис, а не проверяет санитайзер.                                                                                                                                                                                      |
| AS02 | block-lang: script ts                      | Включить: script при наличии использует lang="ts"; не требовать script в компоненте без логики.                                                                                                                                                                                                                                            |
| AS03 | no-store-async, no-ignored-unsubscribe     | Включить при использовании стандартных Svelte stores: защищать подписки и async store callbacks. no-store-async не запрещает async API effects. no-ignored-unsubscribe синтаксически проверяет любой проигнорированный прямой .subscribe(), без доказательства типа Svelte store; для чужого API возможен обоснованный точечный exception. |
| AS04 | no-add-event-listener, no-dom-manipulating | Пока выключить: допустимы интеграции с DOM и сторонними библиотеками; потребуется отдельная политика исключений.                                                                                                                                                                                                                           |
| AS05 | no-top-level-browser-globals               | Пока выключить для SPA; рассмотреть отдельно для SSR.                                                                                                                                                                                                                                                                                      |
| AS06 | prefer-svelte-reactivity                   | Пока выключить: императивные Date/Map/Set вне реактивной UI-задачи могут быть намеренными. Решение о reactive wrapper принимать по месту.                                                                                                                                                                                                  |

## Примеры

```svelte
<!-- S04: ключ зависит от элемента -->
{#each users as user (user.id)}
  <p>{user.name}</p>
{/each}

<!-- S05: явно определяем поведение кнопки -->
<button type="button" onclick={close}>Закрыть</button>
```

```ts
// S13
const fullName = $derived(`${firstName} ${lastName}`);

// S14: распознаваемое простое вычисление
let name = $derived(user.name);
```

```svelte
<!-- AS02: компонент с логикой -->
<script lang="ts">
  const { name }: { name: string } = $props();
</script>

<p>{name}</p>
```

## Что остаётся отдельно

- Форматирование HTML/CSS/атрибутов — Prettier; не включать конфликтующие ESLint stylistic rules.
- Compiler diagnostics и accessibility warnings продолжают проверяться svelte-check;
  ESLint не заменяет проверку Svelte compiler/types.
- Legacy stores и устаревший синтаксис не становятся частью нового рекомендуемого
  стиля только потому, что upstream preset умеет их проверять.
- SSR/SvelteKit policies, #6 и новые собственные проверки обсуждаются отдельно.

## Следующие шаги

1. Владелец отмечает S01–S14 и AS01–AS06; уровни подтверждаются с набором.
2. Зафиксировать дизайн пакета: API factory, peers, dependency versions,
   перенос адаптера, scope files, compatibility и independent changeset.
3. Реализовать пакет и тесты правил/реальных packed consumers; заменить локальный
   adapter у gost-kit и example. Проверить fix/format, types/unit/browser.

## Источники

Сверено с установленным eslint-plugin-svelte 3.24.0 и его meta/schema.

- [Официальные правила](https://sveltejs.github.io/eslint-plugin-svelte/rules/)
- [Подключение и preset boundaries](https://sveltejs.github.io/eslint-plugin-svelte/user-guide/)
- [Граница valid-each-key](https://sveltejs.github.io/eslint-plugin-svelte/rules/valid-each-key/)
- [Props и forwarding](https://sveltejs.github.io/eslint-plugin-svelte/rules/no-unused-props/)
- [Граница prefer-writable-derived](https://sveltejs.github.io/eslint-plugin-svelte/rules/prefer-writable-derived/)

Уточнение владельца: состояние читается из root/feature и изменяется через dispatch/reducer. Presenter вычисляет представление. Вычисления component derived — отдельная #19; выбор feature через derived сохраняется (#6); владение состоянием (#16), dispatch в UI (#17), boolean rendering (#18) — отдельные задачи.
