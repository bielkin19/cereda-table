import type { ColumnFiltersState } from '@tanstack/react-table';

import type {
  DataTableFilterRule,
  DataTableFilterValue,
} from '../../types/data-table.types';
import {
  getRowPrimitiveFilterKey,
  normalizeDateFilterValue,
  normalizeNumberValue,
} from '../column-filters';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function dataTableFilterRulesToColumnFilters(
  rules: readonly DataTableFilterRule[],
): ColumnFiltersState {
  const rulesByColumnId = new Map<string, DataTableFilterRule[]>();

  for (const rule of rules) {
    const existing = rulesByColumnId.get(rule.columnId);
    if (existing) {
      existing.push(rule);
      continue;
    }

    rulesByColumnId.set(rule.columnId, [rule]);
  }

  return Array.from(rulesByColumnId.entries()).map(([id, value]) => ({
    id,
    value,
  }));
}

export function dataTableFilterRulesToLegacyColumnFilters(
  rules: readonly DataTableFilterRule[],
): ColumnFiltersState {
  return rules.reduce<ColumnFiltersState>((accumulator, rule) => {
    let value: unknown = rule.value;

    if (rule.operator === 'between' && hasRangeValue(rule.value)) {
      value = { min: rule.value.from, max: rule.value.to };
    }

    if (rule.operator === 'greaterThan' || rule.operator === 'greaterThanOrEqual') {
      value = { min: rule.value };
    }

    if (rule.operator === 'lessThan' || rule.operator === 'lessThanOrEqual') {
      value = { max: rule.value };
    }

    if (rule.operator === 'isEmpty' || rule.operator === 'isNotEmpty') {
      return accumulator;
    }

    accumulator.push({ id: rule.columnId, value });
    return accumulator;
  }, []);
}

function hasRangeValue(value: DataTableFilterValue): value is {
  from?: string | number;
  to?: string | number;
} {
  return isRecord(value);
}

function isEmptyRowValue(value: unknown): boolean {
  return (
    value === null ||
    value === undefined ||
    (typeof value === 'string' && value.trim().length === 0) ||
    (Array.isArray(value) && value.length === 0)
  );
}

function comparePrimitiveValue(
  rowValue: unknown,
  filterValue: DataTableFilterValue,
): boolean {
  if (
    typeof filterValue !== 'string' &&
    typeof filterValue !== 'number' &&
    typeof filterValue !== 'boolean'
  ) {
    return false;
  }

  const rowKey = getRowPrimitiveFilterKey(rowValue);
  const filterKey = getRowPrimitiveFilterKey(filterValue);
  return rowKey !== undefined && filterKey !== undefined && rowKey === filterKey;
}

function compareTextValue(
  rowValue: unknown,
  filterValue: DataTableFilterValue,
): boolean {
  if (typeof filterValue !== 'string') {
    return false;
  }

  const rowText =
    typeof rowValue === 'string' ||
    typeof rowValue === 'number' ||
    typeof rowValue === 'boolean'
      ? String(rowValue)
      : '';

  return rowText.toLocaleLowerCase().includes(filterValue.toLocaleLowerCase());
}

function compareInValue(rowValue: unknown, filterValue: DataTableFilterValue): boolean {
  if (!Array.isArray(filterValue)) {
    return false;
  }

  const rowKey = getRowPrimitiveFilterKey(rowValue);
  if (!rowKey) {
    return false;
  }

  return filterValue.some((entry) => getRowPrimitiveFilterKey(entry) === rowKey);
}

function compareOrderedValue(
  rowValue: unknown,
  filterValue: DataTableFilterValue,
  compare: (left: number | string, right: number | string) => boolean,
): boolean {
  if (typeof filterValue !== 'string' && typeof filterValue !== 'number') {
    return false;
  }

  const rowNumber = normalizeNumberValue(rowValue);
  const filterNumber = normalizeNumberValue(filterValue);
  if (rowNumber !== undefined && filterNumber !== undefined) {
    return compare(rowNumber, filterNumber);
  }

  const rowDate = normalizeDateFilterValue(rowValue);
  const filterDate = normalizeDateFilterValue(filterValue);
  if (rowDate !== undefined && filterDate !== undefined) {
    return compare(rowDate, filterDate);
  }

  return false;
}

function compareBetweenValue(
  rowValue: unknown,
  filterValue: DataTableFilterValue,
): boolean {
  if (!hasRangeValue(filterValue)) {
    return false;
  }

  const rowNumber = normalizeNumberValue(rowValue);
  const fromNumber = normalizeNumberValue(filterValue.from);
  const toNumber = normalizeNumberValue(filterValue.to);
  if (rowNumber !== undefined && (fromNumber !== undefined || toNumber !== undefined)) {
    if (fromNumber !== undefined && rowNumber < fromNumber) {
      return false;
    }
    if (toNumber !== undefined && rowNumber > toNumber) {
      return false;
    }
    return true;
  }

  const rowDate = normalizeDateFilterValue(rowValue);
  const fromDate = normalizeDateFilterValue(filterValue.from);
  const toDate = normalizeDateFilterValue(filterValue.to);
  if (!rowDate || (!fromDate && !toDate)) {
    return false;
  }
  if (fromDate && rowDate < fromDate) {
    return false;
  }
  if (toDate && rowDate > toDate) {
    return false;
  }
  return true;
}

export function evaluateDataTableFilterRule(
  rowValue: unknown,
  rule: DataTableFilterRule,
): boolean {
  switch (rule.operator) {
    case 'contains':
      return compareTextValue(rowValue, rule.value);
    case 'equals':
      return comparePrimitiveValue(rowValue, rule.value);
    case 'in':
      return compareInValue(rowValue, rule.value);
    case 'between':
      return compareBetweenValue(rowValue, rule.value);
    case 'isEmpty':
      return isEmptyRowValue(rowValue);
    case 'isNotEmpty':
      return !isEmptyRowValue(rowValue);
    case 'greaterThan':
      return compareOrderedValue(rowValue, rule.value, (left, right) => left > right);
    case 'greaterThanOrEqual':
      return compareOrderedValue(rowValue, rule.value, (left, right) => left >= right);
    case 'lessThan':
      return compareOrderedValue(rowValue, rule.value, (left, right) => left < right);
    case 'lessThanOrEqual':
      return compareOrderedValue(rowValue, rule.value, (left, right) => left <= right);
    default:
      return true;
  }
}
