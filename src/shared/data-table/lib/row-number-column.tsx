import type { ColumnDef, Row } from '@tanstack/react-table';

export const DATA_TABLE_ROW_NUMBER_COLUMN_ID = '__row_number__';

export function isDataTableRowNumberColumnId(columnId: string): boolean {
  return columnId === DATA_TABLE_ROW_NUMBER_COLUMN_ID;
}

/**
 * Recursively counts the total number of leaf (non-grouped) rows
 * within the given subRows array.  Used to display the row count
 * on a group header cell.
 */
function countLeafRows<TData extends object>(rows: Row<TData>[]): number {
  let count = 0;
  for (const r of rows) {
    if (r.getIsGrouped()) {
      count += countLeafRows(r.subRows);
    } else {
      count++;
    }
  }
  return count;
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
      // ── Group row ─────────────────────────────────────────────────────────
      // Show the total count of leaf rows inside this group (all levels).
      if (row.getIsGrouped()) {
        return countLeafRows(row.subRows);
      }

      // ── Leaf row inside a group ───────────────────────────────────────────
      // Show a 1-based index within the immediate parent's leaf children so
      // numbers restart at 1 for every group, making it easy to count rows
      // relative to the group rather than the whole table.
      const parent = row.getParentRow();
      if (parent !== undefined) {
        let idx = 0;
        for (const sibling of parent.subRows) {
          if (!sibling.getIsGrouped()) {
            idx++;
            if (sibling.id === row.id) return idx;
          }
        }
        return null; // should never reach here
      }

      // ── Flat (no grouping) ────────────────────────────────────────────────
      // row.index is the 0-based position within the current page, so we add
      // the page offset to get a continuous global row number across pages.
      // All O(1) — no loops.
      const { pageIndex, pageSize } = table.getState().pagination;
      return pageIndex * pageSize + row.index + 1;
    },
  };
}
