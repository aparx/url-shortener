export function memoize<T>(factory: () => T): () => T {
  let element: T | undefined;
  let memoized = false;
  return function _memoizedFn(): T {
    if (memoized) return element as T;
    element = factory();
    memoized = true;
    return element;
  };
}
