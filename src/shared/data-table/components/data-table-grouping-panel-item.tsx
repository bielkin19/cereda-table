import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Column } from '@tanstack/react-table';
import { ArrowDown, ArrowUp, ArrowUpDown, CircleX, Grip } from 'lucide-react';
import { type CSSProperties, type MouseEvent, type PointerEvent, useRef } from 'react';

import {
  createDataTableDndData,
  getGroupingPanelDndId,
} from '../lib/data-table-dnd';
import { useDataTableGroupingDragPreview } from './data-table-grouping-drag-preview-context';
import { useDataTableLocale } from './data-table-locale-context';

interface DataTableGroupingPanelItemProps<TData extends object> {
  column: Column<TData, unknown>;
  index: number;
  total: number;
  onRemove: () => void;
}

export function DataTableGroupingPanelItem<TData extends object>({
  column,
  index,
  total,
  onRemove,
}: DataTableGroupingPanelItemProps<TData>) {
  const locale = useDataTableLocale();
  const label = column.columnDef.meta?.label ?? column.id;
  const groupingDragPreview = useDataTableGroupingDragPreview();
  const {
    attributes,
    listeners,
    setActivatorNodeRef,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: getGroupingPanelDndId(column.id),
    data: createDataTableDndData('grouping-panel', column.id, undefined, label),
  });
  const sortState = column.getIsSorted();
  const canSort = column.getCanSort();
  const sortButtonLabel =
    sortState === 'asc'
      ? locale.groupingPanel.sortDescendingAriaLabel(label)
      : sortState === 'desc'
        ? locale.groupingPanel.clearSortAriaLabel(label)
        : locale.groupingPanel.sortAscendingAriaLabel(label);
  const SortIcon =
    sortState === 'asc' ? ArrowUp : sortState === 'desc' ? ArrowDown : ArrowUpDown;

  const handleToggleSort = () => {
    column.toggleSorting(undefined, true);
  };

  const dragStartPointRef = useRef<{ x: number; y: number } | null>(null);
  const suppressNextSortClickRef = useRef(false);
  const dragActivationThreshold = 6;

  const handleBodyPointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    dragStartPointRef.current = {
      x: event.clientX,
      y: event.clientY,
    };
    suppressNextSortClickRef.current = false;
    const onPointerDown = listeners?.onPointerDown as
      | ((pointerEvent: PointerEvent<HTMLButtonElement>) => void)
      | undefined;

    onPointerDown?.(event);
  };

  const handleBodyPointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    const startPoint = dragStartPointRef.current;

    if (!startPoint || suppressNextSortClickRef.current) {
      return;
    }

    const deltaX = event.clientX - startPoint.x;
    const deltaY = event.clientY - startPoint.y;

    if (Math.hypot(deltaX, deltaY) >= dragActivationThreshold) {
      suppressNextSortClickRef.current = true;
    }
  };

  const handleBodyPointerUp = () => {
    dragStartPointRef.current = null;
  };

  const handleBodyPointerCancel = () => {
    dragStartPointRef.current = null;
    suppressNextSortClickRef.current = false;
  };

  const handleBodyClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (suppressNextSortClickRef.current || isDragging) {
      event.preventDefault();
      event.stopPropagation();
      suppressNextSortClickRef.current = false;
      return;
    }

    handleToggleSort();
  };

  const style: CSSProperties = {
    transform:
      groupingDragPreview?.isGroupingDragActive === true
        ? undefined
        : CSS.Transform.toString(transform),
    transition,
  };

  const dragLabel = locale.groupingPanel.dragAriaLabel(label);
  const removeLabel = locale.groupingPanel.removeAriaLabel(label);

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={
        isDragging
          ? 'data-table__grouping-pill data-table__grouping-pill--dragging'
          : 'data-table__grouping-pill'
      }
      data-dragging={isDragging || undefined}
      aria-label={locale.groupingPanel.itemAriaLabel(label, index + 1, total)}
      aria-posinset={index + 1}
      aria-setsize={total}
    >
      <span className="data-table__grouping-pill-chip">
        <button
          type="button"
          ref={setActivatorNodeRef}
          className="data-table__grouping-pill-handle"
          aria-label={dragLabel}
          title={dragLabel}
          {...attributes}
          {...listeners}
        >
          <Grip
            className="data-table__grouping-pill-handle-icon"
            aria-hidden="true"
          />
        </button>

        {canSort ? (
          <button
            type="button"
            className="data-table__grouping-pill-body"
            onPointerDown={handleBodyPointerDown}
            onPointerMove={handleBodyPointerMove}
            onPointerUp={handleBodyPointerUp}
            onPointerCancel={handleBodyPointerCancel}
            onClick={handleBodyClick}
            aria-label={sortButtonLabel}
            aria-pressed={sortState !== false}
            data-sort-state={sortState || 'none'}
            title={sortButtonLabel}
          >
            <span className="data-table__grouping-pill-label">{label}</span>
            <SortIcon className="data-table__grouping-pill-sort-icon" aria-hidden="true" />
          </button>
        ) : (
          <span className="data-table__grouping-pill-body data-table__grouping-pill-body--static">
            <span className="data-table__grouping-pill-label">{label}</span>
          </span>
        )}

        <button
          type="button"
          className="data-table__grouping-pill-remove"
          onClick={onRemove}
          onPointerDown={(event) => {
            event.stopPropagation();
          }}
          aria-label={removeLabel}
          title={removeLabel}
        >
          <CircleX aria-hidden="true" />
        </button>
      </span>
    </li>
  );
}
