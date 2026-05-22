import type {
  ColumnDef,
  ColumnFiltersState,
  FilterFn,
  Table,
} from '@tanstack/react-table';

import type { DataTableFilterVariant } from '../types/data-table.types';
import { isDataTableAutoGroupColumnId } from './auto-group-column';

export type DataTablePrimitiveFilterValue = string | number | boolean;

export interface DataTableNumberFilterValue {
  min?: number;
  max?: number;
}

export interface DataTableDateRangeFilterValue {
  from?: string;
  to?: string;
}

export type DataTableMultiSelectFilterValue = DataTablePrimitiveFilterValue[];

type SupportedFilterVariant = DataTableFilterVariant;
type SupportedFilterFnName =
  | 'dataTableText'
  | 'dataTableNumber'
  | 'dataTableDate'
  | 'dataTableDateRange'
  | 'dataTableSelect'
  | 'dataTableMultiSelect'
  | 'dataTableBoolean';

export const DATA_TABLE_FILTER_FN_NAMES = {
  text: 'dataTableText',
  number: 'dataTableNumber',
  date: 'dataTableDate',
  'date-range': 'dataTableDateRange',
  select: 'dataTableSelect',
  'multi-select': 'dataTableMultiSelect',
  boolean: 'dataTableBoolean',
} as const satisfies Record<DataTableFilterVariant, SupportedFilterFnName>;

const DATE_KEY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const DATE_PREFIX_PATTERN = /^(\d{4})-(\d{2})-(\d{2})(?:[T\s].*)?$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isUnknownArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

function padDatePart(value: number): string {
  return String(value).padStart(2, '0');
}

function isValidCalendarDate(year: number, month: number, day: number): boolean {
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function formatDateKey(date: Date): string {
  return [
    date.getFullYear(),
    padDatePart(date.getMonth() + 1),
    padDatePart(date.getDate()),
  ].join('-');
}

export function normalizeStringValue(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
}

export function normalizeNumberValue(value: unknown): number | undefined {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : undefined;
  }

  if (typeof value !== 'string') {
    return undefined;
  }

  const normalized = value.trim();
  if (normalized.length === 0) {
    return undefined;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function normalizeDateKey(value: unknown): string | undefined {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? undefined : formatDateKey(value);
  }

  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      return undefined;
    }

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? undefined : formatDateKey(date);
  }

  if (typeof value !== 'string') {
    return undefined;
  }

  const normalized = value.trim();
  if (normalized.length === 0) {
    return undefined;
  }

  const dateMatch = DATE_PREFIX_PATTERN.exec(normalized);
  if (dateMatch) {
    const year = Number(dateMatch[1]);
    const month = Number(dateMatch[2]);
    const day = Number(dateMatch[3]);

    if (!isValidCalendarDate(year, month, day)) {
      return undefined;
    }

    if (DATE_KEY_PATTERN.test(normalized)) {
      return normalized;
    }
  }

  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) {
    return undefined;
  }

  return formatDateKey(parsed);
}

export function normalizePrimitiveFilterValue(
  value: unknown,
): DataTablePrimitiveFilterValue | undefined {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : undefined;
  }

  return normalizeStringValue(value);
}

export function normalizePrimitiveArray(
  value: unknown,
): DataTablePrimitiveFilterValue[] | undefined {
  if (!Array.isArray(value)) {
    const normalizedEntry = normalizePrimitiveFilterValue(value);
    return normalizedEntry !== undefined ? [normalizedEntry] : undefined;
  }

  const normalized: DataTablePrimitiveFilterValue[] = [];
  const seen = new Set<string>();

  for (const entry of value) {
    const normalizedEntry = normalizePrimitiveFilterValue(entry);
    if (normalizedEntry === undefined) {
      continue;
    }

    const key = `${typeof normalizedEntry}:${String(normalizedEntry)}`;
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    normalized.push(normalizedEntry);
  }

  return normalized;
}

export function normalizeTextFilterValue(value: unknown): string | undefined {
  return normalizeStringValue(value);
}

export function normalizeTextOrPrimitiveArrayFilterValue(
  value: unknown,
): string | DataTablePrimitiveFilterValue[] | undefined {
  const normalizedText = normalizeTextFilterValue(value);
  if (normalizedText !== undefined) {
    return normalizedText;
  }

  return normalizePrimitiveArray(value);
}

export function normalizeNumberFilterValue(
  value: unknown,
): DataTableNumberFilterValue | undefined {
  if (typeof value === 'number' || typeof value === 'string') {
    const normalized = normalizeNumberValue(value);
    return normalized === undefined ? undefined : { min: normalized };
  }

  if (!isRecord(value)) {
    return undefined;
  }

  const min = normalizeNumberValue(value.min);
  const max = normalizeNumberValue(value.max);

  if (min === undefined && max === undefined) {
    return undefined;
  }

  if (min !== undefined && max !== undefined && min > max) {
    return {
      min: max,
      max: min,
    };
  }

  return {
    min,
    max,
  };
}

export function normalizeDateFilterValue(value: unknown): string | undefined {
  return normalizeDateKey(value);
}

export function normalizeDateRangeFilterValue(
  value: unknown,
): DataTableDateRangeFilterValue | undefined {
  if (isUnknownArray(value)) {
    const from = value[0];
    const to = value[1];
    return normalizeDateRangeFilterValue({ from, to });
  }

  if (!isRecord(value)) {
    return undefined;
  }

  const from = normalizeDateFilterValue(value.from);
  const to = normalizeDateFilterValue(value.to);

  if (!from && !to) {
    return undefined;
  }

  if (from && to && from > to) {
    return {
      from: to,
      to: from,
    };
  }

  return {
    from,
    to,
  };
}

export function normalizeBooleanFilterValue(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined;
}

function normalizeExplicitPrimitiveArrayFilterValue(
  value: unknown,
): DataTablePrimitiveFilterValue[] | undefined {
  const normalized = normalizePrimitiveArray(value);
  if (Array.isArray(value) && value.length > 0 && normalized?.length === 0) {
    return undefined;
  }

  return normalized;
}

export function normalizeColumnFilterValueForVariant(
  variant: SupportedFilterVariant | undefined,
  value: unknown,
): unknown {
  switch (variant) {
    case 'text':
      return normalizeTextOrPrimitiveArrayFilterValue(value);
    case 'number':
      return normalizeNumberFilterValue(value);
    case 'date':
      return normalizeDateFilterValue(value);
    case 'date-range':
      return normalizeDateRangeFilterValue(value);
    case 'select':
      return (
        normalizeExplicitPrimitiveArrayFilterValue(value) ??
        normalizePrimitiveFilterValue(value)
      );
    case 'multi-select':
      return normalizeExplicitPrimitiveArrayFilterValue(value);
    case 'boolean':
      return (
        normalizeExplicitPrimitiveArrayFilterValue(value) ??
        normalizeBooleanFilterValue(value)
      );
    default:
      return value;
  }
}

interface DataTableRuleFilterValue {
  columnId: string;
  operator: string;
  value: unknown;
}

function isRuleFilterValue(value: unknown): value is DataTableRuleFilterValue {
  return (
    isRecord(value) &&
    typeof value.columnId === 'string' &&
    typeof value.operator === 'string' &&
    'value' in value
  );
}

function isEmptyRowValue(value: unknown) {
  return (
    value === null ||
    value === undefined ||
    (typeof value === 'string' && value.trim().length === 0) ||
    (Array.isArray(value) && value.length === 0)
  );
}

function evaluateRule(rowValue: unknown, rule: DataTableRuleFilterValue) {
  if (rule.operator === 'isEmpty') {
    return isEmptyRowValue(rowValue);
  }

  if (rule.operator === 'isNotEmpty') {
    return !isEmptyRowValue(rowValue);
  }

  if (rule.operator === 'contains') {
    const normalizedFilterValue = normalizeTextFilterValue(rule.value);
    if (!normalizedFilterValue) {
      return true;
    }

    const rowText =
      typeof rowValue === 'string'
        ? rowValue
        : typeof rowValue === 'number' || typeof rowValue === 'boolean'
          ? String(rowValue)
          : '';
    return rowText.toLocaleLowerCase().includes(normalizedFilterValue.toLocaleLowerCase());
  }

  if (rule.operator === 'in') {
    const normalizedFilterValue = normalizePrimitiveArray(rule.value);
    if (normalizedFilterValue === undefined) {
      return true;
    }

    const rowKey = getRowPrimitiveFilterKey(rowValue);
    if (!rowKey) {
      return false;
    }

    const selected = new Set(
      normalizedFilterValue.map((entry) => getPrimitiveFilterKey(entry)),
    );
    return selected.has(rowKey);
  }

  if (rule.operator === 'equals') {
    const primitiveFilterValue = normalizePrimitiveFilterValue(rule.value);
    if (primitiveFilterValue !== undefined) {
      const rowKey = getRowPrimitiveFilterKey(rowValue);
      if (rowKey !== undefined) {
        return rowKey === getPrimitiveFilterKey(primitiveFilterValue);
      }
    }

    const dateFilterValue = normalizeDateFilterValue(rule.value);
    const rowDate = getDateRowValue(rowValue);
    return dateFilterValue !== undefined && rowDate === dateFilterValue;
  }

  if (rule.operator === 'between') {
    const numberFilterValue = normalizeNumberFilterValue({
      min: isRecord(rule.value) ? rule.value.from : undefined,
      max: isRecord(rule.value) ? rule.value.to : undefined,
    });
    const rowNumber = getNumberRowValue(rowValue);
    if (numberFilterValue && rowNumber !== undefined) {
      if (numberFilterValue.min !== undefined && rowNumber < numberFilterValue.min) {
        return false;
      }
      if (numberFilterValue.max !== undefined && rowNumber > numberFilterValue.max) {
        return false;
      }
      return true;
    }

    const dateFilterValue = normalizeDateRangeFilterValue(rule.value);
    const rowDate = getDateRowValue(rowValue);
    if (!dateFilterValue || !rowDate) {
      return false;
    }
    if (dateFilterValue.from && rowDate < dateFilterValue.from) {
      return false;
    }
    if (dateFilterValue.to && rowDate > dateFilterValue.to) {
      return false;
    }
    return true;
  }

  const rowNumber = getNumberRowValue(rowValue);
  const filterNumber = normalizeNumberValue(rule.value);
  if (rowNumber !== undefined && filterNumber !== undefined) {
    if (rule.operator === 'greaterThan') {
      return rowNumber > filterNumber;
    }
    if (rule.operator === 'greaterThanOrEqual') {
      return rowNumber >= filterNumber;
    }
    if (rule.operator === 'lessThan') {
      return rowNumber < filterNumber;
    }
    if (rule.operator === 'lessThanOrEqual') {
      return rowNumber <= filterNumber;
    }
  }

  const rowDate = getDateRowValue(rowValue);
  const filterDate = normalizeDateFilterValue(rule.value);
  if (rowDate && filterDate) {
    if (rule.operator === 'greaterThan') {
      return rowDate > filterDate;
    }
    if (rule.operator === 'greaterThanOrEqual') {
      return rowDate >= filterDate;
    }
    if (rule.operator === 'lessThan') {
      return rowDate < filterDate;
    }
    if (rule.operator === 'lessThanOrEqual') {
      return rowDate <= filterDate;
    }
  }

  return true;
}

function evaluateRuleFilterValue(rowValue: unknown, filterValue: unknown): boolean | undefined {
  if (!Array.isArray(filterValue) || !filterValue.every(isRuleFilterValue)) {
    return undefined;
  }

  return filterValue.every((rule) => evaluateRule(rowValue, rule));
}

function isRuleFilterArray(value: unknown) {
  return Array.isArray(value) && value.every(isRuleFilterValue);
}

export function normalizeColumnFiltersStateForTable<TData extends object>(
  table: Table<TData>,
  value: ColumnFiltersState,
): ColumnFiltersState {
  const columnsById = new Map(
    table
      .getAllLeafColumns()
      .filter((column) => !isDataTableAutoGroupColumnId(column.id))
      .map((column) => [column.id, column] as const),
  );

  return value.reduce<ColumnFiltersState>((accumulator, entry) => {
    const column = columnsById.get(entry.id);
    if (!column) {
      return accumulator;
    }

    const normalizedValue = normalizeColumnFilterValueForVariant(
      column.columnDef.meta?.filterVariant,
      entry.value,
    );

    if (normalizedValue === undefined) {
      return accumulator;
    }

    accumulator.push({
      id: entry.id,
      value: normalizedValue,
    });
    return accumulator;
  }, []);
}

function getPrimitiveRowValue(value: unknown): DataTablePrimitiveFilterValue | undefined {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : undefined;
  }

  return normalizeStringValue(value);
}

function getNumberRowValue(value: unknown): number | undefined {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : undefined;
  }

  if (typeof value === 'string') {
    return normalizeNumberValue(value);
  }

  return undefined;
}

function getDateRowValue(value: unknown): string | undefined {
  return normalizeDateKey(value);
}

export function getPrimitiveFilterKey(value: DataTablePrimitiveFilterValue): string {
  if (typeof value === 'string') {
    return `string:${encodeURIComponent(value)}`;
  }

  return `${typeof value}:${String(value)}`;
}

export function parseSerializedFilterValue(
  value: string,
): DataTablePrimitiveFilterValue | undefined {
  try {
    const [valueType, rawValue] = value.split(':', 2);

    if (valueType === 'string') {
      return normalizeStringValue(decodeURIComponent(rawValue ?? ''));
    }

    if (valueType === 'number') {
      return normalizeNumberValue(decodeURIComponent(rawValue ?? ''));
    }

    if (valueType === 'boolean') {
      const decoded = decodeURIComponent(rawValue ?? '');
      if (decoded === 'true') {
        return true;
      }
      if (decoded === 'false') {
        return false;
      }
      return undefined;
    }
  } catch {
    return undefined;
  }

  return undefined;
}

export function getRowPrimitiveFilterKey(value: unknown): string | undefined {
  const normalized = getPrimitiveRowValue(value);
  return normalized !== undefined ? getPrimitiveFilterKey(normalized) : undefined;
}

function createTextFilterFn<TData extends object>(): FilterFn<TData> {
  const filterFn: FilterFn<TData> = (row, columnId, filterValue) => {
    const ruleResult = evaluateRuleFilterValue(row.getValue(columnId), filterValue);
    if (ruleResult !== undefined) {
      return ruleResult;
    }

    const normalizedFilterValue = normalizeTextOrPrimitiveArrayFilterValue(filterValue);
    if (!normalizedFilterValue) {
      return true;
    }

    const rowValue = row.getValue(columnId);
    if (Array.isArray(normalizedFilterValue)) {
      const rowKey = getRowPrimitiveFilterKey(rowValue);
      if (!rowKey) {
        return false;
      }

      const selected = new Set(
        normalizedFilterValue.map((entry) => getPrimitiveFilterKey(entry)),
      );

      return selected.has(rowKey);
    }

    const rowText =
      typeof rowValue === 'string'
        ? rowValue
        : typeof rowValue === 'number' || typeof rowValue === 'boolean'
          ? String(rowValue)
          : '';
    return rowText.toLocaleLowerCase().includes(normalizedFilterValue.toLocaleLowerCase());
  };

  filterFn.autoRemove = (value: unknown) =>
    !isRuleFilterArray(value) &&
    normalizeTextOrPrimitiveArrayFilterValue(value) === undefined;
  return filterFn;
}

function createNumberFilterFn<TData extends object>(): FilterFn<TData> {
  const filterFn: FilterFn<TData> = (row, columnId, filterValue) => {
    const ruleResult = evaluateRuleFilterValue(row.getValue(columnId), filterValue);
    if (ruleResult !== undefined) {
      return ruleResult;
    }

    const normalizedFilterValue = normalizeNumberFilterValue(filterValue);
    if (!normalizedFilterValue) {
      return true;
    }

    const rowValue = getNumberRowValue(row.getValue(columnId));
    if (rowValue === undefined) {
      return false;
    }

    const { min, max } = normalizedFilterValue;
    if (min !== undefined && rowValue < min) {
      return false;
    }
    if (max !== undefined && rowValue > max) {
      return false;
    }
    return true;
  };

  filterFn.autoRemove = (value: unknown) =>
    !isRuleFilterArray(value) && normalizeNumberFilterValue(value) === undefined;
  return filterFn;
}

function createDateFilterFn<TData extends object>(): FilterFn<TData> {
  const filterFn: FilterFn<TData> = (row, columnId, filterValue) => {
    const ruleResult = evaluateRuleFilterValue(row.getValue(columnId), filterValue);
    if (ruleResult !== undefined) {
      return ruleResult;
    }

    const normalizedFilterValue = normalizeDateFilterValue(filterValue);
    if (!normalizedFilterValue) {
      return true;
    }

    const rowValue = getDateRowValue(row.getValue(columnId));
    if (!rowValue) {
      return false;
    }

    return rowValue === normalizedFilterValue;
  };

  filterFn.autoRemove = (value: unknown) =>
    !isRuleFilterArray(value) && normalizeDateFilterValue(value) === undefined;
  return filterFn;
}

function createDateRangeFilterFn<TData extends object>(): FilterFn<TData> {
  const filterFn: FilterFn<TData> = (row, columnId, filterValue) => {
    const ruleResult = evaluateRuleFilterValue(row.getValue(columnId), filterValue);
    if (ruleResult !== undefined) {
      return ruleResult;
    }

    const normalizedFilterValue = normalizeDateRangeFilterValue(filterValue);
    if (!normalizedFilterValue) {
      return true;
    }

    const rowValue = getDateRowValue(row.getValue(columnId));
    if (!rowValue) {
      return false;
    }

    const { from, to } = normalizedFilterValue;
    if (from !== undefined && rowValue < from) {
      return false;
    }
    if (to !== undefined && rowValue > to) {
      return false;
    }
    return true;
  };

  filterFn.autoRemove = (value: unknown) =>
    !isRuleFilterArray(value) && normalizeDateRangeFilterValue(value) === undefined;
  return filterFn;
}

function createSelectFilterFn<TData extends object>(): FilterFn<TData> {
  const filterFn: FilterFn<TData> = (row, columnId, filterValue) => {
    const ruleResult = evaluateRuleFilterValue(row.getValue(columnId), filterValue);
    if (ruleResult !== undefined) {
      return ruleResult;
    }

    const normalizedArrayValue = normalizePrimitiveArray(filterValue);
    if (normalizedArrayValue !== undefined) {
      const rowKey = getRowPrimitiveFilterKey(row.getValue(columnId));
      if (!rowKey) {
        return false;
      }

      const selected = new Set(
        normalizedArrayValue.map((entry) => getPrimitiveFilterKey(entry)),
      );

      return selected.has(rowKey);
    }

    const normalizedFilterValue = normalizePrimitiveFilterValue(filterValue);
    if (normalizedFilterValue === undefined) {
      return true;
    }

    const rowKey = getRowPrimitiveFilterKey(row.getValue(columnId));
    if (!rowKey) {
      return false;
    }

    return rowKey === getPrimitiveFilterKey(normalizedFilterValue);
  };

  filterFn.autoRemove = (value: unknown) =>
    !isRuleFilterArray(value) &&
    normalizePrimitiveArray(value) === undefined &&
    normalizePrimitiveFilterValue(value) === undefined;
  return filterFn;
}

function createMultiSelectFilterFn<TData extends object>(): FilterFn<TData> {
  const filterFn: FilterFn<TData> = (row, columnId, filterValue) => {
    const ruleResult = evaluateRuleFilterValue(row.getValue(columnId), filterValue);
    if (ruleResult !== undefined) {
      return ruleResult;
    }

    const normalizedFilterValue = normalizePrimitiveArray(filterValue);
    if (normalizedFilterValue === undefined) {
      return true;
    }

    const rowKey = getRowPrimitiveFilterKey(row.getValue(columnId));
    if (!rowKey) {
      return false;
    }

    const selected = new Set(
      normalizedFilterValue.map((entry) => getPrimitiveFilterKey(entry)),
    );

    return selected.has(rowKey);
  };

  filterFn.autoRemove = (value: unknown) =>
    !isRuleFilterArray(value) &&
    normalizePrimitiveArray(value) === undefined;
  return filterFn;
}

function createBooleanFilterFn<TData extends object>(): FilterFn<TData> {
  const filterFn: FilterFn<TData> = (row, columnId, filterValue) => {
    const ruleResult = evaluateRuleFilterValue(row.getValue(columnId), filterValue);
    if (ruleResult !== undefined) {
      return ruleResult;
    }

    const normalizedArrayValue = normalizePrimitiveArray(filterValue);
    if (normalizedArrayValue !== undefined) {
      const booleanValues = normalizedArrayValue.filter(
        (entry): entry is boolean => typeof entry === 'boolean',
      );

      if (booleanValues.length === 0) {
        return false;
      }

      return booleanValues.includes(row.getValue(columnId) === true);
    }

    const normalizedFilterValue = normalizeBooleanFilterValue(filterValue);
    if (normalizedFilterValue === undefined) {
      return true;
    }

    const rowValue = row.getValue(columnId);
    return rowValue === normalizedFilterValue;
  };

  filterFn.autoRemove = (value: unknown) =>
    !isRuleFilterArray(value) &&
    normalizePrimitiveArray(value) === undefined &&
    normalizeBooleanFilterValue(value) === undefined;
  return filterFn;
}

export function createDataTableFilterFns<TData extends object>(): Record<
  SupportedFilterFnName,
  FilterFn<TData>
> {
  return {
    dataTableText: createTextFilterFn<TData>(),
    dataTableNumber: createNumberFilterFn<TData>(),
    dataTableDate: createDateFilterFn<TData>(),
    dataTableDateRange: createDateRangeFilterFn<TData>(),
    dataTableSelect: createSelectFilterFn<TData>(),
    dataTableMultiSelect: createMultiSelectFilterFn<TData>(),
    dataTableBoolean: createBooleanFilterFn<TData>(),
  };
}

type ColumnDefWithChildren<TData extends object> = ColumnDef<TData, unknown> & {
  columns: ColumnDef<TData, unknown>[];
};

function hasNestedColumns<TData extends object>(
  column: ColumnDef<TData, unknown>,
): column is ColumnDefWithChildren<TData> {
  return 'columns' in column && Array.isArray(column.columns);
}

function getDataTableFilterFnName(
  variant: SupportedFilterVariant | undefined,
): SupportedFilterFnName | undefined {
  if (!variant) {
    return undefined;
  }

  return DATA_TABLE_FILTER_FN_NAMES[variant] ?? undefined;
}

export function applyDataTableFilterFnsToColumns<TData extends object>(
  columns: ColumnDef<TData, unknown>[],
): ColumnDef<TData, unknown>[] {
  const filterFns = createDataTableFilterFns<TData>();

  function applyColumns(
    currentColumns: ColumnDef<TData, unknown>[],
  ): ColumnDef<TData, unknown>[] {
    return currentColumns.map((column) => {
      if (hasNestedColumns(column)) {
        return {
          ...column,
          columns: applyColumns(column.columns),
        };
      }

      if (column.filterFn !== undefined) {
        return column;
      }

      const filterFn = getDataTableFilterFnName(column.meta?.filterVariant);
      if (!filterFn) {
        return column;
      }

      return {
        ...column,
        filterFn: filterFns[filterFn],
      };
    });
  }

  return applyColumns(columns);
}
