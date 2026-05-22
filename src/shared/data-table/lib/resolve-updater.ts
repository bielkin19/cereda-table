import type { Updater } from '@tanstack/react-table';

/**
 * Type guard that narrows an `Updater<T>` to its functional form.
 *
 * NOTE: this cannot be 100% sound when `T` is itself a function type, because
 * both shapes would satisfy `typeof === 'function'`. In practice TanStack state
 * values (SortingState, ColumnFiltersState, …) are never function types, so
 * the guard is safe for all intended uses.
 */
function isUpdaterFn<T>(updater: Updater<T>): updater is (prev: T) => T {
  return typeof updater === 'function';
}

/**
 * Resolves a TanStack functional-or-value updater against the current value.
 *
 * TanStack state setters accept either a direct next value or a `(prev) => next`
 * callback. This helper normalises both shapes so callers don't need to branch.
 */
export function resolveUpdater<T>(updater: Updater<T>, current: T): T {
  return isUpdaterFn(updater) ? updater(current) : updater;
}
