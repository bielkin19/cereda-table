import type { Column, ColumnFiltersState, Table } from '@tanstack/react-table';

import type {
  DataTableFilterOperator,
  DataTableFilterRule,
  DataTableFilterValue,
  DataTableFilterVariant,
} from '../../types/data-table.types';
import { isDataTableAutoGroupColumnId } from '../auto-group-column';
import {
  type DataTableDateRangeFilterValue,
  type DataTableNumberFilterValue,
  normalizeBooleanFilterValue,
  normalizeDateFilterValue,
  normalizeDateRangeFilterValue,
  normalizeNumberFilterValue,
  normalizeNumberValue,
  normalizePrimitiveArray,
  normalizePrimitiveFilterValue,
  normalizeTextFilterValue,
} from '../column-filters';
import {
  getDataTableFilterOperatorsForVariant,
  getDataTableFilterRuleId,
  getDefaultDataTableFilterOperator,
  isDataTableFilterOperator,
} from './data-table-filter-operators';

export const DATA_TABLE_ROW_SELECTION_COLUMN_ID = '__data-table-row-selection__';

type NormalizedRangeValue = {
  from?: string | number;
  to?: string | number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isInternalColumnId(columnId: string): boolean {
  return (
    isDataTableAutoGroupColumnId(columnId) ||
    columnId === DATA_TABLE_ROW_SELECTION_COLUMN_ID
  );
}

function isUnknownArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

export function isDataTableFilterRule(value: unknown): value is DataTableFilterRule {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.columnId === 'string' &&
    isDataTableFilterOperator(value.operator) &&
    'value' in value
  );
}

function copyFilterRule(rule: DataTableFilterRule): DataTableFilterRule {
  return {
    id: rule.id,
    columnId: rule.columnId,
    operator: rule.operator,
    value: rule.value,
  };
}

function normalizeFilterRuleArray(value: unknown): DataTableFilterRule[] | undefined {
  if (!isUnknownArray(value)) {
    return undefined;
  }

  const normalized: DataTableFilterRule[] = [];
  for (const entry of value) {
    if (isDataTableFilterRule(entry)) {
      normalized.push(copyFilterRule(entry));
    }
  }

  return normalized.length === value.length ? normalized : undefined;
}

export function getFilterableColumnsById<TData extends object>(
  table: Table<TData>,
): Map<string, Column<TData, unknown>> {
  return new Map(
    table
      .getAllLeafColumns()
      .filter(
        (column) =>
          !isInternalColumnId(column.id) &&
          column.getCanFilter() &&
          column.columnDef.meta?.filterVariant !== undefined,
      )
      .map((column) => [column.id, column] as const),
  );
}

function normalizeRangeValue(
  value: unknown,
): NormalizedRangeValue | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const from =
    typeof value.from === 'string' || typeof value.from === 'number'
      ? value.from
      : undefined;
  const to =
    typeof value.to === 'string' || typeof value.to === 'number'
      ? value.to
      : undefined;

  return from === undefined && to === undefined ? undefined : { from, to };
}

function normalizeNumberRuleRangeValue(value: unknown): DataTableFilterValue | undefined {
  const normalized = normalizeNumberFilterValue(
    isRecord(value) && ('from' in value || 'to' in value)
      ? { min: value.from, max: value.to }
      : value,
  );

  return normalized ? { from: normalized.min, to: normalized.max } : undefined;
}

function normalizeDateRuleRangeValue(value: unknown): DataTableFilterValue | undefined {
  const normalized = normalizeDateRangeFilterValue(value);
  return normalized ? { from: normalized.from, to: normalized.to } : undefined;
}

function normalizeRangeRuleValue(
  variant: DataTableFilterVariant | undefined,
  value: unknown,
): DataTableFilterValue | undefined {
  if (variant === undefined) {
    return normalizeRangeValue(value);
  }

  return variant === 'number'
    ? normalizeNumberRuleRangeValue(value)
    : normalizeDateRuleRangeValue(value);
}

function normalizeOrderedRuleValue(
  variant: DataTableFilterVariant | undefined,
  value: unknown,
): DataTableFilterValue | undefined {
  if (variant === undefined) {
    return typeof value === 'string' || typeof value === 'number' ? value : undefined;
  }

  return variant === 'number'
    ? normalizeNumberValue(value)
    : normalizeDateFilterValue(value);
}

function normalizeRuleValue(
  variant: DataTableFilterVariant | undefined,
  operator: DataTableFilterOperator,
  value: unknown,
): DataTableFilterValue | undefined {
  if (operator === 'isEmpty' || operator === 'isNotEmpty') {
    return null;
  }

  if (operator === 'in') {
    if (isUnknownArray(value) && value.length === 0) {
      return [];
    }

    const normalized = normalizePrimitiveArray(value);
    return normalized && normalized.length > 0 ? normalized : undefined;
  }

  if (operator === 'between') {
    return normalizeRangeRuleValue(variant, value);
  }

  if (
    operator === 'greaterThan' ||
    operator === 'greaterThanOrEqual' ||
    operator === 'lessThan' ||
    operator === 'lessThanOrEqual'
  ) {
    return normalizeOrderedRuleValue(variant, value);
  }

  if (variant === 'number') {
    return normalizeNumberValue(value);
  }

  if (variant === 'date' || variant === 'date-range') {
    return normalizeDateFilterValue(value);
  }

  if (variant === 'boolean') {
    return normalizeBooleanFilterValue(value);
  }

  if (variant === 'select' || variant === 'multi-select' || variant === undefined) {
    return normalizePrimitiveFilterValue(value);
  }

  return normalizeTextFilterValue(value);
}

export function normalizeDataTableFilterRules<TData extends object>(
  table: Table<TData> | undefined,
  rules: unknown,
): DataTableFilterRule[] {
  if (!isUnknownArray(rules)) {
    return [];
  }

  const columnsById = table ? getFilterableColumnsById(table) : undefined;
  const normalizedById = new Map<string, DataTableFilterRule>();

  for (const entry of rules) {
    if (!isDataTableFilterRule(entry)) {
      continue;
    }

    const { columnId, operator } = entry;
    if (isInternalColumnId(columnId)) {
      continue;
    }

    const column = columnsById?.get(columnId);
    if (columnsById && !column) {
      continue;
    }

    const variant = column?.columnDef.meta?.filterVariant;
    const supportedOperators = getDataTableFilterOperatorsForVariant(variant);
    if (supportedOperators.length > 0 && !supportedOperators.includes(operator)) {
      continue;
    }

    const value = normalizeRuleValue(variant, operator, entry.value);
    if (value === undefined) {
      continue;
    }

    const id = getDataTableFilterRuleId(columnId, operator);
    normalizedById.set(id, {
      id,
      columnId,
      operator,
      value,
    });
  }

  return Array.from(normalizedById.values());
}

function numberRangeToRuleValue(value: DataTableNumberFilterValue): DataTableFilterValue {
  return { from: value.min, to: value.max };
}

function dateRangeToRuleValue(value: DataTableDateRangeFilterValue): DataTableFilterValue {
  return { from: value.from, to: value.to };
}

function legacyColumnFilterValueToRuleValue(
  variant: DataTableFilterVariant | undefined,
  value: unknown,
): DataTableFilterValue | undefined {
  if (isUnknownArray(value)) {
    const normalized = normalizePrimitiveArray(value);
    return normalized && normalized.length > 0 ? normalized : undefined;
  }

  if (variant === undefined && isRecord(value)) {
    const range = normalizeRangeValue(
      'min' in value || 'max' in value
        ? { from: value.min, to: value.max }
        : value,
    );
    return range ?? undefined;
  }

  if (variant === 'number') {
    const normalized = normalizeNumberFilterValue(value);
    return normalized ? numberRangeToRuleValue(normalized) : undefined;
  }

  if (variant === 'date-range') {
    const normalized = normalizeDateRangeFilterValue(value);
    return normalized ? dateRangeToRuleValue(normalized) : undefined;
  }

  if (variant === 'date') {
    return normalizeDateFilterValue(value);
  }

  if (variant === 'boolean') {
    return normalizeBooleanFilterValue(value);
  }

  if (variant === 'select' || variant === 'multi-select') {
    return normalizePrimitiveFilterValue(value);
  }

  return normalizeTextFilterValue(value);
}

export function columnFiltersToDataTableFilterRules<TData extends object>(
  table: Table<TData> | undefined,
  columnFilters: ColumnFiltersState | undefined,
): DataTableFilterRule[] {
  if (!isUnknownArray(columnFilters)) {
    return [];
  }

  const columnsById = table ? getFilterableColumnsById(table) : undefined;
  const rules: DataTableFilterRule[] = [];

  for (const filter of columnFilters) {
    if (isInternalColumnId(filter.id)) {
      continue;
    }

    const filterRules = normalizeFilterRuleArray(filter.value);
    if (filterRules) {
      for (const rule of filterRules) {
        rules.push(rule);
      }
      continue;
    }

    const column = columnsById?.get(filter.id);
    if (columnsById && !column) {
      continue;
    }

    const variant = column?.columnDef.meta?.filterVariant;
    const operator: DataTableFilterOperator =
      variant === undefined && isRecord(filter.value)
        ? 'between'
        : getDefaultDataTableFilterOperator(variant);
    const value = legacyColumnFilterValueToRuleValue(variant, filter.value);
    if (value === undefined) {
      continue;
    }

    rules.push({
      id: getDataTableFilterRuleId(filter.id, operator),
      columnId: filter.id,
      operator,
      value,
    });
  }

  return normalizeDataTableFilterRules(table, rules);
}

export function getDataTableFilterRuleValue(
  rules: readonly DataTableFilterRule[],
  columnId: string,
  operator: DataTableFilterOperator,
): DataTableFilterValue | undefined {
  return rules.find((rule) => rule.columnId === columnId && rule.operator === operator)
    ?.value;
}

export function upsertDataTableFilterRule(
  rules: readonly DataTableFilterRule[],
  columnId: string,
  operator: DataTableFilterOperator,
  value: DataTableFilterValue | undefined,
): DataTableFilterRule[] {
  const id = getDataTableFilterRuleId(columnId, operator);
  const withoutRule = rules.filter((rule) => rule.id !== id);
  if (value === undefined) {
    return withoutRule;
  }

  return [
    ...withoutRule,
    {
      id,
      columnId,
      operator,
      value,
    },
  ];
}
