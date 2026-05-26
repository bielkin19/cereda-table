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
import { useDataTableLocale } from './data-table-locale-context';

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
  const locale = useDataTableLocale();
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
    <div className="cereda-table__columns-menu-empty">{locale.groupingSection.noGroupableColumns}</div>
  ) : (
    <div className="cereda-table__columns-menu-section">
      <div className="cereda-table__columns-menu-section-title">{locale.groupingSection.sectionTitle}</div>
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
  const locale = useDataTableLocale();
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
            ? 'cereda-table__columns-menu-group-item cereda-table__columns-menu-group-item--grouped cereda-table__columns-menu-group-item--dragging'
            : 'cereda-table__columns-menu-group-item cereda-table__columns-menu-group-item--dragging'
          : isGrouped
            ? 'cereda-table__columns-menu-group-item cereda-table__columns-menu-group-item--grouped'
            : 'cereda-table__columns-menu-group-item'
      }
    >
      <button
        ref={setActivatorNodeRef}
        type="button"
        className="cereda-table__columns-menu-group-drag-handle"
        aria-label={locale.groupingSection.dragAriaLabel(label)}
        title={locale.groupingSection.dragAriaLabel(label)}
        {...attributes}
        {...listeners}
      >
        <GripVertical
          className="cereda-table__columns-menu-group-drag-handle-icon"
          aria-hidden="true"
        />
      </button>

      <div className="cereda-table__columns-menu-group-labels">
        <span className="cereda-table__columns-menu-group-label">{label}</span>
        {isGrouped ? (
          <span className="cereda-table__columns-menu-group-badge">{locale.groupingSection.groupedBadge}</span>
        ) : null}
      </div>

      <button
        type="button"
        className="cereda-table__columns-menu-action"
        onClick={onToggleGrouping}
        onPointerDown={(event) => {
          event.stopPropagation();
        }}
        aria-label={isGrouped ? locale.groupingSection.ungroupAriaLabel(label) : locale.groupingSection.groupAriaLabel(label)}
        aria-pressed={isGrouped}
      >
        {isGrouped ? <Minus aria-hidden="true" /> : <Plus aria-hidden="true" />}
        {isGrouped ? locale.groupingSection.ungroupLabel : locale.groupingSection.groupLabel}
      </button>
    </div>
  );
}

