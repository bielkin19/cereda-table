import type { Table } from '@tanstack/react-table';

import type { DataTableSavedViewsStorage } from '../types/data-table.types';
import { DataTableColumnsMenu } from './data-table-columns-menu';
import { DataTableFiltersMenu } from './data-table-filters-menu';
import { DataTableGlobalSearch } from './data-table-global-search';
import { DataTableSavedViewsMenu } from './data-table-saved-views-menu';

interface DataTableToolbarProps<TData extends object> {
  table: Table<TData>;
  enableColumnOrdering?: boolean;
  enableColumnFilters?: boolean;
  enableColumnVisibility?: boolean;
  enableGlobalFilter?: boolean;
  enableGrouping?: boolean;
  enableSavedViews?: boolean;
  storageKey?: string;
  defaultViewName?: string;
  savedViewsStorage?: DataTableSavedViewsStorage;
}

export function DataTableToolbar<TData extends object>({
  table,
  enableColumnOrdering,
  enableColumnFilters,
  enableColumnVisibility,
  enableGlobalFilter,
  enableGrouping,
  enableSavedViews,
  storageKey,
  defaultViewName,
  savedViewsStorage,
}: DataTableToolbarProps<TData>) {
  if (
    !enableColumnOrdering &&
    !enableColumnFilters &&
    !enableColumnVisibility &&
    !enableGlobalFilter &&
    !enableGrouping &&
    !enableSavedViews
  ) {
    return null;
  }

  const hasColumnsMenu =
    enableColumnOrdering || enableColumnVisibility || enableGrouping;
  const hasActions =
    hasColumnsMenu || enableColumnFilters === true || enableSavedViews === true;

  return (
    <div className="data-table__toolbar-inner">
      {enableGlobalFilter ? (
        <div className="data-table__toolbar-section data-table__toolbar-section--search">
          <DataTableGlobalSearch table={table} />
        </div>
      ) : null}
      {hasActions ? (
        <div className="data-table__toolbar-section data-table__toolbar-section--actions">
          {enableSavedViews ? (
            <DataTableSavedViewsMenu
              table={table}
              storageKey={storageKey}
              defaultViewName={defaultViewName}
              savedViewsStorage={savedViewsStorage}
            />
          ) : null}
          {enableColumnFilters ? <DataTableFiltersMenu table={table} /> : null}
          {hasColumnsMenu ? (
            <DataTableColumnsMenu
              table={table}
              enableColumnOrdering={enableColumnOrdering}
              enableColumnVisibility={enableColumnVisibility}
              enableGrouping={enableGrouping}
            />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
