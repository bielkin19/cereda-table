import type { Table } from '@tanstack/react-table';
import type { ReactNode } from 'react';

import { DataTableLoading } from './data-table-loading';
import { DataTableRow } from './data-table-row';

interface DataTableBodyProps<TData extends object> {
  table: Table<TData>;
  isLoading?: boolean;
  renderLoading?: ReactNode;
}

export function DataTableBody<TData extends object>({
  table,
  isLoading = false,
  renderLoading,
}: DataTableBodyProps<TData>) {
  const rows = table.getRowModel().rows;
  const visibleColumnCount = table.getVisibleLeafColumns().length;

  return (
    <tbody className="data-table__body">
      {isLoading &&
        (renderLoading ?? <DataTableLoading columnCount={visibleColumnCount} />)}

      {!isLoading &&
        rows.map((row) => <DataTableRow key={row.id} row={row} />)}
    </tbody>
  );
}
