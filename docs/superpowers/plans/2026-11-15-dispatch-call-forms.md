# Dispatch call forms implementation plan

> **For agentic workers:** Use superpowers:executing-plans inline, with one final independent review.

**Goal:** Поддержать строковый и объектный вызовы одного dispatch, предпочитая строковый в обычном коде.

**Architecture:** Из существующего union действий выводятся обе формы вызова. Объект `{ action, payload }` принимается напрямую из API callbacks. Единственная нормализация в dispatch формирует прежний вход reducer `{ scope, type, payload }`; forwardAction удаляется.

**Tech Stack:** TypeScript 5.9.3, Node 26, Vitest, Svelte 5, ESLint, Playwright.

**Spec:** `docs/superpowers/specs/2026-11-14-dispatch-path-design.md`, уточнение владельца от 2026-11-15.

## Global constraints

- Поддержать `dispatch(path, payload)` и `dispatch({ action: path, payload })`.
- В обычном коде и примерах предпочитать строковые вызовы.
- Тип payload произвольный; отсутствие и необязательность данных сохраняются.
- Оба вызова используют одно исполнение; семантика commit/effects/errors сохраняется.
- API callbacks возвращают объект, который можно непосредственно передать в dispatch.
- Работать в текущей ветке PR #45, с префиксом `[gost-kit-44]`.

## Review focus

- Корреляция пути и payload сохраняется в обеих формах, включая union объектов.
- Отсутствующий payload и явный undefined различаются.
- Вывод типов callback и раздельная проверка success/error actions сохраняются.
- Genuine dispatch распознаётся ESLint в обеих формах.
- Публичные артефакты не содержат forwardAction и используют актуальные объявления.

### Task 1: Типы, исполнение и callbacks

**Files:** `packages/common/src/fc/types/{dispatch,dispatch-action,dispatch-object,scoped-actions,trigger}.ts`, `lib/{dispatch,create-api-effect,create-api-effector}.ts`, соседние тесты и публичный index.

**Interfaces:** `Dispatch<TAction>` принимает union коррелированных аргументов; `DispatchAction<TAction>` выводит `{ action, payload }` из `ActionInput<TAction>`; factory выводит фактические результаты callbacks; `ApiEffect` проверяет их по декларациям действий.

- [ ] Добавить и увидеть RED compile/runtime проверок объектных вызовов: значения, отсутствие данных, optional payload, undefined, неправильные namespace/payload.
- [ ] Добавить объектную форму без второй реализации dispatch; сохранить внутренний формат reducer. Сохранить вывод типов callbacks, перевести их результаты на новый объект; удалить forwardAction и мигрировать его проверки на прямой dispatch.
- [ ] Проверить реальные короткие имена `users/setPage` и `users/load`; не переименовывать существующие действия примера.
- [ ] Выполнить common typecheck и полный common suite; зафиксировать изменения.

### Task 2: Потребители и документация

**Files:** callbacks/effects/tests в `examples/functional-core`, `packages/common/README.md`, правило и фикстуры single-intent-dispatch, текущие design/changeset.

**Interfaces:** Результат callback имеет тип `DispatchAction<RootAction>` и передаётся как `dispatch(effect.action)`; обычные UI-вызовы остаются строковыми.

- [ ] Мигрировать callbacks и описания DispatchActionEffect; сохранить точные проверки returned effects.
- [ ] Добавить ESLint fixtures обеих форм; сохранить проверки выбора action и нескольких dispatch.
- [ ] Описать обе формы, предпочитая строковую; убрать forwardAction из документации и changeset.
- [ ] Запустить примерные type/unit checks и полный проектный check.

### Task 3: Проверка и ревью

- [ ] Собрать пример и прогнать два браузерных сценария на свободном порту без переиспользования сервера.
- [ ] Установить реальные tarballs в отдельный consumer, проверить обе формы, API callbacks и их вывод типов; повторить compile-пробу на 2000 действиях.
- [ ] Выполнить одно независимое ревью изменений относительно e26fc1e; исправить подтверждённые дефекты через RED→GREEN и повторить затронутые проверки.
- [ ] Закоммитить и запушить изменения в существующий PR #45; обновить его описание.
