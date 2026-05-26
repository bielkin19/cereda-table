import * as Popover from '@radix-ui/react-popover';
import type { Column, Table } from '@tanstack/react-table';
import { Columns3, Eye, GitBranch, GripVertical, RotateCcw, X } from 'lucide-react';
import { useEffect, useState } from 'react';

import { isDataTableAutoGroupColumnId } from '../lib/auto-group-column';
import { resetColumnOrder } from '../lib/column-ordering';
import { DataTableCheckboxField } from './data-table-checkbox';
import { DataTableColumnsGroupingSection } from './data-table-column-grouping-section';
import { DataTableColumnOrderList } from './data-table-column-order-list';
import { useDataTableLocale } from './data-table-locale-context';
import { DataTableScrollArea } from './data-table-scroll-area';

interface DataTableColumnsMenuProps<TData extends object> {
  table: Table<TData>;
  enableColumnOrdering?: boolean;
  enableColumnVisibility?: boolean;
  enableGrouping?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
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
  open: controlledOpen,
  onOpenChange,
}: DataTableColumnsMenuProps<TData>) {
  const locale = useDataTableLocale();
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = onOpenChange ?? setUncontrolledOpen;
  const leafColumns = table
    .getAllLeafColumns()
    .filter((column) => !isDataTableAutoGroupColumnId(column.id));
  const hideableColumns = leafColumns.filter((column) => column.getCanHide());
  const hasGrouping = table.getState().grouping.length > 0;
  const userColumnVisibilityState =
    table.options.meta?.getUserColumnVisibilityState?.() ?? table.getState().columnVisibility;
  const groupedColumnIds = table.getState().grouping;
  const visibleColumnCount = hideableColumns.filter(
    (column) => userColumnVisibilityState[column.id] ?? true,
  ).length;
  const hiddenColumnCount = Math.max(0, hideableColumns.length - visibleColumnCount);

  const handleReset = () => {
    table.resetColumnVisibility(true);
  };

  const handleResetOrder = () => {
    resetColumnOrder(table);
  };

  const handleClearGrouping = () => {
    table.resetGrouping(true);
  };

  useEffect(() => {
    if (!open) return;

    function handleBackdropPointerDown(event: PointerEvent) {
      if (
        event.target instanceof Element &&
        event.target.classList.contains('cereda-table__popover-backdrop')
      ) {
        setOpen(false);
      }
    }

    document.addEventListener('pointerdown', handleBackdropPointerDown, true);
    return () => {
      document.removeEventListener('pointerdown', handleBackdropPointerDown, true);
    };
  }, [open, setOpen]);

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <div
        className={
          open
            ? 'cereda-table__columns-menu cereda-table__popover-root--open'
            : 'cereda-table__columns-menu'
        }
      >
        <Popover.Trigger asChild>
          <button
            type="button"
            className={
              open
                ? 'cereda-table__toolbar-button cereda-table__toolbar-button--columns cereda-table__toolbar-button--active'
                : 'cereda-table__toolbar-button cereda-table__toolbar-button--columns'
            }
            aria-label={locale.columns.buttonLabel}
            title={locale.columns.buttonLabel}
          >
            <Columns3
              className="cereda-table__toolbar-button-icon"
              aria-hidden="true"
            />
            <span className="cereda-table__toolbar-button-label">{locale.columns.buttonLabel}</span>
            {hiddenColumnCount > 0 || groupedColumnIds.length > 0 ? (
              <span
                className="cereda-table__toolbar-button-count"
                aria-hidden="true"
              >
                {hiddenColumnCount + groupedColumnIds.length}
              </span>
            ) : null}
          </button>
        </Popover.Trigger>

        {open ? (
          <>
            <Popover.Portal>
              <div
                className="cereda-table__popover-backdrop"
                onPointerDown={() => setOpen(false)}
                aria-hidden="true"
              />
            </Popover.Portal>
            <Popover.Portal>
            <Popover.Content
              role="menu"
              aria-label={locale.columns.panelAriaLabel}
              className="cereda-table__columns-menu-panel"
              sideOffset={8}
              align="end"
            >
            <div className="cereda-table__columns-menu-header">
              <div className="cereda-table__columns-menu-heading">
                <Columns3 aria-hidden="true" />
                <div>
                  <div className="cereda-table__columns-menu-title">{locale.columns.panelTitle}</div>
                  <div className="cereda-table__columns-menu-subtitle">
                    {locale.columns.visibleCount(visibleColumnCount)}
                    {hiddenColumnCount > 0 ? `, ${locale.columns.hiddenCount(hiddenColumnCount)}` : ''}
                    {groupedColumnIds.length > 0
                      ? `, ${locale.columns.groupedCount(groupedColumnIds.length)}`
                      : ''}
                  </div>
                </div>
              </div>
              <Popover.Close asChild>
                <button
                  type="button"
                  className="cereda-table__columns-menu-close"
                  aria-label={locale.columns.panelClose}
                  title={locale.columns.panelCloseTitle}
                >
                  <X aria-hidden="true" />
                </button>
              </Popover.Close>
            </div>

            <div className="cereda-table__columns-menu-overview" aria-label={locale.columns.summaryAriaLabel}>
              {enableColumnVisibility ? (
                <div className="cereda-table__columns-menu-stat">
                  <Eye aria-hidden="true" />
                  <span>{locale.columns.statVisible}</span>
                  <strong>{visibleColumnCount}</strong>
                </div>
              ) : null}
              {enableColumnOrdering ? (
                <div className="cereda-table__columns-menu-stat">
                  <GripVertical aria-hidden="true" />
                  <span>{locale.columns.statOrder}</span>
                  <strong>{leafColumns.length}</strong>
                </div>
              ) : null}
              {enableGrouping ? (
                <div className="cereda-table__columns-menu-stat">
                  <GitBranch aria-hidden="true" />
                  <span>{locale.columns.statGrouped}</span>
                  <strong>{groupedColumnIds.length}</strong>
                </div>
              ) : null}
            </div>

            <DataTableScrollArea
              className="cereda-table__scroll-area--columns-menu"
              viewportClassName="cereda-table__columns-menu-list"
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

            <div className="cereda-table__columns-menu-actions">
              <button
                type="button"
                className="cereda-table__columns-menu-action"
                onClick={handleReset}
              >
                <RotateCcw aria-hidden="true" />
                {locale.columns.reset}
              </button>
              {enableColumnOrdering ? (
                <button
                  type="button"
                  className="cereda-table__columns-menu-action cereda-table__columns-menu-action--secondary"
                  onClick={handleResetOrder}
                >
                  <RotateCcw aria-hidden="true" />
                  {locale.columns.resetOrder}
                </button>
              ) : null}
              {enableGrouping && hasGrouping ? (
                <button
                  type="button"
                  className="cereda-table__columns-menu-action cereda-table__columns-menu-action--secondary"
                  onClick={handleClearGrouping}
                >
                  {locale.columns.clearGrouping}
                </button>
              ) : null}
            </div>
            </Popover.Content>
            </Popover.Portal>
          </>
        ) : null}
      </div>
    </Popover.Root>
  );
}

function DataTableColumnsOrderingSection<TData extends object>({
  table,
  columns,
}: DataTableColumnsOrderingSectionProps<TData>) {
  const locale = useDataTableLocale();
  return (
    <div className="cereda-table__columns-menu-section">
      <div className="cereda-table__columns-menu-section-title">{locale.columns.orderSectionTitle}</div>
      {columns.length === 0 ? (
        <div className="cereda-table__columns-menu-empty">
          {locale.columns.noOrderableColumns}
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
  const locale = useDataTableLocale();
  return columns.length === 0 ? (
    <div className="cereda-table__columns-menu-empty">{locale.columns.noHidableColumns}</div>
  ) : (
    <div className="cereda-table__columns-menu-section">
      <div className="cereda-table__columns-menu-section-title">
        {locale.columns.visibilitySectionTitle}
      </div>
      {columns.map((column) => {
        const label = column.columnDef.meta?.label ?? column.id;
        const isVisible = userColumnVisibilityState[column.id] ?? true;
        const isGroupedSource = groupedColumnIds.includes(column.id);

        return (
          <DataTableCheckboxField
            key={column.id}
            className={
              isGroupedSource
                ? 'cereda-table__columns-menu-item cereda-table__columns-menu-item--grouped'
                : 'cereda-table__columns-menu-item'
            }
            checked={isVisible}
            onCheckedChange={() => column.toggleVisibility()}
            ariaDescribedBy={isGroupedSource ? `${column.id}-grouped-hint` : undefined}
            label={label}
            labelClassName="cereda-table__columns-menu-item-label"
          >
            {isGroupedSource ? (
              <span
                id={`${column.id}-grouped-hint`}
                className="cereda-table__columns-menu-item-badge"
                aria-hidden="true"
                title={locale.columns.groupedBadge}
              >
                {locale.columns.groupedBadge}
              </span>
            ) : null}
          </DataTableCheckboxField>
        );
      })}
    </div>
  );
}

