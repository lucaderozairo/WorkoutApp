/**
 * A reducer is a pure function: (state, event) => state.
 * - No I/O, no clock, no random
 * - No mutation; return new state
 * - Total: must handle every event type
 * - Unknown event versions return state unchanged
 */
export type Reducer<S, E> = (state: S, event: E) => S;

export function reduce<S, E>(reducers: Record<string, Reducer<S, E>>, state: S, event: E): S {
  const type = (event as any).type;
  const reducer = reducers[type];
  if (!reducer) {
    console.warn(`No reducer for event type: ${type}`);
    return state;
  }
  return reducer(state, event);
}
