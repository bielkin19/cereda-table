import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Column, Table } from '@tanstack/react-table';
import { GripVertical, Minus, Plus } from 'lucide-react';
import type { CSSProperties } from 'react';

import {
  createDataTableDndData,
  getGroupingMenuDndId,
} from '../lib/data-table-dnd';
import { normalizeGroupingIds } from '../lib/grouping-ordering';

interface DataTableColumnsGroupingSectionProps<TData extends object> {
  table: Table<TData>;
  columns: Array<Column<TData, unknown>>;
}

function canGroupColumn<TData extends object>(column: Column<TData, unknown>) {
  return column.getCanGroup() && column.columnDef.meta?.enableGrouping !== false;
}

export function DataTableColumnsGroupingSection<TData extends object>({
  table,
  columns,
}: DataTableColumnsGroupingSectionProps<TData>) {
  const groupableColumns = columns.filter(canGroupColumn);
  const groupedIds = normalizeGroupingIds(table.getState().grouping);
  const groupedColumns = groupedIds
    .map((groupId) => groupableColumns.find((column) => column.id === groupId))
    .filter((column): column is Column<TData, unknown> => column !== undefined);
  const ungroupedColumns = groupableColumns.filter(
    (column) => !groupedIds.includes(column.id),
  );
  const orderedColumns = [...groupedColumns, ...ungroupedColumns];

  return groupableColumns.length === 0 ? (
    <div className="data-table__columns-menu-empty">No columns can be grouped.</div>
  ) : (
    <div className="data-table__columns-menu-section">
      <div className="data-table__columns-menu-section-title">Grouping</div>
      {orderedColumns.map((column) => (
        <DataTableColumnsGroupingItem
          key={column.id}
          column={column}
          isGrouped={column.getIsGrouped()}
          onToggleGrouping={() => column.toggleGrouping()}
        />
      ))}
    </div>
  );
}

interface DataTableColumnsGroupingItemProps<TData extends object> {
  column: Column<TData, unknown>;
  isGrouped: boolean;
  onToggleGrouping: () => void;
}

function DataTableColumnsGroupingItem<TData extends object>({
  column,
  isGrouped,
  onToggleGrouping,
}: DataTableColumnsGroupingItemProps<TData>) {
  const label = column.columnDef.meta?.label ?? column.id;
  const {
    attributes,
    listeners,
    setActivatorNodeRef,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: getGroupingMenuDndId(column.id),
    data: createDataTableDndData('grouping-menu', column.id, true, label),
  });

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
          ? isGrouped
            ? 'data-table__columns-menu-group-item data-table__columns-menu-group-item--grouped data-table__columns-menu-group-item--dragging'
            : 'data-table__columns-menu-group-item data-table__columns-menu-group-item--dragging'
          : isGrouped
            ? 'data-table__columns-menu-group-item data-table__columns-menu-group-item--grouped'
            : 'data-table__columns-menu-group-item'
      }
    >
      <button
        ref={setActivatorNodeRef}
        type="button"
        className="data-table__columns-menu-group-drag-handle"
        aria-label={`Drag ${label} to grouping panel`}
        title={`Drag ${label} to grouping panel`}
        {...attributes}
        {...listeners}
      >
        <GripVertical
          className="data-table__columns-menu-group-drag-handle-icon"
          aria-hidden="true"
        />
      </button>

      <div className="data-table__columns-menu-group-labels">
        <span className="data-table__columns-menu-group-label">{label}</span>
        {isGrouped ? (
          <span className="data-table__columns-menu-group-badge">Grouped</span>
        ) : null}
      </div>

      <button
        type="button"
        className="data-table__columns-menu-action"
        onClick={onToggleGrouping}
        onPointerDown={(event) => {
          event.stopPropagation();
        }}
        aria-label={`${isGrouped ? 'Ungroup' : 'Group'} ${label}`}
        aria-pressed={isGrouped}
      >
        {isGrouped ? <Minus aria-hidden="true" /> : <Plus aria-hidden="true" />}
        {isGrouped ? 'Ungroup' : 'Group'}
      </button>
    </div>
  );
}



