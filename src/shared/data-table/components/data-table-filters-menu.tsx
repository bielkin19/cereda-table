import * as Popover from '@radix-ui/react-popover';
import type { Column, Table } from '@tanstack/react-table';
import { ChevronDown, ChevronUp, Plus, SlidersHorizontal, X } from 'lucide-react';
import { useMemo, useState } from 'react';

import { isDataTableAutoGroupColumnId } from '../lib/auto-group-column';
import { normalizeDataTableFilterRules } from '../lib/filters/data-table-filter-normalization';
import {
  getColumnFilterLabel,
  isSupportedFilterVariant,
} from '../lib/filters/data-table-filter-options';
import type { DataTableFilterRule } from '../types/data-table.types';
import {
  DataTableBooleanFilter,
  DataTableDateFilter,
  DataTableDateRangeFilter,
  DataTableMultiSelectFilter,
  DataTableNumberFilter,
  DataTableSelectFilter,
  DataTableTextFilter,
} from './data-table-column-filter';
import { DataTableScrollArea } from './data-table-scroll-area';

interface DataTableFiltersMenuProps<TData extends object> {
  table: Table<TData>;
}

function getFilterableColumns<TData extends object>(table: Table<TData>) {
  return table
    .getAllLeafColumns()
    .filter(
      (column) =>
        !isDataTableAutoGroupColumnId(column.id) &&
        column.getCanFilter() &&
        isSupportedFilterVariant(column.columnDef.meta?.filterVariant),
    );
}

function getCanonicalFilterRules<TData extends object>(
  table: Table<TData>,
): DataTableFilterRule[] {
  return normalizeDataTableFilterRules(table, table.options.meta?.getFilterRules?.());
}

function getActiveFilterColumnIds<TData extends object>(
  filterRules: readonly DataTableFilterRule[],
  filterableColumns: readonly Column<TData, unknown>[],
) {
  const filterableColumnIds = new Set(filterableColumns.map((column) => column.id));
  return Array.from(
    new Set(
      filterRules
        .filter((rule) => filterableColumnIds.has(rule.columnId))
        .map((rule) => rule.columnId),
    ),
  );
}

function getActiveFilterColumns<TData extends object>(
  filterRules: readonly DataTableFilterRule[],
  filterableColumns: Array<Column<TData, unknown>>,
) {
  const filterableColumnsById = new Map(
    filterableColumns.map((column) => [column.id, column] as const),
  );

  return filterRules
    .map((rule) => filterableColumnsById.get(rule.columnId))
    .filter((column): column is Column<TData, unknown> => column !== undefined);
}

function DataTableFiltersMenuColumnEditor<TData extends object>({
  column,
  table,
}: {
  column: Column<TData, unknown>;
  table: Table<TData>;
}) {
  const filterVariant = column.columnDef.meta?.filterVariant;

  if (filterVariant === 'number') {
    return <DataTableNumberFilter column={column} table={table} />;
  }

  if (filterVariant === 'date') {
    return <DataTableDateFilter column={column} table={table} />;
  }

  if (filterVariant === 'date-range') {
    return <DataTableDateRangeFilter column={column} table={table} />;
  }

  if (filterVariant === 'text') {
    return <DataTableTextFilter column={column} table={table} />;
  }

  if (filterVariant === 'select') {
    return <DataTableSelectFilter column={column} table={table} />;
  }

  if (filterVariant === 'multi-select') {
    return <DataTableMultiSelectFilter column={column} table={table} />;
  }

  if (filterVariant === 'boolean') {
    return <DataTableBooleanFilter column={column} table={table} />;
  }

  return null;
}

export function DataTableFiltersMenu<TData extends object>({
  table,
}: DataTableFiltersMenuProps<TData>) {
  const [open, setOpen] = useState(false);
  const [isAddingFilter, setIsAddingFilter] = useState(false);
  const [collapsedFilterIds, setCollapsedFilterIds] = useState<string[]>([]);
  const [draftFilterColumnIds, setDraftFilterColumnIds] = useState<string[]>([]);
  const filterableColumns = useMemo(() => getFilterableColumns(table), [table]);
  const filterRules = getCanonicalFilterRules(table);
  const activeFilterColumnIds = getActiveFilterColumnIds(
    filterRules,
    filterableColumns,
  );
  const activeFilterColumns = getActiveFilterColumns(filterRules, filterableColumns);
  const draftFilterColumns = draftFilterColumnIds
    .map((columnId) => filterableColumns.find((column) => column.id === columnId))
    .filter((column): column is Column<TData, unknown> => column !== undefined)
    .filter((column) => !activeFilterColumnIds.includes(column.id));
  const visibleFilterColumns = [...activeFilterColumns, ...draftFilterColumns];
  const visibleFilterColumnIds = new Set(
    visibleFilterColumns.map((column) => column.id),
  );
  const inactiveFilterColumns = filterableColumns.filter(
    (column) => !visibleFilterColumnIds.has(column.id),
  );
  const activeFilterCount = activeFilterColumnIds.length;

  if (filterableColumns.length === 0) {
    return null;
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) {
      setIsAddingFilter(false);
      setDraftFilterColumnIds([]);
    }
  }

  function handleClearAllFilters() {
    table.options.meta?.setFilterRules?.([]);
    setIsAddingFilter(false);
    setDraftFilterColumnIds([]);
  }

  function handleAddFilter(column: Column<TData, unknown>) {
    setDraftFilterColumnIds((currentColumnIds) =>
      currentColumnIds.includes(column.id)
        ? currentColumnIds
        : [...currentColumnIds, column.id],
    );
    setIsAddingFilter(false);
  }

  function handleRemoveFilter(column: Column<TData, unknown>) {
    table.options.meta?.setFilterRules?.((currentRules) =>
      currentRules.filter((rule) => rule.columnId !== column.id),
    );
    setDraftFilterColumnIds((currentColumnIds) =>
      currentColumnIds.filter((columnId) => columnId !== column.id),
    );
    setCollapsedFilterIds((currentColumnIds) =>
      currentColumnIds.filter((columnId) => columnId !== column.id),
    );
  }

  function handleToggleFilterCollapsed(columnId: string) {
    setCollapsedFilterIds((currentColumnIds) =>
      currentColumnIds.includes(columnId)
        ? currentColumnIds.filter((currentColumnId) => currentColumnId !== columnId)
        : [...currentColumnIds, columnId],
    );
  }

  return (
    <Popover.Root open={open} onOpenChange={handleOpenChange}>
      <div className="data-table__filters-menu">
        <Popover.Trigger asChild>
          <button
            type="button"
            className={
              activeFilterCount > 0
                ? 'data-table__toolbar-button data-table__toolbar-button--active'
                : 'data-table__toolbar-button'
            }
            aria-haspopup="dialog"
            aria-expanded={open}
            aria-label={
              activeFilterCount > 0
                ? `Filters, ${activeFilterCount} active`
                : 'Filters'
            }
            title="Filters"
          >
            <SlidersHorizontal aria-hidden="true" />
            Filters
            {activeFilterCount > 0 ? (
              <span className="data-table__toolbar-button-count">
                {activeFilterCount}
              </span>
            ) : null}
          </button>
        </Popover.Trigger>

        {open ? (
          <Popover.Content
            role="dialog"
            aria-label="Filters"
            className="data-table__filters-menu-panel"
            sideOffset={8}
            align="end"
          >
            <div className="data-table__filters-menu-header">
              <div>
                <div className="data-table__filters-menu-title">Filters</div>
                <div className="data-table__filters-menu-subtitle">
                  Add field filters and edit them in one list.
                </div>
              </div>
              {activeFilterCount > 0 ? (
                <button
                  type="button"
                  className="data-table__filters-menu-clear"
                  onClick={handleClearAllFilters}
                >
                  Clear all
                </button>
              ) : null}
            </div>

            <DataTableScrollArea className="data-table__scroll-area--filters-menu-builder">
              <div className="data-table__filters-menu-builder">
                {visibleFilterColumns.length === 0 ? (
                  <div className="data-table__filters-menu-empty">
                    No filters added.
                  </div>
                ) : (
                  visibleFilterColumns.map((column) => {
                    const label = getColumnFilterLabel(column);
                    const isCollapsed = collapsedFilterIds.includes(column.id);
                    const CollapseIcon = isCollapsed ? ChevronDown : ChevronUp;

                    return (
                      <section
                        key={column.id}
                        className="data-table__filters-menu-filter-block"
                        aria-label={`${label} filter`}
                      >
                        <div className="data-table__filters-menu-filter-header">
                          <div className="data-table__filters-menu-filter-title">
                            {label}
                          </div>
                          <div className="data-table__filters-menu-filter-actions">
                            <button
                              type="button"
                              className="data-table__filters-menu-icon-button"
                              onClick={() => handleToggleFilterCollapsed(column.id)}
                              aria-label={
                                isCollapsed
                                  ? `Expand ${label} filter`
                                  : `Collapse ${label} filter`
                              }
                            >
                              <CollapseIcon aria-hidden="true" />
                            </button>
                            <button
                              type="button"
                              className="data-table__filters-menu-icon-button"
                              onClick={() => handleRemoveFilter(column)}
                              aria-label={`Remove ${label} filter`}
                            >
                              <X aria-hidden="true" />
                            </button>
                          </div>
                        </div>
                        {isCollapsed ? null : (
                          <DataTableFiltersMenuColumnEditor
                            column={column}
                            table={table}
                          />
                        )}
                      </section>
                    );
                  })
                )}

                {isAddingFilter ? (
                  <div className="data-table__filters-menu-add-panel">
                    <div className="data-table__filters-menu-add-title">
                      Choose a field
                    </div>
                    {inactiveFilterColumns.length === 0 ? (
                      <div className="data-table__filters-menu-empty">
                        All available filters are already added.
                      </div>
                    ) : (
                      <div className="data-table__filters-menu-column-list">
                        {inactiveFilterColumns.map((column) => (
                          <button
                            key={column.id}
                            type="button"
                            className="data-table__filters-menu-column"
                            onClick={() => handleAddFilter(column)}
                          >
                            <span className="data-table__filters-menu-column-label">
                              {getColumnFilterLabel(column)}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : null}

                <button
                  type="button"
                  className="data-table__filters-menu-add"
                  onClick={() => setIsAddingFilter((current) => !current)}
                >
                  {isAddingFilter ? (
                    'Cancel'
                  ) : (
                    <>
                      <Plus aria-hidden="true" />
                      Add filter
                    </>
                  )}
                </button>
              </div>
            </DataTableScrollArea>
          </Popover.Content>
        ) : null}
      </div>
    </Popover.Root>
  );
}
