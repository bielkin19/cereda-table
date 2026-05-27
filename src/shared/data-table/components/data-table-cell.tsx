import type { Cell } from '@tanstack/react-table';
import { flexRender } from '@tanstack/react-table';

import { isDataTableAutoGroupColumnId } from '../lib/auto-group-column';
import { getColumnSizeStyle } from '../lib/column-sizing';
import { splitByTerm } from '../lib/highlight';
import { isDataTableRowNumberColumnId } from '../lib/row-number-column';
import { DataTableHighlightText } from './data-table-highlight-text';
import { getEffectiveTerm, useDataTableSearch } from './data-table-search-context';

interface DataTableCellProps<TData extends object> {
  cell: Cell<TData, unknown>;
}

function maybeHighlight(rawValue: unknown, term: string): React.ReactNode | null {
  if (!term) return null;
  const text =
    typeof rawValue === 'string' && rawValue.length > 0
      ? rawValue
      : typeof rawValue === 'number'
        ? String(rawValue)
        : null;
  if (text === null) return null;
  const segments = splitByTerm(text, term);
  if (segments.length === 1 && !segments[0].match) return null;
  return <DataTableHighlightText text={text} term={term} />;
}

export function DataTableCell<TData extends object>({
  cell,
}: DataTableCellProps<TData>) {
  const search = useDataTableSearch();
  const isAggregated = cell.getIsAggregated();
  const isPlaceholder = cell.getIsPlaceholder();
  const columnMinSize = cell.column.columnDef.minSize;
  // For fill columns (no maxSize): apply an explicit CSS width whenever the
  // column has been touched by the user — either it's currently being dragged
  // (getIsResizing) or it already has an entry in the table's columnSizing
  // state.  Comparing currentSize to columnDef.size is NOT safe: when
  // applyDataTableSizingDefaultsToColumns bumps a column's size up to its
  // auto-derived minSize the two values can be equal even after the user has
  // explicitly resized to that minimum, which would incorrectly drop the column
  // back into fill mode and cause a visible jump on mouse-up.
  const currentColumnSize = cell.column.getSize();
  const isColumnResizing = cell.column.getIsResizing();
  const columnSizingState = cell.getContext().table.getState().columnSizing;
  const isExplicitlySized = cell.column.id in columnSizingState;
  const columnMaxSize =
    cell.column.columnDef.maxSize !== undefined
      ? cell.column.columnDef.maxSize
      : isColumnResizing || isExplicitlySized
        ? currentColumnSize
        : undefined;
  const label =
    cell.column.columnDef.meta?.label ??
    (typeof cell.column.columnDef.header === 'string'
      ? cell.column.columnDef.header
      : cell.column.id);
  const isAutoGroupColumn = isDataTableAutoGroupColumnId(cell.column.id);
  const isRowNumberColumn = isDataTableRowNumberColumnId(cell.column.id);

  if (isRowNumberColumn) {
    return (
      <td
        className="cereda-table__td cereda-table__row-number-td"
        data-column-id={cell.column.id}
        style={getColumnSizeStyle(48, 48, 48)}
      >
        {flexRender(cell.column.columnDef.cell, cell.getContext())}
      </td>
    );
  }

  if (isAutoGroupColumn) {
    return (
      <td
        key={cell.id}
        className="cereda-table__td cereda-table__td--auto-group"
        data-column-id={cell.column.id}
        style={getColumnSizeStyle(
          cell.column.getSize(),
          columnMinSize,
          columnMaxSize,
          label,
        )}
      >
        {flexRender(cell.column.columnDef.cell, cell.getContext())}
      </td>
    );
  }

  if (isPlaceholder || (cell.row.getIsGrouped() && !isAggregated)) {
    return (
      <td
        key={cell.id}
        className="cereda-table__td cereda-table__td--placeholder"
        data-column-id={cell.column.id}
        style={getColumnSizeStyle(
          cell.column.getSize(),
          columnMinSize,
          columnMaxSize,
          label,
        )}
      />
    );
  }

  if (isAggregated) {
    return (
      <td
        key={cell.id}
        className="cereda-table__td cereda-table__td--aggregated"
        data-column-id={cell.column.id}
        style={getColumnSizeStyle(
          cell.column.getSize(),
          columnMinSize,
          columnMaxSize,
          label,
        )}
      >
        {flexRender(
          cell.column.columnDef.aggregatedCell ?? cell.column.columnDef.cell,
          cell.getContext(),
        )}
      </td>
    );
  }

  const term = getEffectiveTerm(search, cell.column.id);

  // Auto-highlight only applies when the column has no custom cell renderer.
  // A custom renderer is responsible for its own output (e.g. formatted dates,
  // badges). Replacing it with a raw highlighted string would show the wrong
  // content. Custom renderers that want highlighting can call
  // useDataTableSearch() + <DataTableHighlightText> themselves.
  const hasCustomRenderer = cell.column.columnDef.cell !== undefined;
  const highlighted = hasCustomRenderer ? null : maybeHighlight(cell.getValue(), term);

  return (
    <td
      key={cell.id}
      className="cereda-table__td"
      data-column-id={cell.column.id}
      style={getColumnSizeStyle(
        currentColumnSize,
        columnMinSize,
        columnMaxSize,
        label,
      )}
    >
      {highlighted ?? flexRender(cell.column.columnDef.cell, cell.getContext())}
    </td>
  );
}

