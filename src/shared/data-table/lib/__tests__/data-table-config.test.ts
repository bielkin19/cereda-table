import { describe, expect, it } from 'vitest';

import {
  booleanColumn,
  createDataTableColumns,
  createDataTableConfig,
  dataColumn,
  dateColumn,
  dateRangeColumn,
  multiSelectColumn,
  numberColumn,
  selectColumn,
  textColumn,
} from '../data-table-config';

interface TestUser {
  active: boolean;
  age: number;
  createdAt: string;
  department: string;
  id: string;
  name: string;
  region: string;
  startDate: string;
}

describe('data table config helpers', () => {
  it('creates typed accessor columns with data-table metadata', () => {
    const columns = [
      textColumn<TestUser>('name', { header: 'Name', label: 'Full Name' }),
      dataColumn<TestUser>('id', { header: 'ID' }),
      numberColumn<TestUser>('age', { header: 'Age' }),
      booleanColumn<TestUser>('active', { header: 'Active' }),
      selectColumn<TestUser>('department', {
        enableGrouping: true,
        header: 'Department',
      }),
      multiSelectColumn<TestUser>('region', { header: 'Region' }),
      dateColumn<TestUser>('startDate', { header: 'Start Date' }),
      dateRangeColumn<TestUser>('createdAt', { header: 'Created' }),
    ];

    expect(columns.map((column) => column.meta?.filterVariant)).toEqual([
      'text',
      undefined,
      'number',
      'boolean',
      'select',
      'multi-select',
      'date',
      'date-range',
    ]);
    expect(columns[0]?.meta?.label).toBe('Full Name');
    expect(columns[2]?.meta?.align).toBe('end');
    expect(columns[3]?.meta?.align).toBe('center');
    expect(columns[4]?.meta?.enableGrouping).toBe(true);
  });

  it('applies presets while allowing explicit options to override defaults', () => {
    const config = createDataTableConfig<TestUser>({
      columns: [textColumn<TestUser>('name')],
      enablePagination: false,
      preset: 'enterprise',
      storageKey: 'users-table',
    });

    expect(config.columns).toHaveLength(1);
    expect(config.enableColumnFilters).toBe(true);
    expect(config.enableColumnOrdering).toBe(true);
    expect(config.enableColumnVisibility).toBe(true);
    expect(config.enableGlobalFilter).toBe(true);
    expect(config.enableGrouping).toBe(true);
    expect(config.enableSavedViews).toBe(true);
    expect(config.enablePagination).toBe(false);
    expect(config.storageKey).toBe('users-table');
  });

  it('creates columns from a typed schema object', () => {
    const columns = createDataTableColumns<TestUser>({
      active: { header: 'Active', type: 'boolean' },
      age: { header: 'Age', type: 'number' },
      department: {
        enableGrouping: true,
        header: 'Department',
        type: 'select',
      },
      id: { header: 'ID' },
      name: { header: 'Name', label: 'Full Name', type: 'text' },
      region: { header: 'Region', type: 'multi-select' },
      startDate: { header: 'Start Date', type: 'date' },
    });

    expect(columns.map((column) => column.header)).toEqual([
      'Active',
      'Age',
      'Department',
      'ID',
      'Name',
      'Region',
      'Start Date',
    ]);
    expect(columns.map((column) => column.meta?.filterVariant)).toEqual([
      'boolean',
      'number',
      'select',
      undefined,
      'text',
      'multi-select',
      'date',
    ]);
    expect(columns[2]?.meta?.enableGrouping).toBe(true);
    expect(columns[4]?.meta?.label).toBe('Full Name');
  });

  it('accepts schema columns directly in createDataTableConfig', () => {
    const config = createDataTableConfig<TestUser>({
      columns: {
        active: { header: 'Active', type: 'boolean' },
        name: { header: 'Name', type: 'text' },
      },
      preset: 'interactive',
    });

    expect(config.columns).toHaveLength(2);
    expect(config.columns[0]?.meta?.filterVariant).toBe('boolean');
    expect(config.columns[1]?.meta?.filterVariant).toBe('text');
    expect(config.enableColumnFilters).toBe(true);
  });

  it('keeps minimal/basic presets intentionally quiet', () => {
    const config = createDataTableConfig<TestUser>({
      columns: [textColumn<TestUser>('name')],
      preset: 'minimal',
    });

    expect(config.enableColumnFilters).toBe(false);
    expect(config.enableColumnOrdering).toBe(false);
    expect(config.enableGlobalFilter).toBe(false);
    expect(config.enableGrouping).toBe(false);
    expect(config.enablePagination).toBe(false);
  });
});
