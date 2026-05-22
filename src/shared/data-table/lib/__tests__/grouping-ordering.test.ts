import { describe, expect, it } from 'vitest';

import {
  addGroupingId,
  moveGroupingIdToEnd,
  normalizeGroupingIds,
  removeGroupingId,
  reorderGroupingIds,
} from '../grouping-ordering';

describe('grouping-ordering', () => {
  it('normalizes duplicate ids without changing order', () => {
    expect(normalizeGroupingIds(['department', 'status', 'department'])).toEqual([
      'department',
      'status',
    ]);
  });

  it('reorders grouped ids without introducing duplicates', () => {
    expect(
      reorderGroupingIds(['department', 'status', 'department'], 'status', 'department'),
    ).toEqual(['status', 'department']);
  });

  it('reorders grouped ids by target index in a stable way', () => {
    expect(reorderGroupingIds(['department', 'status', 'team'], 'department', 'status')).toEqual([
      'status',
      'department',
      'team',
    ]);
    expect(reorderGroupingIds(['department', 'status', 'team'], 'status', 'department')).toEqual([
      'status',
      'department',
      'team',
    ]);
    expect(reorderGroupingIds(['department', 'status', 'team'], 'team', 'department')).toEqual([
      'team',
      'department',
      'status',
    ]);
  });

  it('moves first, middle, and last grouped ids predictably', () => {
    expect(reorderGroupingIds(['department', 'status', 'team'], 'department', 'team')).toEqual([
      'status',
      'team',
      'department',
    ]);
    expect(reorderGroupingIds(['department', 'status', 'team'], 'status', 'department')).toEqual([
      'status',
      'department',
      'team',
    ]);
    expect(reorderGroupingIds(['department', 'status', 'team'], 'team', 'department')).toEqual([
      'team',
      'department',
      'status',
    ]);
  });

  it('moving unknown ids is a no-op', () => {
    const order = ['department', 'status'];
    expect(reorderGroupingIds(order, 'unknown', 'status')).toBe(order);
    expect(reorderGroupingIds(order, 'status', 'unknown')).toBe(order);
    expect(moveGroupingIdToEnd(order, 'unknown')).toBe(order);
  });

  it('removing unknown ids is a no-op', () => {
    const order = ['department', 'status'];
    expect(removeGroupingId(order, 'unknown')).toBe(order);
  });

  it('removes one grouping id while preserving the others', () => {
    expect(removeGroupingId(['department', 'status'], 'department')).toEqual(['status']);
  });

  it('appends new grouping ids without duplicates', () => {
    expect(addGroupingId(['department', 'status'], 'team')).toEqual([
      'department',
      'status',
      'team',
    ]);
    expect(addGroupingId(['department', 'status', 'department'], 'status')).toEqual([
      'department',
      'status',
    ]);
  });

  it('moves a grouped id to the end deterministically', () => {
    expect(moveGroupingIdToEnd(['department', 'status', 'team'], 'department')).toEqual([
      'status',
      'team',
      'department',
    ]);
    expect(moveGroupingIdToEnd(['department', 'status', 'team'], 'team')).toEqual([
      'department',
      'status',
      'team',
    ]);
  });
});
