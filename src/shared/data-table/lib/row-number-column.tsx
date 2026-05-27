import type { ColumnDef, Row } from '@tanstack/react-table';

export const DATA_TABLE_ROW_NUMBER_COLUMN_ID = '__row_number__';

export function isDataTableRowNumberColumnId(columnId: string): boolean {
  return columnId === DATA_TABLE_ROW_NUMBER_COLUMN_ID;
}

// Module-level WeakMap: built once per flatRows array reference (= once per
// render) and garbage-collected automatically when TanStack drops the array.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const leafIndexCache = new WeakMap<Row<any>[], Map<string, number>>();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getLeafIndexMap(flatRows: Row<any>[]): Map<string, number> {
  let map = leafIndexCache.get(flatRows);
  if (!map) {
    map = new Map<string, number>();
    let idx = 0;
    for (const r of flatRows) {
      if (!r.getIsGrouped()) map.set(r.id, ++idx);
    }
    leafIndexCache.set(flatRows, map);
  }
  return map;
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
      // Group rows: always blank.
      // The auto-group column already shows the group label + child count.
      if (row.getIsGrouped()) return null;

      const { pageIndex, pageSize } = table.getState().pagination;

      // Flat mode (no grouping): O(1), correct cross-page offset.
      if (table.getState().grouping.length === 0) {
        return pageIndex * pageSize + row.index + 1;
      }

      // Grouped mode: sequential numbers across the current page's leaf rows.
      // WeakMap cache makes the total cost O(n) per render, not O(n²).
      const flatRows = table.getRowModel().flatRows;
      const indexMap = getLeafIndexMap(flatRows);
      return indexMap.get(row.id) ?? null;
    },
  };
}
