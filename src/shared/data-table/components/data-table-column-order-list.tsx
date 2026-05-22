import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import type { Column, Table } from '@tanstack/react-table';

import { moveColumnId } from '../lib/column-ordering';
import { getColumnOrderDndId } from '../lib/data-table-dnd';
import { DataTableColumnOrderItem } from './data-table-column-order-item';

interface DataTableColumnOrderListProps<TData extends object> {
  table: Table<TData>;
  columns: Array<Column<TData, unknown>>;
}

export function DataTableColumnOrderList<TData extends object>({
  table,
  columns,
}: DataTableColumnOrderListProps<TData>) {
  const columnIds = columns.map((column) => column.id);
  const sortableIds = columnIds.map(getColumnOrderDndId);

  return (
    <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
      <div className="data-table__column-order-list">
        {columns.map((column, index) => (
          <DataTableColumnOrderItem
            key={column.id}
            column={column}
            index={index}
            total={columns.length}
            onMoveLeft={() =>
              table.setColumnOrder(moveColumnId(columnIds, column.id, 'left'))
            }
            onMoveRight={() =>
              table.setColumnOrder(moveColumnId(columnIds, column.id, 'right'))
            }
          />
        ))}
      </div>
    </SortableContext>
  );
}
