# Local UI Component State Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans inline. Steps use checkbox syntax for tracking.

**Goal:** Build the approved controlled/uncontrolled Disclosure example using existing FC/Svelte APIs.
**Architecture:** Pure widget reducer emits OpenChangeEffect; uncontrolled model uses createStore, controlled model reads external props through createDispatch. UI receives ready presenter data.
**Tech Stack:** Node 26, TS5.9.3, Svelte5.57.2, Vitest5, Playwright1.64.1.
**Spec:** [Approved design](../specs/2026-11-10-ui-component-state-design.md).

## Global Constraints

- All widget code in examples/functional-core/src/ui-kit/disclosure; no package exports/runtime changes or changeset.
- Public common/svelte imports; one public type per file; inline type imports; no source extensions/index.
- Both ownership modes, one instance per component; callbacks read through getter; no optimistic copy.
- Reset is SetOpenAction(initialOpen), returning Promise; it does not call Store.reset.
- Constructor/getter misuse throws; dispatch/reset misuse reports once as readState and resolves.
- Uncontrolled guard only checks current open remains undefined; defaultOpen captured/validated once.
- Semantic callback effect carries boolean, common handles callback failures; no new lifecycle resources.
- UI-Kit-only override disables four business policies; typed selector and ordinary checks stay enabled.
- Native button + ready aria/hidden fields, stable instance id, always-mounted children.
- Existing API demo remains functional; work in issue branch with [gost-kit-27] commits; draft PR, no merge.

## Review Focus

- Rapid transitions preserve each effect payload; async callback completion does not rewrite state.
- Changing callbacks takes effect without recreating models or capturing stale props.
- Invalid runtime ownership has different getter/dispatch error channels with one report.
- Controlled repeated requests read current owner value, reset requests initial baseline, external updates never notify.
- Browser assertions mount actual instances, preserve child DOM state and prove unmount/reset isolation.

### Task 1: Pure disclosure core and presenter

**Files:** create src/ui-kit/disclosure/domain/fc/{state,action,effect,reducer}.ts and colocated state/reducer tests;
create ui/disclosure.presenter.ts, types/disclosure-view.ts and colocated presenter test.
(All source paths relative to examples/functional-core.)

**Interfaces:** DisclosureState={readonly open:boolean}; disclosureState(options?) factory.
DisclosureAction=ToggleAction|SetOpenAction(open:boolean).
DisclosureEffect=OpenChangeEffect(open:boolean).
disclosureReducer: Reducer<DisclosureState,DisclosureAction,DisclosureEffect>.
disclosurePresenter({state}): DisclosureView {isOpen:boolean,isHidden:boolean}.

- [ ] Write failing pure tests: toggle false/true; SetOpen changes/no-op identity;
  exact effects; frozen inputs; independent states; presenter full results/input preservation.
  Run npm --prefix examples/functional-core test -- disclosure. Expected RED missing modules.
- [ ] Implement using define.state/reducer + reducing and pure presenter.
- [ ] Run example tests and TypeScript/style checks on touched files. Expected GREEN.
- [ ] Commit [gost-kit-27] Add pure disclosure transitions and view data.

### Task 2: Instance model and ownership contract

**Files:** create model/create-disclosure-model.ts and colocated test; types/{open-change-handler,disclosure-options,disclosure-model}.ts;
any focused private model helper files only if needed for clarity.

**Interfaces:** OpenChangeHandler=AnyFn<[open:boolean],void|Promise<void>>.
DisclosureOptions union: controlled open:boolean/onOpenChange required/defaultOpen?:never;
uncontrolled open?:undefined/defaultOpen?:boolean/onOpenChange optional.
createDisclosureModel(readOptions: AnyFn<[],DisclosureOptions>): DisclosureModel.
DisclosureModel readonly state, Dispatch<DisclosureAction>, reset():Promise<void>.

- [ ] Write RED tests for defaults/instance independence, immediate commits,
  ordered rapid true/false notifications, reset-only-own-instance, ignored new defaultOpen,
  callback replacement, absent callback, callback throw/rejection, pending callback Promise.
- [ ] Add controlled acceptance/ignore/delay/external updates, repeat true/true proposals,
  reset baseline/no-op and no local optimistic state assertions.
- [ ] Add runtime-invalid JS probes: setup conflicts/missing callback/default types;
  controlled→uncontrolled and reverse; direct getter throws; dispatch/reset resolve
  and console reporter receives one readState/TypeError/action without state/effect/callback.
  Add compile-time probes for invalid unions.
- [ ] Run model tests before implementation. Expected RED missing model.
- [ ] Implement shared define.effector/effecting callback effect; construction modes;
  uncontrolled thin guard wrapper reports before store.dispatch; controlled validator inside readState.
  Keep no-op writeState; model reset delegates SetOpenAction(initialOpen).
- [ ] Run all example tests/type/style. Expected GREEN.
- [ ] Commit [gost-kit-27] Bind local and controlled disclosure state.

### Task 3: Component, application integration and browser proof

**Files:** create ui/Disclosure.svelte, types/disclosure-props.ts, index.ts;
src/DisclosureExamples.svelte; update App.svelte, root types/action/state/reducer and tests;
example eslint.config.ts; colocated browser-only __tests__ fixture/harness and e2e/disclosure.spec.ts;
example README; design/plan completion notes.

**Interfaces:** DisclosureProps=DisclosureOptions & {label:string;children?:Snippet}.
Component reset export delegates model.reset. $props.id panel identity.
RootState.detailsOpen=false; root SetDetailsOpenAction(open:boolean).
Example UI-Kit override off for no-component-state/single-intent-dispatch/
ready-boolean-condition/require-presenter, only src/ui-kit/**/*.svelte.

- [ ] Add RED root reducer test: action updates detailsOpen only, preserving user/alert refs.
  Add config assertion for UI-Kit off vs business on with unchanged selector/general checks.
- [ ] Write browser regressions with real Svelte mount/unmount fixtures: two local instances,
  reset via actual exported component handle, remount isolation, child input state retained,
  unique controls/id and Enter/Space, controlled rejected/accepted/external updates,
  callback replacement. Existing fixture infrastructure; no new dependencies.
- [ ] Observe RED against missing component/behavior. Implement component and late override;
  integrate root flag and single-dispatch named callback demo. Use public Svelte mount/unmount
  in test-only source fixtures; no production debug globals.
- [ ] Document both modes and typed bind:this/reset after mount, fixed ownership,
  error reporting and no cancellation/dispose. Explain no public package additions.
- [ ] Run example tests, Svelte/type checks, build and all Playwright tests. Expected GREEN.
  Run Svelte autofixer for new components/rune fixtures; resolve justified issues.
- [ ] Run full npm run check. Expected existing 823 tests plus new meaningful cases pass.
- [ ] Commit [gost-kit-27] Demonstrate isolated UI component state.
- [ ] One fresh whole-branch review; important fixes RED→GREEN and full suite.
  Prepare draft PR with validation, no merge/publish.
