import type { Row } from '@tanstack/react-table';

import { DataTableCell } from './data-table-cell';

interface DataTableRowProps<TData extends object> {
  row: Row<TData>;
}

export function DataTableRow<TData extends object>({
  row,
}: DataTableRowProps<TData>) {
  const isGrouped = row.getIsGrouped();

  return (
    <tr
      className={
        isGrouped
          ? 'cereda-table__row cereda-table__row--grouped'
          : 'cereda-table__row'
      }
      data-selected={row.getIsSelected() || undefined}
      data-grouped={isGrouped || undefined}
      data-depth={row.depth}
      data-expanded={row.getIsExpanded() || undefined}
    >
      {row.getVisibleCells().map((cell) => <DataTableCell key={cell.id} cell={cell} />)}
    </tr>
  );
}

