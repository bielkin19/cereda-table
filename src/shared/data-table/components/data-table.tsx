import '../data-table.css';

import React, { useRef } from 'react';

import { useDataTable } from '../hooks/use-data-table';
import { DATA_TABLE_VERSION } from '../lib/version';
import { getVisibleLeafColumnsTotalSize } from '../lib/column-sizing';
import type { DataTableProps } from '../types/data-table.types';
import { DataTableBody } from './data-table-body';
import { DataTableDndLayer } from './data-table-dnd-layer';
import { DataTableEmpty } from './data-table-empty';
import { DataTableGroupingPanel } from './data-table-grouping-panel';
import { DataTableHeader } from './data-table-header';
import { DataTableLocaleProvider } from './data-table-locale-context';
import { DataTablePagination } from './data-table-pagination';
import { DataTableSearchProvider } from './data-table-search-context';
import { DataTableToolbar } from './data-table-toolbar';

export function DataTable<TData extends object>({
  data,
  columns,
  mode,
  enableColumnFilters,
  enableColumnOrdering,
  enableColumnVisibility,
  enableGlobalFilter,
  enableGrouping,
  enablePagination,
  enableColumnResizing,
  columnResizeMode,
  enableSavedViews,
  enableRowNumbers,
  sorting,
  onSortingChange,
  columnFilters,
  onColumnFiltersChange,
  filterRules,
  onFilterRulesChange,
  initialState,
  columnVisibility,
  globalFilter,
  onGlobalFilterChange,
  onColumnVisibilityChange,
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
  pageSizeOptions,
  storageKey,
  defaultViewName,
  savedViewsStorage,
  getRowId,
  bodyHeight,
  locale,
  isLoading = false,
  renderEmpty,
  renderLoading,
  showFiltersButton = true,
  showColumnsButton = true,
}: DataTableProps<TData>) {
  const table = useDataTable({
    data,
    columns,
    enableRowNumbers,
    mode,
    enableColumnFilters,
    enableColumnOrdering,
    enableGlobalFilter,
    enableGrouping,
    enablePagination,
    enableColumnResizing,
    columnResizeMode,
    enableSavedViews,
    sorting,
    onSortingChange,
    columnFilters,
    onColumnFiltersChange,
    filterRules,
    onFilterRulesChange,
    initialState,
    columnVisibility,
    globalFilter,
    onGlobalFilterChange,
    onColumnVisibilityChange,
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
    pageSizeOptions,
    storageKey,
    defaultViewName,
    savedViewsStorage,
    getRowId,
  });

  const headerGroups = table.getHeaderGroups();
  const visibleTableWidth = getVisibleLeafColumnsTotalSize(table);

  // When at least one visible column has no explicit maxSize ("fill column")
  // AND that column hasn't been explicitly resized yet, the table must be
  // width:100% so table-layout:fixed distributes leftover space to it.
  // Once the user resizes all fill columns they become bounded and the table
  // reverts to exact pixel width (preventing unbounded growth on wide screens).
  //
  // During an active drag we treat the column being resized as still fill
  // (isResizingColumn guard) to prevent a layout jump mid-drag.
  const columnSizingState = table.getState().columnSizing;
  const isResizingColumn = table.getState().columnSizingInfo.isResizingColumn;
  const hasFillColumns = table.getVisibleLeafColumns().some((col) => {
    if (col.columnDef.maxSize != null) return false;      // bounded column
    if (col.id === isResizingColumn) return true;          // keep fill during active drag
    return !(col.id in columnSizingState);                 // fill only if not yet resized
  });

  const exactTableWidth = visibleTableWidth > 0 ? `${visibleTableWidth}px` : '100%';
  const tableStyle = hasFillColumns
    ? {
        width: '100%',
        minWidth: visibleTableWidth > 0 ? `${visibleTableWidth}px` : '100%',
        tableLayout: 'fixed' as const,
      }
    : {
        width: exactTableWidth,
        minWidth: exactTableWidth,
        tableLayout: 'fixed' as const,
      };
  const hasToolbar =
    enableColumnOrdering === true ||
    enableColumnVisibility === true ||
    enableGlobalFilter === true ||
    enableGrouping === true ||
    enableSavedViews === true;

  const isEmpty = !isLoading && table.getRowModel().rows.length === 0;

  const rawGlobalFilter: unknown = table.getState().globalFilter;
  const activeGlobalFilter = typeof rawGlobalFilter === 'string' ? rawGlobalFilter : undefined;
  const activeFilterRules = table.options.meta?.getFilterRules?.() ?? [];
  const hasGlobalFilter = enableGlobalFilter === true && (activeGlobalFilter?.trim().length ?? 0) > 0;
  const hasColumnFilters = enableColumnFilters === true && activeFilterRules.length > 0;
  const activeFilterCount = (hasGlobalFilter ? 1 : 0) + (hasColumnFilters ? activeFilterRules.length : 0);

  function handleClearFilters() {
    if (hasGlobalFilter) table.setGlobalFilter('');
    if (hasColumnFilters) table.options.meta?.setFilterRules?.([]);
  }

  const tableContent = (
    <DataTableSearchProvider table={table}>
      {hasToolbar ? (
        <div className="cereda-table__toolbar">
          <DataTableToolbar
            table={table}
            enableColumnOrdering={enableColumnOrdering}
            enableColumnFilters={enableColumnFilters}
            enableColumnVisibility={enableColumnVisibility}
            enableGlobalFilter={enableGlobalFilter}
            enableGrouping={enableGrouping}
            enableSavedViews={enableSavedViews}
            storageKey={storageKey}
            defaultViewName={defaultViewName}
            savedViewsStorage={savedViewsStorage}
            showFiltersButton={showFiltersButton}
            showColumnsButton={showColumnsButton}
          />
        </div>
      ) : null}
      {enableGrouping ? <DataTableGroupingPanel table={table} /> : null}
      <div
        className="cereda-table__body-scroll"
        data-constrained-height={bodyHeight != null || undefined}
      >
        <table className="cereda-table" style={tableStyle}>
          <DataTableHeader
            headerGroups={headerGroups}
            enableColumnFilters={enableColumnFilters}
            enableColumnOrdering={enableColumnOrdering}
            enableColumnResizing={enableColumnResizing}
          />
          <DataTableBody
            table={table}
            isLoading={isLoading}
            renderLoading={renderLoading}
          />
        </table>
      </div>
      {isEmpty ? (
        <div className="cereda-table__empty-panel">
          {renderEmpty ?? (
            <DataTableEmpty
              activeFilterCount={activeFilterCount}
              onClearFilters={activeFilterCount > 0 ? handleClearFilters : undefined}
            />
          )}
        </div>
      ) : null}
    </DataTableSearchProvider>
  );

  const wrapperRef = useRef<HTMLDivElement>(null);

  const wrapperStyle = bodyHeight != null
    ? ({ '--cereda-table-body-max-height': typeof bodyHeight === 'number' ? `${bodyHeight}px` : bodyHeight } as React.CSSProperties)
    : undefined;

  const wrapperContent = (
    <div ref={wrapperRef} className="cereda-table__wrapper" style={wrapperStyle}>
      <DataTableDndLayer
        table={table}
        wrapperRef={wrapperRef}
        enableColumnOrdering={enableColumnOrdering}
        enableGrouping={enableGrouping}
      >
        {tableContent}
      </DataTableDndLayer>
      {enablePagination ? (
        <DataTablePagination
          table={table}
          pageSizeOptions={pageSizeOptions}
        />
      ) : null}
      <div className="cereda-table__version" aria-hidden="true">v{DATA_TABLE_VERSION}</div>
    </div>
  );

  return locale ? (
    <DataTableLocaleProvider locale={locale}>{wrapperContent}</DataTableLocaleProvider>
  ) : wrapperContent;
}

