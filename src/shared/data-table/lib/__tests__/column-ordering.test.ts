import { describe, expect, it } from 'vitest';

import {
  getPreviewColumnOrderFromVisibleColumns,
  getVisibleColumnOrder,
  mergeVisibleColumnOrderIntoFullOrder,
  moveColumnId,
  reorderColumnIds,
  reorderColumnIdsByTargetIndex,
  reorderVisibleColumnIds,
} from '../column-ordering';

describe('column-ordering helpers', () => {
  it('reorders column ids by moving the active id before the over id', () => {
    expect(
      reorderColumnIds(['id', 'name', 'department', 'status'], 'department', 'name'),
    ).toEqual(['id', 'department', 'name', 'status']);
  });

  it('reorders visible column ids by the over index deterministically', () => {
    expect(
      reorderVisibleColumnIds(['id', 'name', 'department', 'status'], 'department', 'name'),
    ).toEqual(['id', 'department', 'name', 'status']);
    expect(
      reorderVisibleColumnIds(
        ['id', 'name', 'department', 'status'],
        'department',
        'name',
      ),
    ).toEqual(['id', 'department', 'name', 'status']);
    expect(
      reorderVisibleColumnIds(
        ['id', 'name', 'department', 'status'],
        'name',
        'department',
      ),
    ).toEqual(['id', 'department', 'name', 'status']);
  });

  it('can reorder column ids by the over index', () => {
    expect(
      reorderColumnIdsByTargetIndex(['id', 'name', 'department', 'status'], 'department', 'name'),
    ).toEqual(['id', 'department', 'name', 'status']);
    expect(
      reorderColumnIds(
        ['id', 'name', 'department', 'status'],
        'department',
        'name',
        'after',
      ),
    ).toEqual(['id', 'name', 'department', 'status']);
  });

  it('preserves hidden columns while reordering visible ids', () => {
    expect(
      reorderColumnIds(
        ['id', 'hidden', 'name', 'department', 'status'],
        'name',
        'department',
        'after',
      ),
    ).toEqual(['id', 'hidden', 'department', 'name', 'status']);
  });

  it('preserves hidden columns when moving visible ids by target index', () => {
    expect(
      mergeVisibleColumnOrderIntoFullOrder(
        ['id', 'hidden', 'name', 'department', 'status'],
        reorderVisibleColumnIds(['id', 'name', 'department', 'status'], 'name', 'department'),
      ),
    ).toEqual(['id', 'hidden', 'department', 'name', 'status']);
  });

  it('extracts visible column order from the full column order', () => {
    expect(
      getVisibleColumnOrder(['id', 'hidden', 'name', 'department', 'status'], [
        'id',
        'name',
        'department',
        'status',
      ]),
    ).toEqual(['id', 'name', 'department', 'status']);
  });

  it('merges visible column order back into the full column order without losing hidden ids', () => {
    expect(
      mergeVisibleColumnOrderIntoFullOrder(
        ['id', 'hidden', 'name', 'department', 'status'],
        ['id', 'department', 'name', 'status'],
      ),
    ).toEqual(['id', 'hidden', 'department', 'name', 'status']);
  });

  it('builds a preview column order from the visible reorder contract', () => {
    expect(
      getPreviewColumnOrderFromVisibleColumns(
        ['id', 'hidden', 'name', 'department', 'status'],
        ['id', 'name', 'department', 'status'],
        'department',
        'name',
      ),
    ).toEqual(['id', 'hidden', 'department', 'name', 'status']);
    expect(
      getPreviewColumnOrderFromVisibleColumns(
        ['id', 'hidden', 'name', 'department', 'status'],
        ['id', 'name', 'department', 'status'],
        'department',
        'name',
        'after',
      ),
    ).toEqual(['id', 'hidden', 'name', 'department', 'status']);
  });

  it('returns the original order when the active or over id is missing', () => {
    const order = ['id', 'name', 'department'];

    expect(reorderColumnIds(order, 'missing', 'name')).toBe(order);
    expect(reorderColumnIds(order, 'name', 'missing')).toBe(order);
    expect(moveColumnId(order, 'missing', 'left')).toBe(order);
    expect(moveColumnId(order, 'missing', 'right')).toBe(order);
  });

  it('moves ids left and right without dropping columns', () => {
    const order = ['id', 'name', 'department', 'status'];

    expect(moveColumnId(order, 'department', 'left')).toEqual([
      'id',
      'department',
      'name',
      'status',
    ]);
    expect(moveColumnId(order, 'department', 'right')).toEqual([
      'id',
      'name',
      'status',
      'department',
    ]);
  });

  it('does not introduce duplicate ids when reordering duplicate input', () => {
    expect(
      reorderColumnIds(['id', 'name', 'name', 'department'], 'department', 'name'),
    ).toEqual(['id', 'department', 'name']);
  });
});
