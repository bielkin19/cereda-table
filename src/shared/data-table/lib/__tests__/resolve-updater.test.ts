import type { SortingState } from '@tanstack/react-table';
import { describe, expect, it } from 'vitest';

import { resolveUpdater } from '../resolve-updater';

describe('resolveUpdater', () => {
  it('returns a direct value unchanged', () => {
    const next: SortingState = [{ id: 'name', desc: false }];
    const result = resolveUpdater(next, []);
    expect(result).toBe(next);
  });

  it('applies a functional updater to the current value', () => {
    const current: SortingState = [{ id: 'name', desc: false }];
    const result = resolveUpdater(
      (prev) => [...prev, { id: 'age', desc: true }],
      current,
    );
    expect(result).toEqual([
      { id: 'name', desc: false },
      { id: 'age', desc: true },
    ]);
  });

  it('passes the current value as the argument to the updater function', () => {
    const current: SortingState = [{ id: 'a', desc: false }];
    let received: SortingState | undefined;

    resolveUpdater((prev) => {
      received = prev;
      return prev;
    }, current);

    expect(received).toBe(current);
  });

  it('functional updater that clears state returns empty array', () => {
    const current: SortingState = [{ id: 'name', desc: false }];
    const result = resolveUpdater(() => [], current);
    expect(result).toEqual([]);
  });

  it('works for non-array state types', () => {
    type Visibility = Record<string, boolean>;
    const current: Visibility = { id: true, name: false };
    const result = resolveUpdater<Visibility>(
      (prev) => ({ ...prev, name: true }),
      current,
    );
    expect(result).toEqual({ id: true, name: true });
  });

  it('direct value update ignores the current value', () => {
    const current: SortingState = [{ id: 'old', desc: false }];
    const next: SortingState = [{ id: 'new', desc: true }];
    expect(resolveUpdater(next, current)).toBe(next);
    expect(resolveUpdater(next, current)).not.toBe(current);
  });
});
