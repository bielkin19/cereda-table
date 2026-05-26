import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Column } from '@tanstack/react-table';
import { ArrowLeft, ArrowRight, GripVertical } from 'lucide-react';
import type { CSSProperties } from 'react';

import {
  createDataTableDndData,
  getColumnOrderDndId,
} from '../lib/data-table-dnd';
import { useDataTableLocale } from './data-table-locale-context';

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
  const locale = useDataTableLocale();
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

  const groupableLabel = isGroupable ? locale.columnOrder.canBeGroupedLabel : locale.columnOrder.moveOnlyLabel;

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
        aria-label={locale.columnOrder.dragAriaLabel(label)}
        title={locale.columnOrder.dragAriaLabel(label)}
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
        aria-label={groupableLabel}
        title={groupableLabel}
      >
        {groupableLabel}
      </span>

      <div className="data-table__column-order-actions">
        <button
          type="button"
          className="data-table__column-order-action"
          onClick={onMoveLeft}
          disabled={isFirst}
          aria-label={locale.columnOrder.moveLeftAriaLabel(label)}
        >
          <ArrowLeft aria-hidden="true" />
          {locale.columnOrder.leftLabel}
        </button>
        <button
          type="button"
          className="data-table__column-order-action"
          onClick={onMoveRight}
          disabled={isLast}
          aria-label={locale.columnOrder.moveRightAriaLabel(label)}
        >
          {locale.columnOrder.rightLabel}
          <ArrowRight aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
