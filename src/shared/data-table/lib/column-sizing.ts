import type { ColumnDef, ColumnSizingState, Table } from '@tanstack/react-table';
import type { CSSProperties } from 'react';

import type { DataTableFilterVariant } from '../types/data-table.types';

const DEFAULT_HEADER_MIN_SIZE = 120;
const HEADER_CHAR_WIDTH = 8;
// Baseline header chrome reserve covers padding, the reorder handle, and the
// resize edge affordance. Feature-specific controls add extra reserve on top.
const HEADER_CHROME_WIDTH = 56;
const DEFAULT_HEADER_MAX_SIZE = 260;
const SORT_CONTROL_EXTRA_WIDTH = 16;
const GROUP_CONTROL_EXTRA_WIDTH = 16;
const NUMBER_FILTER_EXTRA_WIDTH = 8;
const DATE_FILTER_EXTRA_WIDTH = 8;
const DATE_RANGE_FILTER_EXTRA_WIDTH = 24;

interface ColumnLabelSource {
  id: string;
  columnDef: {
    header?: unknown;
    meta?: {
      label?: string;
    };
    minSize?: number;
    maxSize?: number;
  };
}

interface ColumnSizingConstraint {
  minSize?: number;
  maxSize?: number;
}

interface ColumnSizingLeafSource {
  id: string;
  columnDef: {
    minSize?: number;
    maxSize?: number;
    meta?: {
      label?: string;
      filterVariant?: DataTableFilterVariant;
    };
  };
  getCanSort(): boolean;
  getCanGroup(): boolean;
  getCanFilter(): boolean;
}

export interface DefaultColumnMinSizeOptions {
  label: string;
  explicitMinSize?: number;
  canSort?: boolean;
  canGroup?: boolean;
  canFilter?: boolean;
  filterVariant?: DataTableFilterVariant;
}

export interface ApplyDataTableSizingDefaultsOptions {
  enableColumnFilters?: boolean;
  enableGrouping?: boolean;
  enableColumnOrdering?: boolean;
  includeHeaderControlReserve?: boolean;
}

export interface ColumnSizingClampOptions {
  enableColumnFilters?: boolean;
  enableGrouping?: boolean;
}

function normalizeBound(value: number | undefined): number | undefined {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    return undefined;
  }

  return value;
}

type ColumnDefWithChildren<TData extends object> = ColumnDef<TData, unknown> & {
  columns: ColumnDef<TData, unknown>[];
};

function hasNestedColumns<TData extends object>(
  column: ColumnDef<TData, unknown>,
): column is ColumnDefWithChildren<TData> {
  return 'columns' in column && Array.isArray(column.columns);
}

function getColumnDefId<TData extends object>(column: ColumnDef<TData, unknown>): string | null {
  if (typeof column.id === 'string' && column.id.length > 0) {
    return column.id;
  }

  if ('accessorKey' in column && typeof column.accessorKey === 'string' && column.accessorKey.length > 0) {
    return column.accessorKey.replace(/\./g, '_');
  }

  if (typeof column.header === 'string' && column.header.length > 0) {
    return column.header;
  }

  return null;
}

function getColumnDefLabel<TData extends object>(column: ColumnDef<TData, unknown>): string {
  return (
    column.meta?.label ??
    (typeof column.header === 'string' ? column.header : column.id ?? '')
  );
}

export function getColumnDisplayLabel(column: ColumnLabelSource): string {
  return (
    column.columnDef.meta?.label ??
    (typeof column.columnDef.header === 'string' ? column.columnDef.header : column.id)
  );
}

export function estimateColumnMinSize(label: string): number {
  const normalizedLabel = label.trim();
  const estimatedWidth = normalizedLabel.length * HEADER_CHAR_WIDTH + HEADER_CHROME_WIDTH;
  return Math.max(DEFAULT_HEADER_MIN_SIZE, Math.ceil(estimatedWidth));
}

function clampDefaultColumnMinSize(size: number): number {
  return Math.max(
    DEFAULT_HEADER_MIN_SIZE,
    Math.min(Math.ceil(size), DEFAULT_HEADER_MAX_SIZE),
  );
}

function getEffectiveDefaultColumnMinSize({
  label,
  explicitMinSize,
  canSort = false,
  canGroup = false,
  canFilter = false,
  filterVariant,
}: DefaultColumnMinSizeOptions): number {
  const baselineSize = estimateColumnMinSize(label);
  const extraWidth =
    (canSort ? SORT_CONTROL_EXTRA_WIDTH : 0) +
    (canGroup ? GROUP_CONTROL_EXTRA_WIDTH : 0) +
    (canFilter ? getFilterVariantExtraWidth(filterVariant) : 0);

  const automaticMinSize = clampDefaultColumnMinSize(baselineSize + extraWidth);
  const manualMinSize = normalizeBound(explicitMinSize);

  return Math.max(automaticMinSize, manualMinSize ?? 0);
}

function getFilterVariantExtraWidth(
  filterVariant?: DataTableFilterVariant,
): number {
  if (filterVariant === 'number') {
    return NUMBER_FILTER_EXTRA_WIDTH;
  }

  if (filterVariant === 'date') {
    return DATE_FILTER_EXTRA_WIDTH;
  }

  if (filterVariant === 'date-range') {
    return DATE_RANGE_FILTER_EXTRA_WIDTH;
  }

  return 0;
}

function createColumnSizingConstraint({
  label,
  explicitMinSize,
  maxSize,
  canSort,
  canGroup,
  canFilter,
  filterVariant,
}: {
  label: string;
  explicitMinSize?: number;
  maxSize?: number;
  canSort?: boolean;
  canGroup?: boolean;
  canFilter?: boolean;
  filterVariant?: DataTableFilterVariant;
}): ColumnSizingConstraint {
  const minSize = getDefaultColumnMinSize({
    label,
    explicitMinSize,
    canSort,
    canGroup,
    canFilter,
    filterVariant,
  });
  const normalizedMaxSize = normalizeBound(maxSize);

  // maxSize is a hard ceiling: cap the auto-derived minSize at normalizedMaxSize
  // rather than bumping normalizedMaxSize to fit the auto minimum.
  const effectiveMinSize =
    normalizedMaxSize !== undefined ? Math.min(minSize, normalizedMaxSize) : minSize;

  return {
    minSize: effectiveMinSize,
    maxSize: normalizedMaxSize,
  };
}

export function getDefaultColumnMinSize({
  label,
  explicitMinSize,
  canSort = false,
  canGroup = false,
  canFilter = false,
  filterVariant,
}: DefaultColumnMinSizeOptions): number {
  return getEffectiveDefaultColumnMinSize({
    label,
    explicitMinSize,
    canSort,
    canGroup,
    canFilter,
    filterVariant,
  });
}

export function getEffectiveColumnSize(
  size: number,
  minSize?: number,
  maxSize?: number,
  label?: string,
): number {
  const safeSize = Number.isFinite(size) && size > 0 ? size : 0;
  const safeMinSize = normalizeBound(minSize) ?? (label ? estimateColumnMinSize(label) : undefined);
  const safeMaxSize = normalizeBound(maxSize);
  // maxSize is a hard ceiling: if the auto-estimated min exceeds the explicit max,
  // cap normalizedMin at safeMaxSize rather than letting it exceed the ceiling.
  const normalizedMin = Math.min(safeMinSize ?? 0, safeMaxSize ?? Infinity);
  const normalizedMax = safeMaxSize ?? Number.POSITIVE_INFINITY;
  const clampedSize = Math.max(normalizedMin, Math.min(safeSize, normalizedMax));

  return Number.isFinite(clampedSize) ? clampedSize : safeSize;
}

export function getColumnSizeStyle(
  size: number,
  minSize?: number,
  maxSize?: number,
  label?: string,
): CSSProperties {
  const safeMinSize = normalizeBound(minSize) ?? (label ? estimateColumnMinSize(label) : undefined);
  const safeMaxSize = normalizeBound(maxSize);
  // maxSize is a hard ceiling: cap normalizedMin at safeMaxSize so that
  // minWidth never exceeds the explicit maxWidth in the rendered CSS.
  const normalizedMin = Math.min(safeMinSize ?? 0, safeMaxSize ?? Infinity);
  const normalizedMax = safeMaxSize;

  // Fill column (no explicit maxSize): omit the explicit width so that
  // table-layout:fixed distributes leftover container space to these columns.
  // Only minWidth is set to prevent the column collapsing below its minimum.
  if (normalizedMax === undefined) {
    return {
      minWidth: normalizedMin > 0 ? normalizedMin : undefined,
    };
  }

  const width = getEffectiveColumnSize(size, normalizedMin, normalizedMax, label);
  return {
    width,
    minWidth: normalizedMin || width,
    maxWidth: normalizedMax,
  };
}

export function normalizeColumnSizingState(
  value: unknown,
  knownColumnIds?: readonly string[],
): ColumnSizingState {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return {};
  }

  const known = knownColumnIds ? new Set(knownColumnIds) : undefined;

  return Object.entries(value).reduce<ColumnSizingState>((accumulator, [key, entry]) => {
    if (known && !known.has(key)) {
      return accumulator;
    }

    if (typeof entry === 'number' && Number.isFinite(entry) && entry >= 0) {
      accumulator[key] = entry;
    }

    return accumulator;
  }, {});
}

export function getVisibleLeafColumnsTotalSize<TData extends object>(
  table: Table<TData>,
): number {
  return table.getVisibleLeafColumns().reduce((total, column) => {
    const effectiveSize = getEffectiveColumnSize(
      column.getSize(),
      column.columnDef.minSize,
      column.columnDef.maxSize,
      getColumnDisplayLabel(column),
    );

    return total + effectiveSize;
  }, 0);
}

function collectColumnSizingConstraints<TData extends object>(
  columns: ColumnDef<TData, unknown>[],
  options?: ColumnSizingClampOptions,
  constraints: Map<string, ColumnSizingConstraint> = new Map(),
): Map<string, ColumnSizingConstraint> {
  for (const column of columns) {
    if (hasNestedColumns(column)) {
      collectColumnSizingConstraints(column.columns, options, constraints);
      continue;
    }

    const columnId = getColumnDefId(column);
    if (!columnId) {
      continue;
    }

    constraints.set(
      columnId,
      createColumnSizingConstraint({
        label: getColumnDefLabel(column),
        explicitMinSize: normalizeBound(column.minSize),
        maxSize: column.maxSize,
        canSort: column.enableSorting !== false,
        canGroup: options?.enableGrouping === true && column.meta?.enableGrouping !== false,
        canFilter:
          options?.enableColumnFilters === true &&
          column.meta?.filterVariant !== undefined,
        filterVariant: column.meta?.filterVariant,
      }),
    );
  }

  return constraints;
}

function clampColumnSizingStateToConstraints(
  value: ColumnSizingState,
  constraints: ReadonlyMap<string, ColumnSizingConstraint>,
): ColumnSizingState {
  return Object.entries(value).reduce<ColumnSizingState>((accumulator, [key, entry]) => {
    const constraint = constraints.get(key);
    if (!constraint) {
      return accumulator;
    }

    let nextSize = entry;

    if (constraint.minSize !== undefined) {
      nextSize = Math.max(nextSize, constraint.minSize);
    }

    if (constraint.maxSize !== undefined) {
      nextSize = Math.min(nextSize, constraint.maxSize);
    }

    if (typeof nextSize === 'number' && Number.isFinite(nextSize) && nextSize >= 0) {
      accumulator[key] = nextSize;
    }

    return accumulator;
  }, {});
}

export function clampColumnSizingStateToColumns<TData extends object>(
  value: ColumnSizingState,
  columns: ColumnDef<TData, unknown>[],
  options?: ColumnSizingClampOptions,
): ColumnSizingState {
  return clampColumnSizingStateToConstraints(
    value,
    collectColumnSizingConstraints(columns, options),
  );
}

export function clampColumnSizingStateToLeafColumns(
  value: ColumnSizingState,
  columns: readonly ColumnSizingLeafSource[],
): ColumnSizingState {
  const constraints = new Map<string, ColumnSizingConstraint>();

  for (const column of columns) {
    constraints.set(
      column.id,
      createColumnSizingConstraint({
        label: getColumnDisplayLabel(column),
        explicitMinSize: normalizeBound(column.columnDef.minSize),
        maxSize: column.columnDef.maxSize,
        canSort: column.getCanSort(),
        canGroup: column.getCanGroup(),
        canFilter: column.getCanFilter(),
        filterVariant: column.columnDef.meta?.filterVariant,
      }),
    );
  }

  return clampColumnSizingStateToConstraints(value, constraints);
}

export function applyDataTableSizingDefaultsToColumns<TData extends object>(
  columns: ColumnDef<TData, unknown>[],
  options?: ApplyDataTableSizingDefaultsOptions,
): ColumnDef<TData, unknown>[] {
  function applyColumns(
    currentColumns: ColumnDef<TData, unknown>[],
  ): ColumnDef<TData, unknown>[] {
    return currentColumns.map((column) => {
      if (hasNestedColumns(column)) {
        return {
          ...column,
          columns: applyColumns(column.columns),
        };
      }

      const explicitMin = normalizeBound(column.minSize);
      const explicitMax = normalizeBound(column.maxSize);
      const isFixedWidth =
        explicitMin !== undefined &&
        explicitMax !== undefined &&
        explicitMin === explicitMax;

      if (isFixedWidth) {
        return { ...column, size: explicitMin, minSize: explicitMin, maxSize: explicitMax };
      }

      const intrinsicMinSize = options?.includeHeaderControlReserve === true
        ? getDefaultColumnMinSize({
            label: getColumnDefLabel(column),
            explicitMinSize: explicitMin,
            canSort: column.enableSorting !== false,
            canGroup:
              options?.enableGrouping === true &&
              column.meta?.enableGrouping !== false,
            canFilter:
              options?.enableColumnFilters === true &&
              column.meta?.filterVariant !== undefined,
            filterVariant: column.meta?.filterVariant,
          })
        : Math.max(
            estimateColumnMinSize(getColumnDefLabel(column)),
            explicitMin ?? 0,
          );

      const currentSize =
        typeof column.size === 'number' && Number.isFinite(column.size)
          ? column.size
          : 0;
      // maxSize is a hard ceiling: cap the auto-derived intrinsicMinSize at
      // explicitMax rather than bumping explicitMax to accommodate it.
      const effectiveMaxSize = explicitMax !== undefined ? explicitMax : undefined;
      const cappedMinSize =
        effectiveMaxSize !== undefined
          ? Math.min(intrinsicMinSize, effectiveMaxSize)
          : intrinsicMinSize;
      const rawSize = Math.max(currentSize, cappedMinSize);
      const effectiveSize =
        effectiveMaxSize !== undefined ? Math.min(rawSize, effectiveMaxSize) : rawSize;

      // Always set maxSize explicitly so consumers can reliably detect fill
      // columns via `col.columnDef.maxSize === undefined`.
      return {
        ...column,
        size: effectiveSize,
        minSize: cappedMinSize,
        maxSize: effectiveMaxSize,
      };
    });
  }

  return applyColumns(columns);
}
