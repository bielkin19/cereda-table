import type { ColumnDef } from '@tanstack/react-table';

import { DataTableAutoGroupCell } from '../components/data-table-auto-group-cell';

export const DATA_TABLE_AUTO_GROUP_COLUMN_ID = '__data-table-auto-group__';

export function isDataTableAutoGroupColumnId(columnId: string) {
  return columnId === DATA_TABLE_AUTO_GROUP_COLUMN_ID;
}

export function createDataTableAutoGroupColumn<TData extends object>(): ColumnDef<
  TData,
  unknown
> {
  return {
    id: DATA_TABLE_AUTO_GROUP_COLUMN_ID,
    header: 'Group',
    size: 260,
    minSize: 220,
    enableSorting: false,
    enableHiding: false,
    enableGrouping: false,
    cell: (context) => <DataTableAutoGroupCell cell={context.cell} />,
  };
}
