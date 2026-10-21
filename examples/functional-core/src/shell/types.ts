export type Trigger = { type: `${string}${'Action' | 'Effect'}` };
export type Dispatch<A extends Trigger> = (action: A) => Promise<void>;
export type Commit<S, E extends Trigger> = { state: S; effects: E[] };
export type Reducer<S, A extends Trigger, E extends Trigger> = (state: S, action: A) => Commit<S, E>;
export type Effector<A extends Trigger, E extends Trigger> = (effect: E, dispatch: Dispatch<A>) => Promise<void>;
