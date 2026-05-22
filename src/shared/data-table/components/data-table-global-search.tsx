import type { Table } from '@tanstack/react-table';
import { Search, X } from 'lucide-react';
import type { ChangeEvent } from 'react';

function getGlobalFilterValue(state: { globalFilter?: unknown }): string {
  return typeof state.globalFilter === 'string' ? state.globalFilter : '';
}

interface DataTableGlobalSearchProps<TData extends object> {
  table: Table<TData>;
}

export function DataTableGlobalSearch<TData extends object>({
  table,
}: DataTableGlobalSearchProps<TData>) {
  const value = getGlobalFilterValue(table.getState());

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    table.setGlobalFilter(event.currentTarget.value);
  }

  function handleClear() {
    table.setGlobalFilter('');
  }

  return (
    <div className="data-table__global-search">
      <Search className="data-table__global-search-icon" aria-hidden="true" />
      <input
        className="data-table__global-search-input"
        type="text"
        placeholder="Search..."
        value={value}
        onChange={handleChange}
        aria-label="Search"
        role="searchbox"
      />
      {value ? (
        <button
          type="button"
          className="data-table__global-search-clear"
          onClick={handleClear}
          aria-label="Clear search"
        >
          <X aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}
