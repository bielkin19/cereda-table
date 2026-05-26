import type {
  ColumnDef,
  ColumnFiltersState,
  ColumnOrderState,
  ColumnResizeMode,
  ColumnSizingState,
  ExpandedState,
  GroupingState,
  OnChangeFn,
  PaginationState,
  RowSelectionState,
  SortingState,
  VisibilityState,
} from '@tanstack/react-table';
import type { ReactNode } from 'react';

import type { DataTableLocale } from '../lib/data-table-locale';

/**
 * Selects whether the table runs client-side row modeling or defers sorting,
 * filtering, grouping, and pagination semantics to the caller/server.
 */
export type DataTableMode = 'client' | 'server';

/**
 * Declares which filter control should be rendered for a column.
 *
 * The table engine uses these variants to attach safe built-in filter
 * functions and to drive the demo / toolbar filter UI.
 */
export type DataTableFilterVariant =
  | 'text'
  | 'number'
  | 'select'
  | 'multi-select'
  | 'date'
  | 'date-range'
  | 'boolean';

export type DataTableFilterOperator =
  | 'contains'
  | 'equals'
  | 'in'
  | 'between'
  | 'isEmpty'
  | 'isNotEmpty'
  | 'greaterThan'
  | 'greaterThanOrEqual'
  | 'lessThan'
  | 'lessThanOrEqual';

export type DataTableFilterValue =
  | string
  | number
  | boolean
  | Array<string | number | boolean>
  | {
      from?: string | number;
      to?: string | number;
    }
  | null;

export interface DataTableFilterRule {
  id: string;
  columnId: string;
  operator: DataTableFilterOperator;
  value: DataTableFilterValue;
}

export interface DataTableInitialState {
  columnFilters?: ColumnFiltersState;
  filterRules?: DataTableFilterRule[];
}

/** Horizontal alignment for a column's header and cells. */
export type DataTableAlign = 'start' | 'center' | 'end';

/**
 * Public DataTable configuration.
 *
 * Every state slice follows the same model:
 * - omit both the value and the handler for fully uncontrolled usage
 * - pass the handler only for listener-only observation
 * - pass both value and handler for fully controlled usage
 */
export interface UseDataTableOptions<TData extends object> {
  /** Table rows to render. */
  data: TData[];
  /** Column definitions rendered by the table. */
  columns: ColumnDef<TData, unknown>[];
  /** Client-side or server-side row-model mode. */
  mode?: DataTableMode;
  enableColumnFilters?: boolean;
  enableColumnOrdering?: boolean;
  enableColumnVisibility?: boolean;
  enableGlobalFilter?: boolean;
  enableGrouping?: boolean;
  enablePagination?: boolean;
  enableColumnResizing?: boolean;
  enableSavedViews?: boolean;
  enableRowNumbers?: boolean;

  /**
   * Each slice supports:
   * - fully uncontrolled: omit both the value and the change handler
   * - uncontrolled with observer: provide `onChange` only
   * - fully controlled: provide both `value` and `onChange`
   */
  sorting?: SortingState;
  onSortingChange?: OnChangeFn<SortingState>;

  columnFilters?: ColumnFiltersState;
  onColumnFiltersChange?: OnChangeFn<ColumnFiltersState>;

  /**
   * Canonical column filter model. Prefer this API for server queries,
   * saved views, URL sync, and any UI that edits filters outside headers.
   */
  filterRules?: DataTableFilterRule[];
  onFilterRulesChange?: OnChangeFn<DataTableFilterRule[]>;

  initialState?: DataTableInitialState;

  columnVisibility?: VisibilityState;
  onColumnVisibilityChange?: OnChangeFn<VisibilityState>;

  globalFilter?: string;
  onGlobalFilterChange?: (value: string) => void;

  columnOrder?: ColumnOrderState;
  onColumnOrderChange?: OnChangeFn<ColumnOrderState>;

  columnSizing?: ColumnSizingState;
  onColumnSizingChange?: OnChangeFn<ColumnSizingState>;

  grouping?: GroupingState;
  onGroupingChange?: (value: GroupingState) => void;

  expanded?: ExpandedState;
  onExpandedChange?: (value: ExpandedState) => void;

  pagination?: PaginationState;
  onPaginationChange?: (value: PaginationState) => void;

  /** Row selection uses the same three-mode state model as the other slices. */
  rowSelection?: RowSelectionState;
  onRowSelectionChange?: OnChangeFn<RowSelectionState>;

  /**
   * Total number of pages available on the server.
   * Required when `mode` is `'server'`; ignored in `'client'` mode.
   */
  pageCount?: number;

  /**
   * Total number of rows available on the server.
   * When provided with server-side pagination, TanStack can derive pageCount.
   */
  rowCount?: number;

  /**
   * Page-size choices shown by the pagination UI.
   * Defaults to `[10, 20, 50, 100]` when pagination is enabled.
   */
  pageSizeOptions?: number[];

  /**
   * Resize mode used by TanStack Table when column resizing is enabled.
   * Defaults to `'onChange'`.
   */
  columnResizeMode?: ColumnResizeMode;

  /**
   * Storage key used to persist saved views in localStorage or a custom
   * storage adapter.
   */
  storageKey?: string;

  /**
   * Initial label used in the saved-views input and fallback save name.
   */
  defaultViewName?: string;

  /**
   * Optional storage adapter for saved views.
   * Defaults to `localStorage` when available and safely no-ops otherwise.
   */
  savedViewsStorage?: DataTableSavedViewsStorage;

  getRowId?: (row: TData, index: number) => string;
}

/**
 * Storage adapter used by the saved-views feature.
 *
 * Defaults to `localStorage` when available, but callers can provide an
 * alternate adapter for testing or custom persistence.
 */
export interface DataTableSavedViewsStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/**
 * Full DataTable props, including loading and custom body slots.
 */
export interface DataTableProps<TData extends object>
  extends UseDataTableOptions<TData> {
  /** Localization strings. Merges on top of the parent locale context when provided. */
  locale?: DataTableLocale;
  bodyHeight?: number | string;
  isLoading?: boolean;
  /**
   * Whether to render the Filters toolbar button.
   * Defaults to `true` when `enableColumnFilters` is set.
   * Set to `false` to enable filtering via column headers only.
   */
  showFiltersButton?: boolean;
  /**
   * Whether to render the Columns toolbar button (visibility / ordering / grouping).
   * Defaults to `true` when any columns-related feature is enabled.
   */
  showColumnsButton?: boolean;
  /**
   * Replaces the default empty-state row. Must render valid `<tbody>` content
   * (i.e. one or more `<tr>` elements).
   */
  renderEmpty?: ReactNode;
  /**
   * Replaces the default skeleton loader rows. Must render valid `<tbody>`
   * content (i.e. one or more `<tr>` elements).
   */
  renderLoading?: ReactNode;
}
