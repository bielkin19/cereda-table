import type { Cell } from '@tanstack/react-table';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { CSSProperties } from 'react';

import { useDataTableLocale } from './data-table-locale-context';

function formatGroupedValue(
  value: unknown,
  booleanTrue: string,
  booleanFalse: string,
  emptyValue: string,
): string {
  if (typeof value === 'boolean') {
    return value ? booleanTrue : booleanFalse;
  }

  if (value === null || value === undefined || value === '') {
    return emptyValue;
  }

  if (typeof value === 'string' || typeof value === 'number') {
    return String(value);
  }

  if (typeof value === 'bigint' || typeof value === 'symbol') {
    return value.toString();
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === 'object') {
    return JSON.stringify(value) ?? emptyValue;
  }

  return emptyValue;
}

interface DataTableAutoGroupCellProps<TData extends object> {
  cell: Cell<TData, unknown>;
}

export function DataTableAutoGroupCell<TData extends object>({
  cell,
}: DataTableAutoGroupCellProps<TData>) {
  const locale = useDataTableLocale();
  const row = cell.row;
  const style = {
    '--cereda-table-auto-group-indent': `${row.depth * 16}px`,
  } as CSSProperties;
  const groupingColumnId = row.groupingColumnId;

  if (!row.getIsGrouped()) {
    return (
      <div
        className="cereda-table__auto-group-cell cereda-table__auto-group-cell--leaf"
        style={style}
        aria-hidden="true"
      >
        <span className="cereda-table__auto-group-spacer" />
      </div>
    );
  }

  const groupingColumn = groupingColumnId
    ? cell.getContext().table.getColumn(groupingColumnId)
    : undefined;
  const label =
    groupingColumn?.columnDef.meta?.label ??
    (typeof groupingColumn?.columnDef.header === 'string'
      ? groupingColumn.columnDef.header
      : groupingColumnId ?? locale.autoGroup.fallbackGroupLabel);
  const groupValue = groupingColumnId
    ? row.getGroupingValue(groupingColumnId)
    : row.groupingValue;
  const expanded = row.getIsExpanded();
  const childCount = row.getLeafRows().length;
  const formattedValue = formatGroupedValue(
    groupValue,
    locale.autoGroup.booleanTrue,
    locale.autoGroup.booleanFalse,
    locale.autoGroup.emptyValue,
  );
  const ariaLabel = expanded
    ? locale.autoGroup.collapseAriaLabel(label, formattedValue, childCount)
    : locale.autoGroup.expandAriaLabel(label, formattedValue, childCount);

  return (
    <div
      className="cereda-table__auto-group-cell cereda-table__auto-group-cell--grouped"
      style={style}
    >
      <button
        type="button"
        className="cereda-table__group-toggle cereda-table__group-toggle--auto-group"
        onClick={row.getToggleExpandedHandler()}
        aria-expanded={expanded}
        aria-label={ariaLabel}
      >
        {expanded ? (
          <ChevronDown className="cereda-table__group-toggle-icon" aria-hidden="true" />
        ) : (
          <ChevronRight className="cereda-table__group-toggle-icon" aria-hidden="true" />
        )}
        <span className="cereda-table__group-toggle-label">{label}:</span>{' '}
        <span className="cereda-table__group-toggle-value">
          {formattedValue}
        </span>{' '}
        <span className="cereda-table__group-count">({childCount})</span>
      </button>
    </div>
  );
}

