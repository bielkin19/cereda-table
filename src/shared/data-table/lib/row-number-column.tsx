import type { ColumnDef } from '@tanstack/react-table';

export const DATA_TABLE_ROW_NUMBER_COLUMN_ID = '__row_number__';

export function isDataTableRowNumberColumnId(columnId: string): boolean {
  return columnId === DATA_TABLE_ROW_NUMBER_COLUMN_ID;
}

export function createDataTableRowNumberColumn<TData extends object>(): ColumnDef<TData, unknown> {
  return {
    id: DATA_TABLE_ROW_NUMBER_COLUMN_ID,
    header: '#',
    size: 48,
    minSize: 48,
    maxSize: 48,
    enableSorting: false,
    enableColumnFilter: false,
    enableGlobalFilter: false,
    enableGrouping: false,
    enableResizing: false,
    enableHiding: false,
    cell: ({ row, table }) => {
      if (row.getIsGrouped()) return null;
      const flatRows = table.getRowModel().flatRows;
      let count = 0;
      for (const r of flatRows) {
        if (!r.getIsGrouped()) {
          count++;
          if (r.id === row.id) return count;
        }
      }
      return null;
    },
  };
}
