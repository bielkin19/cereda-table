import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Column } from '@tanstack/react-table';
import { ArrowLeft, ArrowRight, GripVertical } from 'lucide-react';
import type { CSSProperties } from 'react';

import {
  createDataTableDndData,
  getColumnOrderDndId,
} from '../lib/data-table-dnd';

interface DataTableColumnOrderItemProps<TData extends object> {
  column: Column<TData, unknown>;
  index: number;
  total: number;
  onMoveLeft: () => void;
  onMoveRight: () => void;
}

export function DataTableColumnOrderItem<TData extends object>({
  column,
  index,
  total,
  onMoveLeft,
  onMoveRight,
}: DataTableColumnOrderItemProps<TData>) {
  const label = column.columnDef.meta?.label ?? column.id;
  const isGroupable = column.getCanGroup() && column.columnDef.meta?.enableGrouping !== false;
  const {
    attributes,
    listeners,
    setActivatorNodeRef,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: getColumnOrderDndId(column.id),
    data: createDataTableDndData('column-order', column.id, undefined, label),
  });

  const isFirst = index <= 0;
  const isLast = index >= total - 1 && total > 0;

  const style: CSSProperties = {
    transform: isDragging ? undefined : CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={
        isDragging
          ? 'data-table__column-order-item data-table__column-order-item--dragging'
          : 'data-table__column-order-item'
      }
    >
      <button
        type="button"
        ref={setActivatorNodeRef}
        className="data-table__column-order-drag-handle"
        aria-label={`Drag ${label} to reorder`}
        title={`Drag ${label} to reorder`}
        {...attributes}
        {...listeners}
      >
        <GripVertical
          className="data-table__column-order-drag-handle-icon"
          aria-hidden="true"
        />
      </button>

      <span className="data-table__column-order-label">{label}</span>
      <span
        className={
          isGroupable
            ? 'data-table__column-order-capability data-table__column-order-capability--groupable'
            : 'data-table__column-order-capability data-table__column-order-capability--move-only'
        }
        role="img"
        aria-label={isGroupable ? 'Can be grouped' : 'Move only'}
        title={isGroupable ? 'Can be grouped' : 'Move only'}
      >
        {isGroupable ? 'Group' : 'Move only'}
      </span>

      <div className="data-table__column-order-actions">
        <button
          type="button"
          className="data-table__column-order-action"
          onClick={onMoveLeft}
          disabled={isFirst}
          aria-label={`Move ${label} left`}
        >
          <ArrowLeft aria-hidden="true" />
          Left
        </button>
        <button
          type="button"
          className="data-table__column-order-action"
          onClick={onMoveRight}
          disabled={isLast}
          aria-label={`Move ${label} right`}
        >
          Right
          <ArrowRight aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}



