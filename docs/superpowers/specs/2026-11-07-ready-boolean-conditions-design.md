# Готовые boolean-условия в Svelte template — #18

## Цель и подтверждённый контракт

В бизнес-компоненте остаётся условная разметка, но её условие — готовый boolean.
Presenter вычисляет условия. Не определяем допустимость по имени `is*` или по
тому, называется ли объект `viewState`: проверяются форма чтения и тип.
Владелец отдельно подтвердил, что `{#if true}` и `{#if false}` разрешены.

```svelte
{#if isLoaded}
  <p>Ready</p>
{:else if viewState.isFailed}
  <p>Failed</p>
{:else}
  <p>Waiting</p>
{/if}
```

Сравнения, логические комбинации, отрицание, арифметика, вызовы, присваивания
и тернарные выражения в условии переносятся в presenter. Условия скриптов,
reducers, effectors и presenter-функций это правило не ограничивает.
Другие template computations входят в #19, включая интерполяции/props, а не
только derived. Runtime для локального UI-state — отдельная #27.

## Подход и подключение

Новое правило `gost/ready-boolean-condition` в существующем plugin. Синтаксическая
проверка отличает готовое чтение от вычисления; TypeScript checker проверяет
получившийся тип. Проверка только имени/формы пропускает object/string/any;
проверка только типа разрешает `a && b`, возвращающий boolean. Нужны обе.

Публичный Svelte config регистрирует правило и оставляет выключенным. Приватный
project adapter включает его для `src/**/*.svelte`. Для UI-Kit потребитель может
оставить поздний override `off`, как для #16/#17; остальные checks сохраняются.
Никакого архитектурного режима или нового пакета.

## Технические границы первой версии — предложение

### Форма

- Проверяются все SvelteIfBlock: `{#if}` и `{:else if}`, в том числе вложенные,
  each/await/snippet contexts. Обычный `else` не содержит условия и не меняется.
- Разрешены boolean literals, Identifier и цепочка доступа к полю от Identifier.
  Static bracket keys (`view['isReady']`) и numeric literal index (`flags[0]`)
  разрешены как чтение, если итоговый тип boolean.
- Динамический ключ (`view[key]`, `flags[index]`) не допускается первой версией:
  это выбор значения в условии; presenter выдаёт именованный boolean. Вызов в
  receiver/key (`present().ready`, `view[getKey()]`) также вычисление.
- Optional access допустим по форме, но итоговый тип всего выражения должен быть
  boolean. `maybeView?.isReady` с типом boolean | undefined не допускается;
  optional access к заведомо nonnullable объекту с типом boolean допускается.
- Type assertions/non-null assertions/`satisfies` wrappers в условии не считаются
  простым чтением. В частности, `unknownValue as boolean` не обходит проверку.
  При необходимости аннотация и подготовка значения делаются вне template.

### Тип

Допускаются boolean и boolean literal types `true`/`false`, включая unions,
состоящие только из них. Nullable/optional boolean, string/number/bigint,
object/function, any/unknown/never, mixed unions
не принимаются. Проверяется тип выражения в конкретном месте, с обычным TS flow
narrowing; ранее корректно суженное до boolean значение не запрещается из-за
более широкой декларации.

Generic parameter допускается, если TypeScript доказывает boolean constraint
(например, `T extends boolean`); unconstrained/any constraint не допускается.
Обычный type alias к boolean разрешён. Проверка не строится на строке type name.

Тип — не runtime validator и не доказательство purity/provenance. Getter может
возвращать boolean, простой флаг может быть вычислен локально в script; правило
не доказывает, что значение пришло из presenter. Контроль вычислений — #19.
Indexed access зависит от consumer tsconfig (`noUncheckedIndexedAccess` и т.д.);
проверка не обещает обнаружить runtime undefined, который TS не отражает в типе.

### Parser/services

Проверка применяется к `.svelte` файлам, включая JS-script/stateless components:
установленный svelte-eslint-parser с TS parser/project service даёт program и
для них (проверено read-only экспериментом на текущих версиях).
Не распространяется на `.svelte.ts/.js` и обычный TS.

Literal boolean не требует type services. Заведомое вычисление/неboolean literal
может получить диагностику формы без checker. Для Identifier/member read нужны
настоящие parser services с type information и включённый `strictNullChecks`
(напрямую или через `strict`). Без null checking TypeScript стирает nullable
unions, и обещать их отбрасывание нельзя. При отсутствии services/strict null
checking — configuration error, а не молчаливый успех или предположение о boolean. Компонент без условий
не запрашивает checker только ради включённого правила.

Одна диагностика `readyBoolean` на одно неправильное условие: подготовить
именованный boolean в presenter и прочитать его в template. Без autofix или
suggestions, создающих presenter/имя поля либо меняющих реактивность.

## Подключение к примеру

Сейчас UserForm проверяет `viewState.loadedUser` (User | null), GlobalAlert —
`alert` (object | null). Они нарушают новый контракт даже при простой форме.
Не добавляем исключения в example и не оставляем новый project override пустым.

- `userPresenter` добавляет `hasLoadedUser` по наличию data, а не по статусу:
  данные остаются видимыми при loading/error, как сейчас. Сохраняется существующий
  `loadedUser` contract/reference; готовые `loadedUserName/loadedUserEmail` дают
  безопасный текст без non-null assertions в компоненте. Покрываются пустой state,
  loaded data и сохранение данных при других статусах.
- Новый `global-alert.presenter.ts` с colocated tests принимает alert state и
  возвращает `isVisible`/`message`; null означает false/пустой текст. Компонент
  выбирает alert через `$derived`, затем вызывает presenter с выбранным входом.
- В templates остаются `{#if view.hasLoadedUser}` / `{#if view.isVisible}` и
  чтение готовых текстовых полей. DOM/действия/browser scenarios сохраняют результат.
- Ни глобальный FC state/reducers, ни UI-Kit runtime не меняются ради линтера.

## Проверки и поставка

- RuleTester: bool literals/variables/fields/aliases/static brackets, else-if и
  вложенные blocks; reject comparisons/logical/not/call/ternary/computed keys,
  неверные и nullable типы, any/unknown/never, assertions, generic boundaries.
- Проверить TypeScript, JS-script и stateless cases с настоящими type services;
  отсутствие services для lookup — config error. Не считать parser/type errors
  доказательством rule diagnostic: fixtures компилируются Svelte compiler.
- Program/parser mappings для each/await/snippet/local shadowing и optional access
  проверяются на реальных fixtures; один condition — одно сообщение.
- Consumer config tests: default off, explicit on, UI-Kit off с сохранением checks;
  отдельно отсутствие влияния на script if и rune modules.
- Pure presenter tests, svelte-check, autofixer для изменённых компонентов, полный
  root check, production build и оба browser scenarios существующего примера.
- Настоящие packed plugin/config во внешнем consumer с type information; type-only
  API declarations проходят strict TS; tooling не подтягивает GOST runtime,
  src/tests не попадают в артефакты. Changeset: plugin minor + Svelte config patch.
- Один независимый review перед PR, findings закрепляются RED→GREEN.

## Статус

#30 слит в main (`730b73a`) после успешного CI. #18 начата в отдельной ветке.
Boolean literals подтверждены владельцем; остальные технические границы выше
предложены исполнителем и ожидают утверждения дизайна до реализации.

Независимый builder-check: важных неразрешённых вопросов для плана нет.
