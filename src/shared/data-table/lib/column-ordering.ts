import type { ColumnDef, ColumnOrderState, Table } from '@tanstack/react-table';

import { isDataTableAutoGroupColumnId } from './auto-group-column';
import { isDataTableRowNumberColumnId } from './row-number-column';

function getLeafColumnDefId<TData extends object>(
  columnDef: ColumnDef<TData, unknown>,
): string | null {
  if ('id' in columnDef && typeof columnDef.id === 'string') {
    return columnDef.id;
  }

  if ('accessorKey' in columnDef && typeof columnDef.accessorKey === 'string') {
    return columnDef.accessorKey.replace(/\./g, '_');
  }

  if ('header' in columnDef && typeof columnDef.header === 'string') {
    return columnDef.header;
  }

  return null;
}

function isGroupColumnDef<TData extends object>(
  columnDef: ColumnDef<TData, unknown>,
): columnDef is ColumnDef<TData, unknown> & {
  columns: ColumnDef<TData, unknown>[];
} {
  return 'columns' in columnDef && Array.isArray(columnDef.columns);
}

function normalizeColumnOrder(order: ColumnOrderState): ColumnOrderState {
  const normalized: ColumnOrderState = [];
  const seen = new Set<string>();

  for (const columnId of order) {
    if (seen.has(columnId)) {
      continue;
    }

    seen.add(columnId);
    normalized.push(columnId);
  }

  return normalized;
}

export function getDefaultColumnOrderFromColumns<TData extends object>(
  columns: ColumnDef<TData, unknown>[],
): ColumnOrderState {
  const order: ColumnOrderState = [];

  for (const columnDef of columns) {
    if (isGroupColumnDef(columnDef)) {
      order.push(...getDefaultColumnOrderFromColumns(columnDef.columns));
      continue;
    }

    const columnId = getLeafColumnDefId(columnDef);
    if (columnId && !isDataTableAutoGroupColumnId(columnId) && !isDataTableRowNumberColumnId(columnId)) {
      order.push(columnId);
    }
  }

  return order;
}

export function getDefaultColumnOrder<TData extends object>(
  table: Table<TData>,
): ColumnOrderState {
  const initialColumnOrder = table.initialState.columnOrder;
  if (Array.isArray(initialColumnOrder) && initialColumnOrder.length > 0) {
    return initialColumnOrder.filter(
      (columnId) => !isDataTableAutoGroupColumnId(columnId) && !isDataTableRowNumberColumnId(columnId),
    );
  }

  return table
    .getAllLeafColumns()
    .map((column) => column.id)
    .filter((columnId) => !isDataTableAutoGroupColumnId(columnId) && !isDataTableRowNumberColumnId(columnId));
}

export function resetColumnOrder<TData extends object>(table: Table<TData>) {
  table.setColumnOrder(getDefaultColumnOrder(table));
}

export function getVisibleColumnOrder(
  order: ColumnOrderState,
  visibleColumnIds: readonly string[],
): ColumnOrderState {
  const normalizedOrder = normalizeColumnOrder(order);
  const visibleColumnIdSet = new Set(visibleColumnIds);

  return normalizedOrder.filter((columnId) => visibleColumnIdSet.has(columnId));
}

export function reorderColumnIdsByTargetIndex(
  order: ColumnOrderState,
  activeId: string,
  overId: string,
): ColumnOrderState {
  const normalizedOrder = normalizeColumnOrder(order);
  const activeIndex = normalizedOrder.indexOf(activeId);
  const overIndex = normalizedOrder.indexOf(overId);

  if (activeIndex < 0 || overIndex < 0 || activeIndex === overIndex) {
    return order;
  }

  const nextOrder = [...normalizedOrder];
  const [activeColumnId] = nextOrder.splice(activeIndex, 1);

  if (!activeColumnId) {
    return order;
  }

  nextOrder.splice(overIndex, 0, activeColumnId);

  return nextOrder;
}

export function mergeVisibleColumnOrderIntoFullOrder(
  order: ColumnOrderState,
  visibleOrder: ColumnOrderState,
): ColumnOrderState {
  const normalizedOrder = normalizeColumnOrder(order);
  const normalizedVisibleOrder = normalizeColumnOrder(visibleOrder);
  const visibleColumnIdSet = new Set(normalizedVisibleOrder);
  const visibleIndexes: number[] = [];

  normalizedOrder.forEach((columnId, index) => {
    if (visibleColumnIdSet.has(columnId)) {
      visibleIndexes.push(index);
    }
  });

  if (visibleIndexes.length !== normalizedVisibleOrder.length) {
    return order;
  }

  if (visibleIndexes.length === 0) {
    return order;
  }

  const nextOrder = [...normalizedOrder];

  visibleIndexes.forEach((index, position) => {
    const nextColumnId = normalizedVisibleOrder[position];
    if (nextColumnId) {
      nextOrder[index] = nextColumnId;
    }
  });

  return nextOrder;
}

export function reorderVisibleColumnIds(
  order: ColumnOrderState,
  activeId: string,
  overId: string,
): ColumnOrderState {
  return reorderColumnIdsByTargetIndex(order, activeId, overId);
}

export function getPreviewColumnOrderFromVisibleColumns(
  order: ColumnOrderState,
  visibleColumnIds: readonly string[],
  activeId: string,
  overId: string,
  placement: 'before' | 'after' = 'before',
): ColumnOrderState {
  const visibleOrder = getVisibleColumnOrder(order, visibleColumnIds);
  const reorderedVisibleOrder = reorderColumnIds(visibleOrder, activeId, overId, placement);
  return mergeVisibleColumnOrderIntoFullOrder(order, reorderedVisibleOrder);
}

export function reorderColumnIds(
  order: ColumnOrderState,
  activeId: string,
  overId: string,
  placement: 'before' | 'after' = 'before',
): ColumnOrderState {
  const normalizedOrder = normalizeColumnOrder(order);
  const activeIndex = normalizedOrder.indexOf(activeId);
  const overIndex = normalizedOrder.indexOf(overId);

  if (activeIndex < 0 || overIndex < 0 || activeIndex === overIndex) {
    return order;
  }

  const nextOrder = [...normalizedOrder];
  const [activeColumnId] = nextOrder.splice(activeIndex, 1);
  const targetIndex = nextOrder.indexOf(overId);

  if (targetIndex < 0) {
    return order;
  }

  const insertIndex = placement === 'after' ? targetIndex + 1 : targetIndex;
  nextOrder.splice(insertIndex, 0, activeColumnId);
  return nextOrder;
}

export function moveColumnId(
  order: ColumnOrderState,
  columnId: string,
  direction: 'left' | 'right',
): ColumnOrderState {
  const normalizedOrder = normalizeColumnOrder(order);
  const currentIndex = normalizedOrder.indexOf(columnId);
  if (currentIndex < 0) {
    return order;
  }

  if (direction === 'left') {
    const targetIndex = currentIndex - 1;
    if (targetIndex < 0) {
      return order;
    }

    return reorderColumnIds(normalizedOrder, columnId, normalizedOrder[targetIndex]);
  }

  if (currentIndex >= normalizedOrder.length - 1) {
    return order;
  }

  const nextOrder = [...normalizedOrder];
  const [activeColumnId] = nextOrder.splice(currentIndex, 1);
  nextOrder.splice(currentIndex + 1, 0, activeColumnId);
  return nextOrder;
}
