import type {
  ColumnFiltersState,
  ColumnOrderState,
  ColumnSizingState,
  GroupingState,
  PaginationState,
  SortingState,
  Table,
  VisibilityState,
} from '@tanstack/react-table';
import { flushSync } from 'react-dom';

import type { DataTableSavedViewsStorage } from '../types/data-table.types';
import type { DataTableFilterRule } from '../types/data-table.types';
import { isDataTableAutoGroupColumnId } from './auto-group-column';
import { normalizeColumnFiltersStateForTable } from './column-filters';
import {
  clampColumnSizingStateToLeafColumns,
  normalizeColumnSizingState,
} from './column-sizing';
import {
  dataTableFilterRulesToLegacyColumnFilters,
} from './filters/data-table-filter-adapter';
import {
  columnFiltersToDataTableFilterRules,
  normalizeDataTableFilterRules,
} from './filters/data-table-filter-normalization';
import { normalizeGroupingIds } from './grouping-ordering';
import { isDataTableRowNumberColumnId } from './row-number-column';

export interface DataTableSavedViewState {
  sorting: SortingState;
  globalFilter: string;
  columnFilters: ColumnFiltersState;
  filterRules?: DataTableFilterRule[];
  columnVisibility: VisibilityState;
  columnOrder: ColumnOrderState;
  columnSizing: ColumnSizingState;
  grouping: GroupingState;
  pagination: PaginationState;
}

export interface DataTableSavedView {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  state: DataTableSavedViewState;
}

export interface DataTableSavedViewsDocument {
  version: 1;
  views: DataTableSavedView[];
}

const DEFAULT_SAVED_VIEWS_DOCUMENT: DataTableSavedViewsDocument = {
  version: 1,
  views: [],
};

const DEFAULT_PAGINATION: PaginationState = {
  pageIndex: 0,
  pageSize: 10,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

function createSavedViewId() {
  return globalThis.crypto?.randomUUID?.() ?? `saved-view-${Date.now()}-${Math.random()}`;
}

function normalizeViewName(value: string) {
  return value.trim().replace(/\s+/g, ' ');
}

function getViewNameKey(value: string) {
  return normalizeViewName(value).toLocaleLowerCase();
}

function resolveSavedViewName(value: unknown): string {
  if (!isString(value)) {
    return 'Saved view';
  }

  const normalized = normalizeViewName(value);
  return normalized.length > 0 ? normalized : 'Saved view';
}

function normalizeSortingState(value: unknown): SortingState {
  if (!isArrayLike(value)) {
    return [];
  }

  return value.reduce<SortingState>((accumulator, entry) => {
    if (!isRecord(entry) || !isString(entry.id) || !isBoolean(entry.desc)) {
      return accumulator;
    }

    accumulator.push({ id: entry.id, desc: entry.desc });
    return accumulator;
  }, []);
}

function isArrayLike(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

function normalizeColumnFiltersState(value: unknown): ColumnFiltersState {
  if (!isArrayLike(value)) {
    return [];
  }

  return value.reduce<ColumnFiltersState>((accumulator, entry) => {
    if (!isRecord(entry) || !isString(entry.id) || !('value' in entry)) {
      return accumulator;
    }

    accumulator.push({ id: entry.id, value: entry.value });
    return accumulator;
  }, []);
}

function normalizeVisibilityState(value: unknown): VisibilityState {
  if (!isRecord(value)) {
    return {};
  }

  return Object.entries(value).reduce<VisibilityState>((accumulator, [key, entry]) => {
    if (isBoolean(entry)) {
      accumulator[key] = entry;
    }
    return accumulator;
  }, {});
}

function normalizeStringArray(value: unknown): string[] {
  if (!isArrayLike(value)) {
    return [];
  }

  const normalized: string[] = [];
  const seen = new Set<string>();

  for (const entry of value) {
    if (!isString(entry)) {
      continue;
    }

    const key = entry.trim();
    if (key.length === 0 || seen.has(key)) {
      continue;
    }

    seen.add(key);
    normalized.push(key);
  }

  return normalized;
}

function normalizePaginationState(value: unknown): PaginationState {
  if (!isRecord(value)) {
    return DEFAULT_PAGINATION;
  }

  const pageIndex = isNumber(value.pageIndex) && value.pageIndex >= 0
    ? Math.floor(value.pageIndex)
    : DEFAULT_PAGINATION.pageIndex;
  const pageSize = isNumber(value.pageSize) && value.pageSize > 0
    ? Math.floor(value.pageSize)
    : DEFAULT_PAGINATION.pageSize;

  return {
    pageIndex,
    pageSize,
  };
}

function getKnownLeafColumnIds<TData extends object>(table: Table<TData>): string[] {
  return table
    .getAllLeafColumns()
    .map((column) => column.id)
    .filter((columnId) => !isDataTableAutoGroupColumnId(columnId) && !isDataTableRowNumberColumnId(columnId));
}

function getUserColumnVisibilityState<TData extends object>(
  table: Table<TData>,
): VisibilityState {
  return table.options.meta?.getUserColumnVisibilityState?.() ?? table.getState().columnVisibility;
}

function normalizeColumnOrder(
  value: unknown,
  knownColumnIds: readonly string[],
): ColumnOrderState {
  const normalized = normalizeStringArray(value);
  const known = new Set(knownColumnIds);

  return normalized.filter((columnId) => known.has(columnId));
}

function normalizeGroupingState(
  value: unknown,
  knownGroupableColumnIds: readonly string[],
): GroupingState {
  const normalized = normalizeGroupingIds(normalizeStringArray(value));
  const known = new Set(knownGroupableColumnIds);

  return normalized.filter((columnId) => known.has(columnId));
}

function normalizeSortingStateForTable<TData extends object>(
  value: unknown,
  table: Table<TData>,
): SortingState {
  const known = new Set(getKnownLeafColumnIds(table));
  const normalized = normalizeSortingState(value);

  return normalized.filter((entry) => known.has(entry.id));
}

function normalizeVisibilityStateForTable<TData extends object>(
  value: unknown,
  table: Table<TData>,
): VisibilityState {
  const known = new Set(getKnownLeafColumnIds(table));
  const normalized = normalizeVisibilityState(value);

  return Object.entries(normalized).reduce<VisibilityState>((accumulator, [key, entry]) => {
    if (known.has(key)) {
      accumulator[key] = entry;
    }
    return accumulator;
  }, {});
}

function getKnownGroupableColumnIds<TData extends object>(table: Table<TData>): string[] {
  return table
    .getAllLeafColumns()
    .filter((column) => column.getCanGroup())
    .map((column) => column.id);
}

function normalizeSavedViewState(value: unknown): DataTableSavedViewState {
  if (!isRecord(value)) {
    return {
      sorting: [],
      globalFilter: '',
      columnFilters: [],
      filterRules: [],
      columnVisibility: {},
      columnOrder: [],
      columnSizing: {},
      grouping: [],
      pagination: DEFAULT_PAGINATION,
    };
  }

  const sorting = normalizeSortingState(value.sorting);
  const columnFilters = normalizeColumnFiltersState(value.columnFilters);
  const filterRules = normalizeDataTableFilterRules(undefined, value.filterRules);
  const columnVisibility = normalizeVisibilityState(value.columnVisibility);
  const columnOrder = normalizeStringArray(value.columnOrder);
  const columnSizing = normalizeColumnSizingState(value.columnSizing);
  const grouping = normalizeGroupingIds(normalizeStringArray(value.grouping));
  const globalFilter = isString(value.globalFilter) ? value.globalFilter : '';
  const pagination = normalizePaginationState(value.pagination);

  return {
    sorting,
    globalFilter,
    columnFilters,
    ...(filterRules.length > 0 ? { filterRules } : {}),
    columnVisibility,
    columnOrder,
    columnSizing,
    grouping,
    pagination,
  };
}

function normalizeSavedView(value: unknown): DataTableSavedView | null {
  if (!isRecord(value)) {
    return null;
  }

  const state = normalizeSavedViewState(value.state);

  const name = resolveSavedViewName(value.name);
  const createdAt = isString(value.createdAt) ? value.createdAt : new Date().toISOString();
  const updatedAt = isString(value.updatedAt) ? value.updatedAt : createdAt;

  return {
    id: isString(value.id) && value.id.trim().length > 0 ? value.id : createSavedViewId(),
    name,
    createdAt,
    updatedAt,
    state,
  };
}

function dedupeSavedViewsByName(views: DataTableSavedView[]): DataTableSavedView[] {
  const normalized: DataTableSavedView[] = [];
  const seen = new Set<string>();

  for (let index = views.length - 1; index >= 0; index -= 1) {
    const view = views[index];
    const nameKey = getViewNameKey(view.name);

    if (seen.has(nameKey)) {
      continue;
    }

    seen.add(nameKey);
    normalized.push(view);
  }

  return normalized.reverse();
}

export function getDefaultSavedViewsDocument(): DataTableSavedViewsDocument {
  return {
    version: DEFAULT_SAVED_VIEWS_DOCUMENT.version,
    views: [],
  };
}

export function normalizeSavedViewsDocument(value: unknown): DataTableSavedViewsDocument {
  if (!isRecord(value) || value.version !== 1 || !isArrayLike(value.views)) {
    return getDefaultSavedViewsDocument();
  }

  const views = value.views
    .map(normalizeSavedView)
    .filter((view): view is DataTableSavedView => view !== null);

  return {
    version: 1,
    views: dedupeSavedViewsByName(views),
  };
}

export function resolveSavedViewsStorage(
  savedViewsStorage: DataTableSavedViewsStorage | undefined,
): DataTableSavedViewsStorage {
  if (savedViewsStorage) {
    return savedViewsStorage;
  }

  return DEFAULT_SAVED_VIEWS_STORAGE;
}

export const DEFAULT_SAVED_VIEWS_STORAGE: DataTableSavedViewsStorage = {
  getItem(key) {
    try {
      return globalThis.localStorage?.getItem(key) ?? null;
    } catch {
      return null;
    }
  },
  setItem(key, value) {
    try {
      globalThis.localStorage?.setItem(key, value);
    } catch {
      // Fail safely when localStorage is unavailable.
    }
  },
  removeItem(key) {
    try {
      globalThis.localStorage?.removeItem(key);
    } catch {
      // Fail safely when localStorage is unavailable.
    }
  },
};

export function loadSavedViewsDocument(
  storage: DataTableSavedViewsStorage,
  storageKey: string | undefined,
): DataTableSavedViewsDocument {
  if (!storageKey?.trim()) {
    return getDefaultSavedViewsDocument();
  }

  try {
    const raw = storage.getItem(storageKey);
    if (!raw) {
      return getDefaultSavedViewsDocument();
    }

    return normalizeSavedViewsDocument(JSON.parse(raw));
  } catch {
    return getDefaultSavedViewsDocument();
  }
}

export function persistSavedViewsDocument(
  storage: DataTableSavedViewsStorage,
  storageKey: string | undefined,
  document: DataTableSavedViewsDocument,
) {
  if (!storageKey?.trim()) {
    return;
  }

  try {
    if (document.views.length === 0) {
      storage.removeItem(storageKey);
      return;
    }

    storage.setItem(storageKey, JSON.stringify(document));
  } catch {
    // Fail safely when storage is unavailable or write-protected.
  }
}

export function snapshotSavedViewState<TData extends object>(
  table: Table<TData>,
): DataTableSavedViewState {
  const state = table.getState();
  const knownLeafColumns = getKnownLeafColumnIds(table);
  const knownGroupableColumns = getKnownGroupableColumnIds(table);
  const userColumnVisibilityState = getUserColumnVisibilityState(table);

  return {
    sorting: normalizeSortingStateForTable(state.sorting, table),
    globalFilter: isString(state.globalFilter) ? state.globalFilter : '',
    filterRules: normalizeDataTableFilterRules(
      table,
      table.options.meta?.getFilterRules?.() ??
        columnFiltersToDataTableFilterRules(table, state.columnFilters),
    ),
    columnFilters: dataTableFilterRulesToLegacyColumnFilters(
      normalizeDataTableFilterRules(
        table,
        table.options.meta?.getFilterRules?.() ??
          columnFiltersToDataTableFilterRules(table, state.columnFilters),
      ),
    ),
    columnVisibility: normalizeVisibilityStateForTable(userColumnVisibilityState, table),
    columnOrder: normalizeColumnOrder(state.columnOrder, knownLeafColumns),
    columnSizing: normalizeColumnSizingState(state.columnSizing, knownLeafColumns),
    grouping: normalizeGroupingState(state.grouping, knownGroupableColumns),
    pagination: normalizePaginationState(state.pagination),
  };
}

export function applySavedViewState<TData extends object>(
  table: Table<TData>,
  state: DataTableSavedViewState,
) {
  const knownLeafColumns = getKnownLeafColumnIds(table);
  const knownGroupableColumns = getKnownGroupableColumnIds(table);
  const nextSorting = normalizeSortingStateForTable(state.sorting, table);
  const nextColumnFilters = normalizeColumnFiltersStateForTable(table, state.columnFilters);
  const nextFilterRules = normalizeDataTableFilterRules(
    table,
    state.filterRules && state.filterRules.length > 0
      ? state.filterRules
      : columnFiltersToDataTableFilterRules(table, state.columnFilters),
  );
  const nextColumnVisibility = normalizeVisibilityStateForTable(state.columnVisibility, table);
  const nextColumnOrder = normalizeColumnOrder(state.columnOrder, knownLeafColumns);
  const nextColumnSizing = clampColumnSizingStateToLeafColumns(
    normalizeColumnSizingState(state.columnSizing, knownLeafColumns),
    table.getAllLeafColumns(),
  );
  const nextGrouping = normalizeGroupingState(state.grouping, knownGroupableColumns);
  const nextGlobalFilter = isString(state.globalFilter) ? state.globalFilter : '';
  const nextPagination = normalizePaginationState(state.pagination);

  flushSync(() => {
    table.setSorting(nextSorting);
    table.setGlobalFilter(nextGlobalFilter);
    if (table.options.meta?.setFilterRules) {
      table.options.meta.setFilterRules(nextFilterRules);
    } else {
      table.setColumnFilters(nextColumnFilters);
    }
    table.resetExpanded(true);
    table.setPagination(nextPagination);
    table.setColumnVisibility(nextColumnVisibility);
    table.setColumnOrder(nextColumnOrder);
    table.setColumnSizing(nextColumnSizing);
    table.setGrouping(nextGrouping);
  });
}

export function resetSavedViewState<TData extends object>(table: Table<TData>) {
  table.options.meta?.resetToInitialState?.();
  if (table.options.meta?.resetToInitialState) {
    return;
  }

  table.resetColumnSizing(true);
  table.resetHeaderSizeInfo(true);
  table.resetSorting(true);
  table.resetGlobalFilter(true);
  table.resetColumnFilters(true);
  table.resetColumnVisibility(true);
  table.resetColumnOrder(true);
  table.resetGrouping(true);
  table.resetExpanded(true);
  table.resetPagination(true);
}

export function upsertSavedView(
  document: DataTableSavedViewsDocument,
  name: string,
  state: DataTableSavedViewState,
): DataTableSavedViewsDocument {
  const normalizedName = resolveSavedViewName(name);
  const nameKey = getViewNameKey(normalizedName);
  const now = new Date().toISOString();
  const existingIndex = document.views.findIndex(
    (view) => getViewNameKey(view.name) === nameKey,
  );
  const existingView = existingIndex >= 0 ? document.views[existingIndex] : undefined;
  const nextView: DataTableSavedView = {
    id: existingView?.id ?? createSavedViewId(),
    name: normalizedName,
    createdAt: existingView?.createdAt ?? now,
    updatedAt: now,
    state,
  };

  const nextViews = [
    nextView,
    ...document.views.filter((view) => getViewNameKey(view.name) !== nameKey),
  ];

  return {
    version: 1,
    views: dedupeSavedViewsByName(nextViews),
  };
}

export function deleteSavedView(
  document: DataTableSavedViewsDocument,
  viewId: string,
): DataTableSavedViewsDocument {
  return {
    version: 1,
    views: document.views.filter((view) => view.id !== viewId),
  };
}
