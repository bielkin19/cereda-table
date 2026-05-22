import {
  horizontalListSortingStrategy,
  SortableContext,
} from '@dnd-kit/sortable';
import type { Header, HeaderGroup } from '@tanstack/react-table';

import { isDataTableAutoGroupColumnId } from '../lib/auto-group-column';
import { getColumnSizeStyle } from '../lib/column-sizing';
import { getColumnHeaderDndId } from '../lib/data-table-dnd';
import { isDataTableRowNumberColumnId } from '../lib/row-number-column';
import { DataTableColumnFilter } from './data-table-column-filter';
import { DataTableHeaderCell } from './data-table-header-cell';

interface DataTableHeaderProps<TData extends object> {
  headerGroups: HeaderGroup<TData>[];
  enableColumnFilters?: boolean;
  enableColumnResizing?: boolean;
  enableColumnOrdering?: boolean;
}

function DataTableFilterCell<TData extends object>({
  header,
}: {
  header: Header<TData, unknown>;
}) {
  if (isDataTableRowNumberColumnId(header.column.id)) {
    return (
      <th
        className="data-table__th data-table__row-number-th data-table__row-number-th--filter"
        style={getColumnSizeStyle(48, 48, 48)}
        data-column-id={header.column.id}
      />
    );
  }

  const canFilter = !header.isPlaceholder && header.column.getCanFilter();
  const label =
    header.column.columnDef.meta?.label ??
    (typeof header.column.columnDef.header === 'string'
      ? header.column.columnDef.header
      : header.column.id);
  const style = getColumnSizeStyle(
    header.getSize(),
    header.column.columnDef.minSize,
    header.column.columnDef.maxSize,
    label,
  );

  return (
    <th
      className="data-table__th data-table__filter-cell"
      style={style}
      data-column-id={header.column.id}
    >
      {canFilter ? (
        <div className="data-table__header-filter">
          <DataTableColumnFilter
            column={header.column}
            table={header.getContext().table}
          />
        </div>
      ) : null}
    </th>
  );
}

export function DataTableHeader<TData extends object>({
  headerGroups,
  enableColumnFilters,
  enableColumnResizing,
  enableColumnOrdering,
}: DataTableHeaderProps<TData>) {
  const leafHeaderGroupIndex = headerGroups.length - 1;
  const leafHeaderGroup = headerGroups[leafHeaderGroupIndex];
  const leafHeaderIds =
    enableColumnOrdering === true && leafHeaderGroupIndex >= 0
      ? leafHeaderGroup?.headers.reduce<string[]>((accumulator, header) => {
          if (
            !isDataTableAutoGroupColumnId(header.column.id) &&
            !isDataTableRowNumberColumnId(header.column.id)
          ) {
            accumulator.push(getColumnHeaderDndId(header.column.id));
          }
          return accumulator;
        }, []) ?? []
      : [];

  return (
    <thead className="data-table__head">
      {headerGroups.map((headerGroup, index) => (
        <tr key={headerGroup.id} className="data-table__header-row">
          {index === leafHeaderGroupIndex ? (
            <SortableContext
              items={leafHeaderIds}
              strategy={horizontalListSortingStrategy}
            >
              {headerGroup.headers.map((header) => (
                <DataTableHeaderCell
                  key={header.id}
                  header={header}
                  enableColumnResizing={enableColumnResizing}
                  enableColumnOrdering={enableColumnOrdering}
                />
              ))}
            </SortableContext>
          ) : (
            headerGroup.headers.map((header) => (
              <DataTableHeaderCell
                key={header.id}
                header={header}
                enableColumnResizing={enableColumnResizing}
                enableColumnOrdering={enableColumnOrdering}
              />
            ))
          )}
        </tr>
      ))}
      {enableColumnFilters && leafHeaderGroup ? (
        <tr key={`${leafHeaderGroup.id}-filters`} className="data-table__filter-row">
          {leafHeaderGroup.headers.map((header) => (
            <DataTableFilterCell key={header.id} header={header} />
          ))}
        </tr>
      ) : null}
    </thead>
  );
}
