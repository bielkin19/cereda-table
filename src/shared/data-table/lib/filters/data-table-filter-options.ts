import type { Column, Table } from '@tanstack/react-table';

import type { DataTableFilterVariant } from '../../types/data-table.types';
import {
  type DataTablePrimitiveFilterValue,
  getPrimitiveFilterKey,
  normalizePrimitiveFilterValue,
} from '../column-filters';

export type SupportedDataTableFilterVariant = Extract<
  DataTableFilterVariant,
  'text' | 'number' | 'select' | 'multi-select' | 'date' | 'date-range' | 'boolean'
>;

export interface PrimitiveOption {
  key: string;
  label: string;
  value: DataTablePrimitiveFilterValue;
}

export function getColumnFilterLabel<TData extends object>(
  column: Column<TData, unknown>,
): string {
  return column.columnDef.meta?.label ?? column.id;
}

export function isSupportedFilterVariant(
  value: DataTableFilterVariant | undefined,
): value is SupportedDataTableFilterVariant {
  return (
    value === 'text' ||
    value === 'number' ||
    value === 'select' ||
    value === 'multi-select' ||
    value === 'date' ||
    value === 'date-range' ||
    value === 'boolean'
  );
}

export function getPrimitiveFilterOptions<TData extends object>(
  column: Column<TData, unknown>,
  table?: Table<TData>,
): PrimitiveOption[] {
  const uniqueValues = new Map<string, DataTablePrimitiveFilterValue>();
  const rows = table?.getPreFilteredRowModel().flatRows ?? [];

  for (const row of rows) {
    const value = row.getValue(column.id);
    const primitiveValue = normalizePrimitiveFilterValue(value);
    if (primitiveValue === undefined) {
      continue;
    }

    const optionKey = getPrimitiveFilterKey(primitiveValue);
    if (!uniqueValues.has(optionKey)) {
      uniqueValues.set(optionKey, primitiveValue);
    }
  }

  return Array.from(uniqueValues.entries())
    .map(([key, value]) => ({
      key,
      value,
      label: String(value),
    }))
    .sort((left, right) =>
      left.label.localeCompare(right.label, undefined, {
        numeric: true,
        sensitivity: 'base',
      }),
    );
}

export function getFacetSummary(
  options: readonly PrimitiveOption[],
  selectedKeys: readonly string[],
  isAllSelected = selectedKeys.length === 0,
): string {
  if (isAllSelected) {
    return 'All';
  }

  if (selectedKeys.length === 0) {
    return 'None';
  }

  if (selectedKeys.length === 1) {
    return options.find((option) => option.key === selectedKeys[0])?.label ?? '1 selected';
  }

  return `${selectedKeys.length} selected`;
}

export function filterPrimitiveOptionsBySearch(
  options: readonly PrimitiveOption[],
  searchValue: string,
): PrimitiveOption[] {
  const normalizedSearch = searchValue.trim().toLocaleLowerCase();
  if (!normalizedSearch) {
    return [...options];
  }

  return options.filter((option) =>
    option.label.toLocaleLowerCase().includes(normalizedSearch),
  );
}

export function togglePrimitiveFilterValue(
  selectedValues: readonly DataTablePrimitiveFilterValue[],
  optionValue: DataTablePrimitiveFilterValue,
  checked: boolean,
): DataTablePrimitiveFilterValue[] {
  const optionKey = getPrimitiveFilterKey(optionValue);
  if (!checked) {
    return selectedValues.filter(
      (value) => getPrimitiveFilterKey(value) !== optionKey,
    );
  }

  if (selectedValues.some((value) => getPrimitiveFilterKey(value) === optionKey)) {
    return [...selectedValues];
  }

  return [...selectedValues, optionValue];
}

export function getNextPrimitiveFilterSelection({
  allSelected,
  checked,
  optionValue,
  options,
  selectedValues,
}: {
  allSelected: boolean;
  checked: boolean;
  optionValue: DataTablePrimitiveFilterValue;
  options: readonly PrimitiveOption[];
  selectedValues: readonly DataTablePrimitiveFilterValue[];
}): DataTablePrimitiveFilterValue[] | undefined {
  if (allSelected) {
    return [optionValue];
  }

  const nextValues = togglePrimitiveFilterValue(
    selectedValues,
    optionValue,
    checked,
  );

  return nextValues.length === options.length ? undefined : nextValues;
}
