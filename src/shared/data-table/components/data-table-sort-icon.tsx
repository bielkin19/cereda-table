import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';

export type DataTableSortDirection = 'none' | 'asc' | 'desc';

interface DataTableSortIconProps {
  state: DataTableSortDirection;
}

export function DataTableSortIcon({ state }: DataTableSortIconProps) {
  const Icon =
    state === 'asc' ? ArrowUp : state === 'desc' ? ArrowDown : ArrowUpDown;

  return <Icon className="cereda-table__sort-icon" aria-hidden="true" />;
}

