import * as Popover from '@radix-ui/react-popover';
import type { Column, Table } from '@tanstack/react-table';
import { Columns3, RotateCcw } from 'lucide-react';
import { useState } from 'react';

import { isDataTableAutoGroupColumnId } from '../lib/auto-group-column';
import { resetColumnOrder } from '../lib/column-ordering';
import { DataTableColumnsGroupingSection } from './data-table-column-grouping-section';
import { DataTableColumnOrderList } from './data-table-column-order-list';
import { DataTableScrollArea } from './data-table-scroll-area';

interface DataTableColumnsMenuProps<TData extends object> {
  table: Table<TData>;
  enableColumnOrdering?: boolean;
  enableColumnVisibility?: boolean;
  enableGrouping?: boolean;
}

interface DataTableColumnsOrderingSectionProps<TData extends object> {
  table: Table<TData>;
  columns: Array<Column<TData, unknown>>;
}

interface DataTableColumnsVisibilitySectionProps<TData extends object> {
  columns: Array<Column<TData, unknown>>;
  groupedColumnIds: string[];
  userColumnVisibilityState: Record<string, boolean>;
}

export function DataTableColumnsMenu<TData extends object>({
  table,
  enableColumnOrdering,
  enableColumnVisibility,
  enableGrouping,
}: DataTableColumnsMenuProps<TData>) {
  const [open, setOpen] = useState(false);
  const leafColumns = table
    .getAllLeafColumns()
    .filter((column) => !isDataTableAutoGroupColumnId(column.id));
  const hideableColumns = leafColumns.filter((column) => column.getCanHide());
  const hasGrouping = table.getState().grouping.length > 0;
  const userColumnVisibilityState =
    table.options.meta?.getUserColumnVisibilityState?.() ?? table.getState().columnVisibility;
  const groupedColumnIds = table.getState().grouping;

  const handleReset = () => {
    table.resetColumnVisibility(true);
  };

  const handleResetOrder = () => {
    resetColumnOrder(table);
  };

  const handleClearGrouping = () => {
    table.resetGrouping(true);
  };

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <div className="data-table__columns-menu">
        <Popover.Trigger asChild>
          <button
            type="button"
            className="data-table__toolbar-button data-table__toolbar-button--icon"
            aria-label="Columns"
            title="Columns"
          >
            <Columns3
              className="data-table__toolbar-button-icon"
              aria-hidden="true"
            />
          </button>
        </Popover.Trigger>

        {open ? (
          <Popover.Content
            role="menu"
            aria-label="Columns"
            className="data-table__columns-menu-panel"
            sideOffset={8}
            align="end"
          >
            <DataTableScrollArea
              className="data-table__scroll-area--columns-menu"
              viewportClassName="data-table__columns-menu-list"
            >
              {enableGrouping ? (
                <DataTableColumnsGroupingSection table={table} columns={leafColumns} />
              ) : null}

              {enableColumnOrdering ? (
                <DataTableColumnsOrderingSection
                  table={table}
                  columns={leafColumns}
                />
              ) : null}

              {enableColumnVisibility ? (
                <DataTableColumnsVisibilitySection
                  columns={hideableColumns}
                  groupedColumnIds={groupedColumnIds}
                  userColumnVisibilityState={userColumnVisibilityState}
                />
              ) : null}
            </DataTableScrollArea>

            <div className="data-table__columns-menu-actions">
              <button
                type="button"
                className="data-table__columns-menu-action"
                onClick={handleReset}
              >
                <RotateCcw aria-hidden="true" />
                Reset
              </button>
              {enableColumnOrdering ? (
                <button
                  type="button"
                  className="data-table__columns-menu-action data-table__columns-menu-action--secondary"
                  onClick={handleResetOrder}
                >
                  <RotateCcw aria-hidden="true" />
                  Reset order
                </button>
              ) : null}
              {enableGrouping && hasGrouping ? (
                <button
                  type="button"
                  className="data-table__columns-menu-action data-table__columns-menu-action--secondary"
                  onClick={handleClearGrouping}
                >
                  Clear grouping
                </button>
              ) : null}
            </div>
          </Popover.Content>
        ) : null}
      </div>
    </Popover.Root>
  );
}

function DataTableColumnsOrderingSection<TData extends object>({
  table,
  columns,
}: DataTableColumnsOrderingSectionProps<TData>) {
  return (
    <div className="data-table__columns-menu-section">
      <div className="data-table__columns-menu-section-title">Column order</div>
      {columns.length === 0 ? (
        <div className="data-table__columns-menu-empty">
          No columns can be reordered.
        </div>
      ) : (
        <DataTableColumnOrderList table={table} columns={columns} />
      )}
    </div>
  );
}

function DataTableColumnsVisibilitySection<TData extends object>({
  columns,
  groupedColumnIds,
  userColumnVisibilityState,
}: DataTableColumnsVisibilitySectionProps<TData>) {
  return columns.length === 0 ? (
    <div className="data-table__columns-menu-empty">No columns can be hidden.</div>
  ) : (
    <div className="data-table__columns-menu-section">
      {columns.length > 0 ? (
        <div className="data-table__columns-menu-section-title">
          Column visibility
        </div>
      ) : null}
      {columns.map((column) => {
        const label = column.columnDef.meta?.label ?? column.id;
        const isVisible = userColumnVisibilityState[column.id] ?? true;
        const isGroupedSource = groupedColumnIds.includes(column.id);

        return (
          <label
            key={column.id}
            className={
              isGroupedSource
                ? 'data-table__columns-menu-item data-table__columns-menu-item--grouped'
                : 'data-table__columns-menu-item'
            }
          >
            <input
              type="checkbox"
              checked={isVisible}
              onChange={() => column.toggleVisibility()}
              aria-describedby={isGroupedSource ? `${column.id}-grouped-hint` : undefined}
            />
            <span>{label}</span>
            {isGroupedSource ? (
              <span
                id={`${column.id}-grouped-hint`}
                className="data-table__columns-menu-item-badge"
                aria-hidden="true"
                title="Grouped"
              >
                Grouped
              </span>
            ) : null}
          </label>
        );
      })}
    </div>
  );
}
