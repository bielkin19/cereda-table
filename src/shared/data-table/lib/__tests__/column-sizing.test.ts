import { describe, expect, it } from 'vitest';

import {
  applyDataTableSizingDefaultsToColumns,
  clampColumnSizingStateToColumns,
  clampColumnSizingStateToLeafColumns,
  estimateColumnMinSize,
  getColumnSizeStyle,
  getDefaultColumnMinSize,
  normalizeColumnSizingState,
} from '../column-sizing';

describe('column sizing helpers', () => {
  it('sanitizes invalid or unknown column sizes', () => {
    expect(
      normalizeColumnSizingState(
        {
          id: 96,
          name: Number.NaN,
          department: Number.POSITIVE_INFINITY,
          status: -1,
          unknown: 200,
        },
        ['id', 'name', 'department', 'status'],
      ),
    ).toEqual({ id: 96 });
  });

  it('treats negative sizes as zero in inline styles', () => {
    expect(getColumnSizeStyle(-20)).toEqual({
      width: 0,
      minWidth: 0,
      maxWidth: undefined,
    });
  });

  it('respects individual minimum and maximum sizes in inline styles', () => {
    expect(getColumnSizeStyle(40, 120, 260)).toEqual({
      width: 120,
      minWidth: 120,
      maxWidth: 260,
    });
  });

  it('uses an intrinsic minimum width when no explicit minSize is set', () => {
    const expected = estimateColumnMinSize('Very Long Header Name');

    expect(getColumnSizeStyle(40, undefined, 260, 'Very Long Header Name')).toEqual({
      width: expected,
      minWidth: expected,
      maxWidth: 260,
    });
  });

  it('does not let a smaller maxSize crush the effective minimum width', () => {
    expect(getColumnSizeStyle(40, 136, 120, 'Status')).toEqual({
      width: 136,
      minWidth: 136,
      maxWidth: 136,
    });
  });

  it('adds extra default width for sortable and groupable headers', () => {
    const plain = getDefaultColumnMinSize({
      label: 'ID',
      canSort: false,
      canGroup: false,
    });
    const sortable = getDefaultColumnMinSize({
      label: 'ID',
      canSort: true,
      canGroup: false,
    });
    const groupable = getDefaultColumnMinSize({
      label: 'ID',
      canSort: true,
      canGroup: true,
    });

    expect(sortable).toBeGreaterThan(plain);
    expect(groupable).toBeGreaterThan(sortable);
  });

  it('prefers the automatic minimum size over a smaller explicit minSize', () => {
    expect(
      getDefaultColumnMinSize({
        label: 'Status',
        explicitMinSize: 100,
        canSort: true,
        canGroup: true,
      }),
    ).toBeGreaterThan(100);
  });

  it('keeps a larger explicit minSize when it exceeds the automatic minimum', () => {
    expect(
      getDefaultColumnMinSize({
        label: 'Status',
        explicitMinSize: 180,
        canSort: true,
        canGroup: true,
      }),
    ).toBe(180);
  });

  it('clamps default minimum widths to a sensible upper bound', () => {
    const minSize = getDefaultColumnMinSize({
      label: 'A very very very very very very long header label that should not explode',
      canSort: true,
      canGroup: true,
      canFilter: true,
      filterVariant: 'date-range',
    });

    expect(minSize).toBeLessThanOrEqual(260);
    expect(minSize).toBeGreaterThanOrEqual(120);
  });

  it('reserves a little extra width for range-style filters', () => {
    const multiSelect = getDefaultColumnMinSize({
      label: 'Created At',
      canFilter: true,
      filterVariant: 'multi-select',
    });
    const dateRange = getDefaultColumnMinSize({
      label: 'Created At',
      canFilter: true,
      filterVariant: 'date-range',
    });

    expect(dateRange).toBeGreaterThan(multiSelect);
  });

  it('applies intrinsic minimum sizes to leaf column definitions', () => {
    const columns = applyDataTableSizingDefaultsToColumns([
      {
        accessorKey: 'name',
        header: 'Very Long Header Name',
      },
      {
        accessorKey: 'title',
        header: 'Title',
        minSize: 140,
      },
    ]);

    expect(columns[0]?.minSize).toBe(estimateColumnMinSize('Very Long Header Name'));
    expect(columns[1]?.minSize).toBe(140);
  });

  it('applies larger default minimum sizes to sortable and groupable leaf columns', () => {
    const columns = applyDataTableSizingDefaultsToColumns(
      [
        {
          accessorKey: 'id',
          header: 'ID',
        },
        {
          accessorKey: 'department',
          header: 'Department',
          meta: {
            enableGrouping: true,
          },
        },
      ],
      {
        includeHeaderControlReserve: true,
        enableGrouping: true,
      },
    );

    expect(columns[0]?.minSize).toBe(
      getDefaultColumnMinSize({
        label: 'ID',
        canSort: true,
        canGroup: true,
      }),
    );
    expect(columns[1]?.minSize).toBeGreaterThan(columns[0]?.minSize ?? 0);
  });

  it('clamps a leaf column with a smaller explicit minSize up to the automatic minimum', () => {
    const columns = applyDataTableSizingDefaultsToColumns(
      [
        {
          accessorKey: 'status',
          header: 'Status',
          size: 40,
          minSize: 100,
          maxSize: 160,
          meta: {
            enableGrouping: true,
            filterVariant: 'boolean',
          },
        },
      ],
      {
        includeHeaderControlReserve: true,
        enableGrouping: true,
        enableColumnFilters: true,
      },
    );

    expect(columns[0]?.minSize).toBeGreaterThan(100);
    expect(columns[0]?.size).toBe(columns[0]?.minSize);
  });

  it('raises maxSize to the effective minimum when maxSize is smaller', () => {
    const columns = applyDataTableSizingDefaultsToColumns(
      [
        {
          accessorKey: 'status',
          header: 'Status',
          size: 40,
          maxSize: 120,
          meta: {
            enableGrouping: true,
            filterVariant: 'boolean',
          },
        },
      ],
      {
        includeHeaderControlReserve: true,
        enableGrouping: true,
        enableColumnFilters: true,
      },
    );

    expect(columns[0]?.minSize).toBeGreaterThan(120);
    expect(columns[0]?.maxSize).toBe(columns[0]?.minSize);
    expect(columns[0]?.size).toBe(columns[0]?.minSize);
  });

  it('clamps a column sizing state to the current column minimum sizes', () => {
    const columns = [
      {
        accessorKey: 'status',
        header: 'Status',
        size: 80,
        minSize: 100,
        maxSize: 160,
      },
      {
        accessorKey: 'name',
        header: 'Name',
        size: 200,
        minSize: 140,
        maxSize: 280,
      },
    ] satisfies Parameters<typeof clampColumnSizingStateToColumns>[1];

    expect(
      clampColumnSizingStateToColumns(
        {
          status: 40,
          name: 400,
          unknown: 999,
        },
        columns,
      ),
    ).toEqual({
      status: 136,
      name: 280,
    });
  });

  it('clamps a leaf column sizing state to the current column minimum sizes', () => {
    expect(
      clampColumnSizingStateToLeafColumns(
        {
          status: 40,
          name: 400,
          unknown: 999,
        },
        [
          {
            id: 'status',
            getCanSort: () => true,
            getCanGroup: () => true,
            getCanFilter: () => true,
            columnDef: {
              minSize: 100,
              maxSize: 160,
              meta: { label: 'Status', filterVariant: 'boolean' },
            },
          },
          {
            id: 'name',
            getCanSort: () => true,
            getCanGroup: () => false,
            getCanFilter: () => false,
            columnDef: {
              minSize: 140,
              maxSize: 280,
              meta: { label: 'Name', filterVariant: 'text' },
            },
          },
        ],
      ),
    ).toEqual({
      status: 152,
      name: 280,
    });
  });
});
