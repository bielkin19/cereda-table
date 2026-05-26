import type { Table } from '@tanstack/react-table';
import { Search, X } from 'lucide-react';
import type { ChangeEvent } from 'react';

import { useDataTableLocale } from './data-table-locale-context';

function getGlobalFilterValue(state: { globalFilter?: unknown }): string {
  return typeof state.globalFilter === 'string' ? state.globalFilter : '';
}

interface DataTableGlobalSearchProps<TData extends object> {
  table: Table<TData>;
}

export function DataTableGlobalSearch<TData extends object>({
  table,
}: DataTableGlobalSearchProps<TData>) {
  const locale = useDataTableLocale();
  const value = getGlobalFilterValue(table.getState());

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    table.setGlobalFilter(event.currentTarget.value);
  }

  function handleClear() {
    table.setGlobalFilter('');
  }

  return (
    <div className="cereda-table__global-search">
      <Search className="cereda-table__global-search-icon" aria-hidden="true" />
      <input
        className="cereda-table__global-search-input"
        type="text"
        placeholder={locale.search.placeholder}
        value={value}
        onChange={handleChange}
        aria-label={locale.search.ariaLabel}
        role="searchbox"
      />
      {value ? (
        <button
          type="button"
          className="cereda-table__global-search-clear"
          onClick={handleClear}
          aria-label={locale.search.clearAriaLabel}
        >
          <X aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}

