import type { Table } from '@tanstack/react-table';
import { useState } from 'react';

import type { DataTableSavedViewsStorage } from '../types/data-table.types';
import { DataTableColumnsMenu } from './data-table-columns-menu';
import { DataTableFiltersMenu } from './data-table-filters-menu';
import { DataTableGlobalSearch } from './data-table-global-search';
import { DataTableSavedViewsMenu } from './data-table-saved-views-menu';

type DataTableToolbarPopover = 'saved-views' | 'filters' | 'columns';

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
  showFiltersButton?: boolean;
  showColumnsButton?: boolean;
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
  showFiltersButton = true,
  showColumnsButton = true,
}: DataTableToolbarProps<TData>) {
  const [activePopover, setActivePopover] =
    useState<DataTableToolbarPopover | null>(null);

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
    (enableColumnOrdering || enableColumnVisibility || enableGrouping) &&
    showColumnsButton;
  const hasActions =
    hasColumnsMenu ||
    (enableColumnFilters === true && showFiltersButton) ||
    enableSavedViews === true;

  function handlePopoverOpenChange(
    popover: DataTableToolbarPopover,
    nextOpen: boolean,
  ) {
    setActivePopover(nextOpen ? popover : null);
  }

  return (
    <div
      className={
        activePopover
          ? 'cereda-table__toolbar-inner cereda-table__toolbar-inner--popover-open'
          : 'cereda-table__toolbar-inner'
      }
    >
      {enableGlobalFilter ? (
        <div className="cereda-table__toolbar-section cereda-table__toolbar-section--search">
          <DataTableGlobalSearch table={table} />
        </div>
      ) : null}
      {hasActions ? (
        <div className="cereda-table__toolbar-section cereda-table__toolbar-section--actions">
          {enableSavedViews ? (
            <DataTableSavedViewsMenu
              table={table}
              storageKey={storageKey}
              defaultViewName={defaultViewName}
              savedViewsStorage={savedViewsStorage}
              open={activePopover === 'saved-views'}
              onOpenChange={(nextOpen) =>
                handlePopoverOpenChange('saved-views', nextOpen)
              }
            />
          ) : null}
          {enableColumnFilters && showFiltersButton ? (
            <DataTableFiltersMenu
              table={table}
              open={activePopover === 'filters'}
              onOpenChange={(nextOpen) =>
                handlePopoverOpenChange('filters', nextOpen)
              }
            />
          ) : null}
          {hasColumnsMenu ? (
            <DataTableColumnsMenu
              table={table}
              enableColumnOrdering={enableColumnOrdering}
              enableColumnVisibility={enableColumnVisibility}
              enableGrouping={enableGrouping}
              open={activePopover === 'columns'}
              onOpenChange={(nextOpen) =>
                handlePopoverOpenChange('columns', nextOpen)
              }
            />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

