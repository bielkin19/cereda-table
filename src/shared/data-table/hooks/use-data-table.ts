import type {
  ColumnFiltersState,
  ColumnSizingInfoState,
  ColumnSizingState,
  ExpandedState,
  GroupingState,
  PaginationState,
  RowSelectionState,
  SortingState,
  TableState,
  VisibilityState,
} from '@tanstack/react-table';
import {
  getCoreRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
  getGroupedRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import { flushSync } from 'react-dom';

import {
  createDataTableAutoGroupColumn,
  isDataTableAutoGroupColumnId,
} from '../lib/auto-group-column';
import { applyDataTableFilterFnsToColumns } from '../lib/column-filters';
import { getDefaultColumnOrderFromColumns } from '../lib/column-ordering';
import {
  applyDataTableSizingDefaultsToColumns,
  clampColumnSizingStateToColumns,
  normalizeColumnSizingState,
} from '../lib/column-sizing';
import {
  dataTableFilterRulesToColumnFilters,
  dataTableFilterRulesToLegacyColumnFilters,
} from '../lib/filters/data-table-filter-adapter';
import {
  columnFiltersToDataTableFilterRules,
  getDataTableFilterRuleValue,
  normalizeDataTableFilterRules,
  upsertDataTableFilterRule,
} from '../lib/filters/data-table-filter-normalization';
import { resolveUpdater } from '../lib/resolve-updater';
import {
  createDataTableRowNumberColumn,
  isDataTableRowNumberColumnId,
} from '../lib/row-number-column';
import type {
  DataTableFilterRule,
  UseDataTableOptions,
} from '../types/data-table.types';
import { useControllableState } from './use-controllable-state';

const DEFAULT_SORTING: SortingState = [];
const DEFAULT_COLUMN_FILTERS: ColumnFiltersState = [];
const DEFAULT_FILTER_RULES: DataTableFilterRule[] = [];
const DEFAULT_COLUMN_VISIBILITY: VisibilityState = {};
const DEFAULT_GLOBAL_FILTER = '';
const DEFAULT_GROUPING: GroupingState = [];
const DEFAULT_EXPANDED: ExpandedState = {};
const DEFAULT_PAGINATION: PaginationState = {
  pageIndex: 0,
  pageSize: 10,
};
const DEFAULT_COLUMN_SIZING: ColumnSizingState = {};
const DEFAULT_COLUMN_SIZING_INFO: ColumnSizingInfoState = {
  columnSizingStart: [],
  deltaOffset: null,
  deltaPercentage: null,
  isResizingColumn: false,
  startOffset: null,
  startSize: null,
};
const DEFAULT_ROW_SELECTION: RowSelectionState = {};

export function useDataTable<TData extends object>({
  data,
  columns,
  mode = 'client',
  enableColumnFilters,
  enableGrouping,
  enableColumnOrdering: _enableColumnOrdering,
  enableColumnResizing,
  enableGlobalFilter,
  enablePagination,
  enableRowNumbers,
  columnResizeMode = 'onChange',
  sorting,
  onSortingChange,
  columnFilters,
  onColumnFiltersChange,
  filterRules,
  onFilterRulesChange,
  initialState,
  columnVisibility,
  onColumnVisibilityChange,
  globalFilter,
  onGlobalFilterChange,
  columnOrder,
  onColumnOrderChange,
  columnSizing,
  onColumnSizingChange,
  grouping,
  onGroupingChange,
  expanded,
  onExpandedChange,
  pagination,
  onPaginationChange,
  rowSelection,
  onRowSelectionChange,
  pageCount,
  rowCount,
  getRowId,
}: UseDataTableOptions<TData>) {
  const isServer = mode === 'server';
  const shouldPaginate = enablePagination === true;
  const tableColumns = useMemo(
    () =>
      applyDataTableSizingDefaultsToColumns(
        applyDataTableFilterFnsToColumns(columns),
        {
          enableColumnFilters,
          enableGrouping,
          enableColumnOrdering: _enableColumnOrdering,
          includeHeaderControlReserve: true,
        },
      ),
    [columns, enableColumnFilters, enableGrouping, _enableColumnOrdering],
  );
  const [groupingState, setGroupingState] = useControllableState({
    value: grouping,
    onChange: onGroupingChange,
    defaultValue: DEFAULT_GROUPING,
  });
  const rowNumberColumn = useMemo(
    () => enableRowNumbers === true ? createDataTableRowNumberColumn<TData>() : null,
    [enableRowNumbers],
  );
  const autoGroupColumn = useMemo(
    () =>
      enableGrouping === true && groupingState.length > 0
        ? createDataTableAutoGroupColumn<TData>()
        : null,
    [enableGrouping, groupingState.length],
  );
  const effectiveColumns = useMemo(() => {
    const prefix = [rowNumberColumn, autoGroupColumn].filter(
      (col): col is NonNullable<typeof col> => col !== null,
    );
    return prefix.length > 0 ? [...prefix, ...tableColumns] : tableColumns;
  }, [rowNumberColumn, autoGroupColumn, tableColumns]);
  const defaultColumnOrder = useMemo(
    () => getDefaultColumnOrderFromColumns(columns),
    [columns],
  );

  const [sortingState, setSortingState] = useControllableState({
    value: sorting,
    onChange: onSortingChange,
    defaultValue: DEFAULT_SORTING,
  });
  const [internalFilterRulesState, setInternalFilterRulesState] = useState<
    DataTableFilterRule[]
  >(() => {
    if (initialState?.filterRules !== undefined) {
      return normalizeDataTableFilterRules(undefined, initialState.filterRules);
    }

    return columnFiltersToDataTableFilterRules(
      undefined,
      initialState?.columnFilters ?? columnFilters ?? DEFAULT_COLUMN_FILTERS,
    );
  });
  const [columnVisibilityState, setColumnVisibilityState] = useControllableState(
    {
      value: columnVisibility,
      onChange: onColumnVisibilityChange,
      defaultValue: DEFAULT_COLUMN_VISIBILITY,
    },
  );
  const effectiveColumnVisibilityState = useMemo(() => {
    if (!enableGrouping || groupingState.length === 0) {
      return columnVisibilityState;
    }

    const nextColumnVisibility = { ...columnVisibilityState };

    for (const groupedColumnId of groupingState) {
      nextColumnVisibility[groupedColumnId] = false;
    }

    return nextColumnVisibility;
  }, [columnVisibilityState, enableGrouping, groupingState]);
  const [globalFilterState, setGlobalFilterState] = useControllableState({
    value: globalFilter,
    onChange: onGlobalFilterChange,
    defaultValue: DEFAULT_GLOBAL_FILTER,
  });
  const [columnOrderState, setColumnOrderState] = useControllableState({
    value: columnOrder,
    onChange: onColumnOrderChange,
    defaultValue: defaultColumnOrder,
  });
  const rowNumberColumnId = rowNumberColumn?.id ?? null;
  const autoGroupColumnId = autoGroupColumn?.id ?? null;
  const effectiveColumnOrderState = useMemo(() => {
    const prefixIds = [rowNumberColumnId, autoGroupColumnId].filter(
      (id): id is string => id !== null,
    );
    if (prefixIds.length === 0) {
      return columnOrderState;
    }
    const normalizedUserOrder = columnOrderState.filter(
      (columnId) =>
        !isDataTableAutoGroupColumnId(columnId) &&
        !isDataTableRowNumberColumnId(columnId),
    );
    return [...prefixIds, ...normalizedUserOrder];
  }, [rowNumberColumnId, autoGroupColumnId, columnOrderState]);
  const handleColumnOrderChange = useCallback(
    (nextColumnOrder: string[] | ((old: string[]) => string[])) => {
      const resolvedColumnOrder = resolveUpdater(nextColumnOrder, columnOrderState);
      setColumnOrderState(
        resolvedColumnOrder.filter(
          (columnId) =>
            !isDataTableAutoGroupColumnId(columnId) &&
            !isDataTableRowNumberColumnId(columnId),
        ),
      );
    },
    [columnOrderState, setColumnOrderState],
  );
  const [columnSizingState, setColumnSizingState] = useControllableState({
    value: columnSizing,
    onChange: onColumnSizingChange,
    defaultValue: DEFAULT_COLUMN_SIZING,
  });
  const normalizedColumnSizingState = useMemo(() => {
    const knownIds = [
      ...(rowNumberColumnId !== null ? [rowNumberColumnId] : []),
      ...(autoGroupColumnId !== null ? [autoGroupColumnId] : []),
      ...defaultColumnOrder,
    ];
    return normalizeColumnSizingState(columnSizingState, knownIds);
  }, [columnSizingState, defaultColumnOrder, rowNumberColumnId, autoGroupColumnId]);
  const clampedColumnSizingState = useMemo(
    () => clampColumnSizingStateToColumns(normalizedColumnSizingState, effectiveColumns),
    [normalizedColumnSizingState, effectiveColumns],
  );
  const [columnSizingInfoState, setColumnSizingInfoState] = useState(
    DEFAULT_COLUMN_SIZING_INFO,
  );
  const [expandedState, setExpandedState] = useControllableState({
    value: expanded,
    onChange: onExpandedChange,
    defaultValue: DEFAULT_EXPANDED,
  });
  const [paginationState, setPaginationState] = useControllableState({
    value: pagination,
    onChange: onPaginationChange,
    defaultValue: DEFAULT_PAGINATION,
  });
  const [rowSelectionState, setRowSelectionState] = useControllableState({
    value: rowSelection,
    onChange: onRowSelectionChange,
    defaultValue: DEFAULT_ROW_SELECTION,
  });

  const isFilterRulesControlled = filterRules !== undefined;
  const isLegacyColumnFiltersControlled =
    filterRules === undefined && columnFilters !== undefined;
  const filterRulesState = useMemo(() => {
    if (filterRules !== undefined) {
      return normalizeDataTableFilterRules(undefined, filterRules);
    }

    if (isLegacyColumnFiltersControlled) {
      return columnFiltersToDataTableFilterRules(undefined, columnFilters);
    }

    return internalFilterRulesState;
  }, [columnFilters, filterRules, internalFilterRulesState, isLegacyColumnFiltersControlled]);
  const columnFiltersState = useMemo(
    () => dataTableFilterRulesToColumnFilters(filterRulesState),
    [filterRulesState],
  );
  const setFilterRulesState = useCallback(
    (
      updater:
        | DataTableFilterRule[]
        | ((currentRules: DataTableFilterRule[]) => DataTableFilterRule[]),
    ) => {
      const nextFilterRules = normalizeDataTableFilterRules(
        undefined,
        resolveUpdater(updater, filterRulesState),
      );
      const nextColumnFilters =
        dataTableFilterRulesToLegacyColumnFilters(nextFilterRules);

      if (!isFilterRulesControlled && !isLegacyColumnFiltersControlled) {
        setInternalFilterRulesState(nextFilterRules);
      }

      onFilterRulesChange?.(nextFilterRules);
      onColumnFiltersChange?.(nextColumnFilters);
    },
    [
      filterRulesState,
      isFilterRulesControlled,
      isLegacyColumnFiltersControlled,
      onColumnFiltersChange,
      onFilterRulesChange,
    ],
  );
  const setColumnFiltersFromTanStack = useCallback(
    (
      updater:
        | ColumnFiltersState
        | ((currentColumnFilters: ColumnFiltersState) => ColumnFiltersState),
    ) => {
      const nextColumnFilters = resolveUpdater(updater, columnFiltersState);
      setFilterRulesState(
        columnFiltersToDataTableFilterRules(undefined, nextColumnFilters),
      );
    },
    [columnFiltersState, setFilterRulesState],
  );

  const controlledState = {
    sorting: sortingState,
    columnFilters: columnFiltersState,
    columnVisibility: effectiveColumnVisibilityState,
    globalFilter: globalFilterState,
    columnOrder: columnOrderState,
    columnSizing: clampedColumnSizingState,
    columnSizingInfo: columnSizingInfoState,
    grouping: groupingState,
    expanded: expandedState,
    pagination: paginationState,
    rowSelection: rowSelectionState,
  } satisfies Pick<
    TableState,
    | 'sorting'
    | 'columnFilters'
    | 'columnVisibility'
    | 'globalFilter'
    | 'columnOrder'
    | 'columnSizing'
    | 'columnSizingInfo'
    | 'grouping'
    | 'expanded'
    | 'pagination'
    | 'rowSelection'
  >;

  const table = useReactTable<TData>({
    data,
    columns: effectiveColumns,
    initialState: {
      sorting: DEFAULT_SORTING,
      columnFilters: DEFAULT_COLUMN_FILTERS,
      columnVisibility: DEFAULT_COLUMN_VISIBILITY,
      globalFilter: DEFAULT_GLOBAL_FILTER,
      columnOrder: defaultColumnOrder,
      columnSizing: DEFAULT_COLUMN_SIZING,
      columnSizingInfo: DEFAULT_COLUMN_SIZING_INFO,
      grouping: DEFAULT_GROUPING,
      expanded: DEFAULT_EXPANDED,
      pagination: DEFAULT_PAGINATION,
      rowSelection: DEFAULT_ROW_SELECTION,
    },
    state: {
      ...controlledState,
      columnOrder: effectiveColumnOrderState,
    },
    enableColumnFilters,
    enableGlobalFilter,
    enableGrouping,
    groupedColumnMode: false,
    enableColumnResizing,
    enableExpanding: enableGrouping,
    columnResizeMode,

    getCoreRowModel: getCoreRowModel(),
    // In server mode the server owns sorting and filtering; skip the client-side
    // row models entirely so they are never applied on top of server results.
    getSortedRowModel: isServer ? undefined : getSortedRowModel(),
    getFilteredRowModel: isServer ? undefined : getFilteredRowModel(),
    getGroupedRowModel:
      isServer || !enableGrouping ? undefined : getGroupedRowModel(),
    getExpandedRowModel:
      isServer || !enableGrouping ? undefined : getExpandedRowModel(),
    getPaginationRowModel:
      isServer || !shouldPaginate ? undefined : getPaginationRowModel(),
    // Client-side pagination keeps its current page unless it becomes invalid;
    // a local clamp below handles the out-of-range case without surprising
    // controlled pagination consumers.
    autoResetPageIndex: false,

    manualSorting: isServer,
    manualFiltering: isServer,
    manualGrouping: isServer,
    manualExpanding: isServer,
    manualPagination: isServer && shouldPaginate,
    // Pass pageCount only in server mode; undefined is ignored by TanStack.
    pageCount: isServer && shouldPaginate ? pageCount : undefined,
    rowCount: isServer && shouldPaginate ? rowCount : undefined,
    meta: {
      resetToInitialState: () => {
        flushSync(() => {
          setSortingState(DEFAULT_SORTING);
          setFilterRulesState(DEFAULT_FILTER_RULES);
          setGlobalFilterState(DEFAULT_GLOBAL_FILTER);
          setPaginationState(DEFAULT_PAGINATION);
          setRowSelectionState(DEFAULT_ROW_SELECTION);
          setColumnVisibilityState(DEFAULT_COLUMN_VISIBILITY);
          setColumnOrderState(defaultColumnOrder);
          setColumnSizingState(DEFAULT_COLUMN_SIZING);
          setColumnSizingInfoState(DEFAULT_COLUMN_SIZING_INFO);
          setGroupingState(DEFAULT_GROUPING);
          setExpandedState(DEFAULT_EXPANDED);
        });
      },
      getUserColumnVisibilityState: () => columnVisibilityState,
      getFilterRules: () => filterRulesState,
      setFilterRules: setFilterRulesState,
      getFilterRuleValue: (columnId, operator) =>
        getDataTableFilterRuleValue(filterRulesState, columnId, operator),
      setFilterRuleValue: (columnId, operator, value) => {
        setFilterRulesState((currentRules) =>
          upsertDataTableFilterRule(
            currentRules,
            columnId,
            operator,
            value,
          ),
        );
      },
      commitColumnOrderPreview: (nextColumnOrder: string[]) => {
        handleColumnOrderChange(nextColumnOrder);
      },
      clearColumnOrderPreview: () => {
      },
    },

    onSortingChange: setSortingState,
    onColumnFiltersChange: setColumnFiltersFromTanStack,
    onColumnVisibilityChange: setColumnVisibilityState,
    onGlobalFilterChange: setGlobalFilterState,
    onColumnOrderChange: handleColumnOrderChange,
    onColumnSizingChange: setColumnSizingState,
    onColumnSizingInfoChange: setColumnSizingInfoState,
    onGroupingChange: setGroupingState,
    onExpandedChange: setExpandedState,
    onPaginationChange: setPaginationState,
    onRowSelectionChange: setRowSelectionState,

    // The rowSelection slice is always available; the hook handles whether the
    // selection state is internally owned or externally controlled.
    enableRowSelection: true,

    getRowId,
  });

  const isPaginationControlled = pagination !== undefined;
  const currentPagination = table.getState().pagination;
  const currentPageCount = table.getPageCount();
  const maxPageIndex = Math.max(currentPageCount - 1, 0);

  useLayoutEffect(() => {
    if (isServer || !shouldPaginate || isPaginationControlled) {
      return;
    }

    if (currentPagination.pageIndex <= maxPageIndex) {
      return;
    }

    setPaginationState({
      pageIndex: maxPageIndex,
      pageSize: currentPagination.pageSize,
    });
  }, [
    currentPagination.pageIndex,
    currentPagination.pageSize,
    isPaginationControlled,
    isServer,
    maxPageIndex,
    setPaginationState,
    shouldPaginate,
  ]);

  return table;
}
