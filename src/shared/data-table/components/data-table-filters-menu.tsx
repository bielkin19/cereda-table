import * as Popover from '@radix-ui/react-popover';
import type { Column, Table } from '@tanstack/react-table';
import { ChevronDown, ChevronUp, Plus, SlidersHorizontal, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

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
import { useDataTableLocale } from './data-table-locale-context';
import { DataTableScrollArea } from './data-table-scroll-area';

interface DataTableFiltersMenuProps<TData extends object> {
  table: Table<TData>;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
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
  open: controlledOpen,
  onOpenChange,
}: DataTableFiltersMenuProps<TData>) {
  const locale = useDataTableLocale();
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
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

  const handleOpenChange = useCallback((nextOpen: boolean) => {
    if (controlledOpen === undefined) {
      setUncontrolledOpen(nextOpen);
    }
    onOpenChange?.(nextOpen);
    if (!nextOpen) {
      setIsAddingFilter(false);
      setDraftFilterColumnIds([]);
    }
  }, [controlledOpen, onOpenChange]);

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

  useEffect(() => {
    if (!open) return;

    function handleBackdropPointerDown(event: PointerEvent) {
      if (
        event.target instanceof Element &&
        event.target.classList.contains('cereda-table__popover-backdrop')
      ) {
        handleOpenChange(false);
      }
    }

    document.addEventListener('pointerdown', handleBackdropPointerDown, true);
    return () => {
      document.removeEventListener('pointerdown', handleBackdropPointerDown, true);
    };
  }, [handleOpenChange, open]);

  if (filterableColumns.length === 0) {
    return null;
  }

  return (
    <Popover.Root open={open} onOpenChange={handleOpenChange}>
      <div
        className={
          open
            ? 'cereda-table__filters-menu cereda-table__popover-root--open'
            : 'cereda-table__filters-menu'
        }
      >
        <Popover.Trigger asChild>
          <button
            type="button"
            className={
              activeFilterCount > 0
                ? 'cereda-table__toolbar-button cereda-table__toolbar-button--active'
                : 'cereda-table__toolbar-button'
            }
            aria-haspopup="dialog"
            aria-expanded={open}
            aria-label={
              activeFilterCount > 0
                ? locale.filters.activeAriaLabel(activeFilterCount)
                : locale.filters.buttonLabel
            }
            title={locale.filters.buttonLabel}
          >
            <SlidersHorizontal aria-hidden="true" />
            {locale.filters.buttonLabel}
            {activeFilterCount > 0 ? (
              <span className="cereda-table__toolbar-button-count">
                {activeFilterCount}
              </span>
            ) : null}
          </button>
        </Popover.Trigger>

        {open ? (
          <>
            <Popover.Portal>
              <div
                className="cereda-table__popover-backdrop"
                onPointerDown={() => handleOpenChange(false)}
                aria-hidden="true"
              />
            </Popover.Portal>
            <Popover.Portal>
            <Popover.Content
              role="dialog"
              aria-label={locale.filters.panelTitle}
              className="cereda-table__filters-menu-panel"
              sideOffset={8}
              align="end"
            >
            <div className="cereda-table__filters-menu-header">
              <div>
                <div className="cereda-table__filters-menu-title">{locale.filters.panelTitle}</div>
                <div className="cereda-table__filters-menu-subtitle">
                  {locale.filters.panelSubtitle}
                </div>
              </div>
              {activeFilterCount > 0 ? (
                <button
                  type="button"
                  className="cereda-table__filters-menu-clear"
                  onClick={handleClearAllFilters}
                >
                  {locale.filters.clearAll}
                </button>
              ) : null}
            </div>

            <DataTableScrollArea className="cereda-table__scroll-area--filters-menu-builder">
              <div className="cereda-table__filters-menu-builder">
                {visibleFilterColumns.length === 0 ? (
                  <div className="cereda-table__filters-menu-empty">
                    {locale.filters.noFilters}
                  </div>
                ) : (
                  visibleFilterColumns.map((column) => {
                    const label = getColumnFilterLabel(column);
                    const isCollapsed = collapsedFilterIds.includes(column.id);
                    const CollapseIcon = isCollapsed ? ChevronDown : ChevronUp;

                    return (
                      <section
                        key={column.id}
                        className="cereda-table__filters-menu-filter-block"
                        aria-label={locale.filters.sectionAriaLabel(label)}
                      >
                        <div className="cereda-table__filters-menu-filter-header">
                          <div className="cereda-table__filters-menu-filter-title">
                            {label}
                          </div>
                          <div className="cereda-table__filters-menu-filter-actions">
                            <button
                              type="button"
                              className="cereda-table__filters-menu-icon-button"
                              onClick={() => handleToggleFilterCollapsed(column.id)}
                              aria-label={
                                isCollapsed
                                  ? locale.filters.expandAriaLabel(label)
                                  : locale.filters.collapseAriaLabel(label)
                              }
                            >
                              <CollapseIcon aria-hidden="true" />
                            </button>
                            <button
                              type="button"
                              className="cereda-table__filters-menu-icon-button"
                              onClick={() => handleRemoveFilter(column)}
                              aria-label={locale.filters.removeAriaLabel(label)}
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
                  <div className="cereda-table__filters-menu-add-panel">
                    <div className="cereda-table__filters-menu-add-title">
                      {locale.filters.chooseField}
                    </div>
                    {inactiveFilterColumns.length === 0 ? (
                      <div className="cereda-table__filters-menu-empty">
                        {locale.filters.noAvailableFilters}
                      </div>
                    ) : (
                      <div className="cereda-table__filters-menu-column-list">
                        {inactiveFilterColumns.map((column) => (
                          <button
                            key={column.id}
                            type="button"
                            className="cereda-table__filters-menu-column"
                            onClick={() => handleAddFilter(column)}
                          >
                            <span className="cereda-table__filters-menu-column-label">
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
                  className="cereda-table__filters-menu-add"
                  onClick={() => setIsAddingFilter((current) => !current)}
                >
                  {isAddingFilter ? (
                    locale.filters.cancel
                  ) : (
                    <>
                      <Plus aria-hidden="true" />
                      {locale.filters.addFilter}
                    </>
                  )}
                </button>
              </div>
            </DataTableScrollArea>
            </Popover.Content>
            </Popover.Portal>
          </>
        ) : null}
      </div>
    </Popover.Root>
  );
}

