import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { flexRender, type Header } from '@tanstack/react-table';
import { GripVertical, Layers } from 'lucide-react';
import { type MouseEvent, type TouchEvent } from 'react';

import { isDataTableAutoGroupColumnId } from '../lib/auto-group-column';
import { getColumnSizeStyle } from '../lib/column-sizing';
import { createDataTableDndData, getColumnHeaderDndId } from '../lib/data-table-dnd';
import { isDataTableRowNumberColumnId } from '../lib/row-number-column';
import { DataTableAutoGroupHeaderCell } from './data-table-auto-group-header-cell';
import { useDataTableHeaderDragPreview } from './data-table-header-drag-preview-context';
import { useDataTableLocale } from './data-table-locale-context';
import { DataTableSortIcon } from './data-table-sort-icon';

type DataTableSortState = 'none' | 'asc' | 'desc';

interface DataTableHeaderCellProps<TData extends object> {
  header: Header<TData, unknown>;
  enableColumnResizing?: boolean;
  enableColumnOrdering?: boolean;
}

function getSortState<TData extends object>(
  header: Header<TData, unknown>,
): DataTableSortState {
  const sorted = header.column.getIsSorted();
  if (sorted === 'asc') return 'asc';
  if (sorted === 'desc') return 'desc';
  return 'none';
}

export function DataTableHeaderCell<TData extends object>({
  header,
  enableColumnResizing,
  enableColumnOrdering,
}: DataTableHeaderCellProps<TData>) {
  const locale = useDataTableLocale();

  if (isDataTableAutoGroupColumnId(header.column.id)) {
    return (
      <DataTableAutoGroupHeaderCell
        header={header}
        enableColumnResizing={enableColumnResizing}
      />
    );
  }

  if (isDataTableRowNumberColumnId(header.column.id)) {
    return (
      <th
        key={header.id}
        className="cereda-table__th cereda-table__row-number-th"
        style={getColumnSizeStyle(48, 48, 48)}
        data-column-id={header.column.id}
        aria-label={locale.columnHeader.rowNumberAriaLabel}
      />
    );
  }

  return (
    <DataTableSortableHeaderCell
      header={header}
      enableColumnResizing={enableColumnResizing}
      enableColumnOrdering={enableColumnOrdering}
    />
  );
}

function DataTableSortableHeaderCell<TData extends object>({
  header,
  enableColumnResizing,
  enableColumnOrdering,
}: DataTableHeaderCellProps<TData>) {
  const locale = useDataTableLocale();
  const headerDragPreview = useDataTableHeaderDragPreview();
  const isPlaceholder = header.isPlaceholder;
  const canSort = header.column.getCanSort();
  const sortState = getSortState(header);
  const canResize = enableColumnResizing === true && header.column.getCanResize();
  const isResizing = header.column.getIsResizing();
  const canReorder = enableColumnOrdering === true;
  const headerContent = flexRender(header.column.columnDef.header, header.getContext());
  const label =
    header.column.columnDef.meta?.label ??
    (typeof header.column.columnDef.header === 'string'
      ? header.column.columnDef.header
      : header.column.id);
  const isGroupable =
    header.column.getCanGroup() &&
    header.column.columnDef.meta?.enableGrouping !== false;

  const sortLabel = canSort
    ? sortState === 'asc'
      ? locale.columnHeader.sortDescendingAriaLabel(label)
      : sortState === 'desc'
        ? locale.columnHeader.clearSortAriaLabel(label)
        : locale.columnHeader.sortAscendingAriaLabel(label)
    : label;
  const resizeLabel = locale.columnHeader.resizeAriaLabel(label);

  const resizeHandler = header.getResizeHandler();

  function handleResizeStart(event: MouseEvent | TouchEvent) {
    event.preventDefault();
    event.stopPropagation();
    resizeHandler(event);
  }

  const style = {
    ...getColumnSizeStyle(
      header.getSize(),
      header.column.columnDef.minSize,
      header.column.columnDef.maxSize,
      label,
    ),
  };

  const { attributes, listeners, setActivatorNodeRef, setNodeRef, transform, transition, isDragging } =
    useSortable({
      id: getColumnHeaderDndId(header.column.id),
      data: createDataTableDndData(
        'column-header',
        header.column.id,
        header.column.getCanGroup() && header.column.columnDef.meta?.enableGrouping !== false,
        label,
      ),
      disabled: isPlaceholder || !canReorder,
    });

  style.transform = headerDragPreview?.isHeaderDragActive ? undefined : CSS.Transform.toString(transform);
  style.transition = transition;

  const thClassName = isDragging
    ? 'cereda-table__th cereda-table__header-cell cereda-table__header-cell--dragging'
    : 'cereda-table__th cereda-table__header-cell';

  if (isPlaceholder) {
    return (
      <th
        ref={setNodeRef}
        key={header.id}
        colSpan={header.colSpan}
        className="cereda-table__th cereda-table__header-cell"
        style={style}
        data-column-id={header.column.id}
      />
    );
  }

  return (
    <th
      ref={setNodeRef}
      key={header.id}
      colSpan={header.colSpan}
      className={thClassName}
      style={style}
      data-column-id={header.column.id}
      data-resizing={isResizing || undefined}
      aria-sort={
        sortState === 'asc'
          ? 'ascending'
          : sortState === 'desc'
            ? 'descending'
            : canSort
              ? 'none'
              : undefined
      }
    >
      {headerDragPreview?.marker?.columnId === header.column.id ? (
        <div
          className={
            headerDragPreview.marker.placement === 'before'
              ? 'cereda-table__header-insertion-marker cereda-table__header-insertion-marker--before'
              : 'cereda-table__header-insertion-marker cereda-table__header-insertion-marker--after'
          }
          data-placement={headerDragPreview.marker.placement}
          aria-hidden="true"
        />
      ) : null}

      {/* Entire header-main is the drag activator when reordering is enabled */}
      <div
        className="cereda-table__header-main"
        ref={canReorder ? setActivatorNodeRef : undefined}
        data-reorderable={canReorder || undefined}
        {...(canReorder ? { ...attributes, ...listeners } : {})}
        aria-label={canReorder ? locale.columnHeader.dragAriaLabel(label) : undefined}
      >
        {/* Drag affordance icon — visual only, not interactive */}
        {canReorder ? (
          <span className="cereda-table__column-header-drag-handle" aria-hidden="true">
            <GripVertical className="cereda-table__column-header-drag-handle-icon" />
          </span>
        ) : null}

        {/* Sort button — click only */}
        {canSort ? (
          <button
            type="button"
            className="cereda-table__header-main-surface cereda-table__header-main-surface--sortable"
            onClick={header.column.getToggleSortingHandler()}
            aria-label={sortLabel}
            title={sortLabel}
            aria-pressed={sortState !== 'none'}
            data-sort-state={sortState}
          >
            <span className="cereda-table__header-label">{headerContent}</span>
            <DataTableSortIcon state={sortState} />
          </button>
        ) : (
          <div className="cereda-table__header-main-surface cereda-table__header-main-surface--static">
            <span className="cereda-table__header-label">{headerContent}</span>
          </div>
        )}

        {isGroupable ? (
          <span
            className="cereda-table__header-groupable-indicator"
            title={locale.columnHeader.canBeGroupedTitle}
            aria-hidden="true"
          >
            <Layers className="cereda-table__header-groupable-indicator-icon" aria-hidden="true" />
          </span>
        ) : null}

        {canResize ? (
          <button
            type="button"
            className={`cereda-table__column-resize-handle${isResizing ? ' cereda-table__column-resize-handle--resizing' : ''}`}
            onPointerDownCapture={(e) => e.stopPropagation()}
            onMouseDown={handleResizeStart}
            onTouchStart={handleResizeStart}
            aria-label={resizeLabel}
            title={resizeLabel}
          />
        ) : null}
      </div>
    </th>
  );
}

