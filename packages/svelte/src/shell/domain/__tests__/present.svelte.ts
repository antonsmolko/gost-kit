/** Test-only model of selecting a feature before deriving its presentation. */
export const present = <TState, TView>(read: () => TState, presenter: (state: TState) => TView) => {
  const state = $derived(read());
  const value = $derived(presenter(state));
  return { get value() { return value; } };
};

/** Control case: the presenter reads its input directly in the same derived. */
export const presentDirect = <TState, TView>(read: () => TState, presenter: (state: TState) => TView) => {
  const value = $derived(presenter(read()));
  return { get value() { return value; } };
};
