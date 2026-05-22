import type { Table } from '@tanstack/react-table';
import { describe, expect, it } from 'vitest';

import {
  normalizeColumnFiltersStateForTable,
  normalizeColumnFilterValueForVariant,
  normalizeDateKey,
  normalizeNumberFilterValue,
  normalizePrimitiveArray,
  parseSerializedFilterValue,
} from '../column-filters';

function createMockTable() {
  const table = {
    getAllLeafColumns: () => [
      {
        id: 'age',
        columnDef: { meta: { filterVariant: 'number' } },
      },
      {
        id: 'birthDate',
        columnDef: { meta: { filterVariant: 'date' } },
      },
      {
        id: 'createdAt',
        columnDef: { meta: { filterVariant: 'date-range' } },
      },
      {
        id: 'region',
        columnDef: { meta: { filterVariant: 'multi-select' } },
      },
    ],
  } as unknown as Table<{ id: string }>;

  return table;
}

describe('column filter helpers', () => {
  it('normalizes advanced filter values by variant', () => {
    expect(
      normalizeColumnFilterValueForVariant('number', { min: '40', max: '30' }),
    ).toEqual({ min: 30, max: 40 });
    expect(
      normalizeNumberFilterValue({ min: '-1.5', max: '2.75' }),
    ).toEqual({ min: -1.5, max: 2.75 });
    expect(
      normalizeColumnFilterValueForVariant('date', '2024-03-10'),
    ).toBe('2024-03-10');
    expect(normalizeDateKey(new Date(2024, 2, 10, 12, 30))).toBe('2024-03-10');
    expect(normalizeDateKey('2024-03-10T12:30:00')).toBe('2024-03-10');
    expect(normalizeDateKey('2024-02-30')).toBeUndefined();
    expect(normalizeDateKey('2024-02-30T12:30:00')).toBeUndefined();
    expect(
      normalizeColumnFilterValueForVariant('date-range', {
        from: '2024-04-08',
        to: '2024-02-20',
      }),
    ).toEqual({
      from: '2024-02-20',
      to: '2024-04-08',
    });
    expect(
      normalizeColumnFilterValueForVariant('date-range', [
        '2024-04-08',
        '2024-02-20',
      ]),
    ).toEqual({
      from: '2024-02-20',
      to: '2024-04-08',
    });
    expect(
      normalizeColumnFilterValueForVariant('multi-select', [
        'South',
        'South',
        false,
        1,
      ]),
    ).toEqual(['South', false, 1]);
    expect(normalizeColumnFilterValueForVariant('multi-select', true)).toEqual([true]);
    expect(normalizePrimitiveArray(true)).toEqual([true]);
    expect(normalizePrimitiveArray('South')).toEqual(['South']);
    expect(parseSerializedFilterValue('boolean:maybe')).toBeUndefined();
  });

  it('normalizes column filter state against known columns', () => {
    const table = createMockTable();

    expect(
      normalizeColumnFiltersStateForTable(table, [
        { id: 'unknown', value: 'x' },
        { id: 'age', value: { min: '10', max: '5' } },
        { id: 'birthDate', value: '1988-11-03' },
        { id: 'createdAt', value: { from: '2024-04-08', to: '2024-02-20' } },
        { id: 'region', value: ['South', 'South', false] },
      ]),
    ).toEqual([
      { id: 'age', value: { min: 5, max: 10 } },
      { id: 'birthDate', value: '1988-11-03' },
      { id: 'createdAt', value: { from: '2024-02-20', to: '2024-04-08' } },
      { id: 'region', value: ['South', false] },
    ]);
  });
});
