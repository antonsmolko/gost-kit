/** Test-only model of selecting a feature before deriving its presentation. */
export const present = <TState, TView>(read: () => TState, presenter: (state: TState) => TView) => {
  const state = $derived(read());
  const value = $derived(presenter(state));
  return { get value() { return value; } };
};
