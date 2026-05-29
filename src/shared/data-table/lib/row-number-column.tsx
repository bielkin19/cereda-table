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

      // Flat mode (no grouping active): row.index is TanStack's global 0-based
      // position in the full dataset — it already encodes the page offset, so
      // +1 is all that is needed.  Adding pageIndex*pageSize would double-count
      // and produce page 2 → 21-30 instead of 11-20.
      if (table.getState().grouping.length === 0) {
        return row.index + 1;
      }

      // Grouped mode: page boundaries fall on group rows so the leaf count per
      // page varies — we cannot derive a cross-page offset from pageIndex*pageSize.
      // Instead build the index map from getPrePaginationRowModel().rows, which
      // is the full flat expanded list across ALL pages (produced by the expansion
      // model before the pagination slice).  Every leaf row gets a stable global
      // sequential number regardless of which page it lands on.
      //
      // Use .rows NOT .flatRows — TanStack's flatRows recurses into subRows of
      // every element in .rows, so each leaf appears twice and the WeakMap
      // overwrites the first index with a wrong second one.
      const allExpandedRows = table.getPrePaginationRowModel().rows;
      const indexMap = getLeafIndexMap(allExpandedRows);
      return indexMap.get(row.id) ?? null;
    },
  };
}
