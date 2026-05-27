import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { flexRender, type Header } from '@tanstack/react-table';
import { GripVertical, Layers } from 'lucide-react';
import { type MouseEvent, type TouchEvent, useRef } from 'react';
import { flushSync } from 'react-dom';

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
  // Without column.id fallback: empty string means "no text label" (icon-only / blank header).
  const resolvedLabel =
    header.column.columnDef.meta?.label ??
    (typeof header.column.columnDef.header === 'string'
      ? header.column.columnDef.header
      : '');
  const hasLabel = resolvedLabel.trim().length > 0;
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
  const autoFitLabel = locale.columnHeader.autoFitAriaLabel(label);

  const resizeHandler = header.getResizeHandler();
  const thRef = useRef<HTMLTableCellElement | null>(null);

  function handleResizeStart(event: MouseEvent | TouchEvent) {
    event.preventDefault();
    event.stopPropagation();

    // Fill columns (no maxSize) are sized by table-layout:fixed distribution so
    // their visual width can differ greatly from TanStack's reported getSize()
    // which returns columnDef.size (the default).  If we let TanStack start
    // delta-tracking from that default the column jumps on the first tick and
    // can't be shrunk meaningfully.
    //
    // Fix: read the actual rendered width from the <th> DOM node and pre-seed
    // columnSizing synchronously before the resize handler fires.  TanStack will
    // then anchor its delta from the real visual baseline.
    if (thRef.current && header.column.columnDef.maxSize === undefined) {
      const visualWidth = Math.round(thRef.current.getBoundingClientRect().width);
      if (visualWidth !== header.column.getSize()) {
        flushSync(() => {
          header.getContext().table.setColumnSizing((prev) => ({
            ...prev,
            [header.column.id]: visualWidth,
          }));
        });
      }
    }

    resizeHandler(event);
  }

  function handleResizeDoubleClick(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();

    const table = header.getContext().table;
    const columnId = header.column.id;

    // Measure the natural content width of each rendered cell for this column.
    // For header cells the inner `header-main` flex container tracks the real
    // content width (the <th> itself is constrained by table-layout:fixed).
    // For body cells we use the scrollWidth of the <td> or its first child.
    const cells = Array.from(
      document.querySelectorAll<HTMLElement>(`[data-column-id="${columnId}"]`),
    );

    let maxContentWidth = 0;
    for (const cell of cells) {
      if (cell.tagName === 'TH') {
        // Header: measure the inner flex container which holds real content
        const headerMain = cell.querySelector<HTMLElement>('.cereda-table__header-main');
        if (headerMain) {
          maxContentWidth = Math.max(maxContentWidth, headerMain.scrollWidth);
        }
      } else {
        // Body cell: scrollWidth reflects actual content width even under
        // table-layout:fixed when content is wider than the column.
        const inner = cell.firstElementChild as HTMLElement | null;
        const measured = inner
          ? inner.scrollWidth + (cell.clientWidth - inner.clientWidth) // add padding diff
          : cell.scrollWidth;
        maxContentWidth = Math.max(maxContentWidth, measured);
      }
    }

    if (maxContentWidth <= 0) return;

    const minSize = header.column.columnDef.minSize ?? 0;
    const colMaxSize = header.column.columnDef.maxSize;
    const clampedSize =
      colMaxSize !== undefined
        ? Math.max(minSize, Math.min(colMaxSize, maxContentWidth))
        : Math.max(minSize, maxContentWidth);

    flushSync(() => {
      table.setColumnSizing((prev) => ({ ...prev, [columnId]: clampedSize }));
    });
  }

  // For fill columns (no maxSize): apply an explicit CSS width whenever the
  // column has been touched by the user — either it's currently being dragged
  // (isResizing) or it already has an entry in the table's columnSizing state.
  //
  // We deliberately avoid comparing currentSize to columnDef.size as a proxy
  // for "has been resized", because applyDataTableSizingDefaultsToColumns can
  // bump a column's size up to its auto-derived minSize — making the two equal
  // even after the user resizes to that minimum — which would incorrectly drop
  // the column back into fill mode and cause a visual jump on mouse-up.
  const currentSize = header.getSize();
  const columnMaxSize = header.column.columnDef.maxSize;
  const columnSizingState = header.getContext().table.getState().columnSizing;
  const isExplicitlySized = header.column.id in columnSizingState;
  const effectiveMaxSize =
    columnMaxSize !== undefined
      ? columnMaxSize
      : isResizing || isExplicitlySized
        ? currentSize
        : undefined;

  const style = {
    ...getColumnSizeStyle(
      currentSize,
      header.column.columnDef.minSize,
      effectiveMaxSize,
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
      disabled: isPlaceholder || !canReorder || !hasLabel,
    });

  style.transform = headerDragPreview?.isHeaderDragActive ? undefined : CSS.Transform.toString(transform);
  style.transition = transition;

  const thClassName = isDragging
    ? 'cereda-table__th cereda-table__header-cell cereda-table__header-cell--dragging'
    : 'cereda-table__th cereda-table__header-cell';

  // Combined ref: forwards to both useSortable's setNodeRef and our local thRef
  // so measurements can be taken on the <th> element directly.
  function setThRef(node: HTMLTableCellElement | null) {
    setNodeRef(node);
    thRef.current = node;
  }

  if (isPlaceholder) {
    return (
      <th
        ref={setThRef}
        key={header.id}
        colSpan={header.colSpan}
        className="cereda-table__th cereda-table__header-cell"
        style={style}
        data-column-id={header.column.id}
      />
    );
  }

  if (!hasLabel) {
    return (
      <th
        ref={setThRef}
        key={header.id}
        colSpan={header.colSpan}
        className="cereda-table__th cereda-table__header-cell"
        style={style}
        data-column-id={header.column.id}
        data-resizing={isResizing || undefined}
      >
        {canResize ? (
          <button
            type="button"
            className={`cereda-table__column-resize-handle${isResizing ? ' cereda-table__column-resize-handle--resizing' : ''}`}
            onPointerDownCapture={(e) => e.stopPropagation()}
            onMouseDown={handleResizeStart}
            onTouchStart={handleResizeStart}
            onDoubleClick={handleResizeDoubleClick}
            aria-label={resizeLabel}
            title={autoFitLabel}
          />
        ) : null}
      </th>
    );
  }

  return (
    <th
      ref={setThRef}
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
            onDoubleClick={handleResizeDoubleClick}
            aria-label={resizeLabel}
            title={autoFitLabel}
          />
        ) : null}
      </div>
    </th>
  );
}

