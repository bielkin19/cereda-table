import type {
  DataTableFilterOperator,
  DataTableFilterVariant,
} from '../../types/data-table.types';

export const DATA_TABLE_FILTER_OPERATORS_BY_VARIANT = {
  text: ['contains', 'equals', 'isEmpty', 'isNotEmpty'],
  select: ['equals', 'in'],
  boolean: ['equals', 'in'],
  number: [
    'equals',
    'greaterThan',
    'greaterThanOrEqual',
    'lessThan',
    'lessThanOrEqual',
    'between',
    'isEmpty',
    'isNotEmpty',
  ],
  date: ['equals', 'greaterThan', 'lessThan', 'between', 'isEmpty', 'isNotEmpty'],
  'date-range': ['between', 'isEmpty', 'isNotEmpty'],
  'multi-select': ['in'],
} as const satisfies Record<DataTableFilterVariant, readonly DataTableFilterOperator[]>;

export const DATA_TABLE_DEFAULT_FILTER_OPERATOR_BY_VARIANT = {
  text: 'contains',
  select: 'equals',
  boolean: 'equals',
  number: 'between',
  date: 'equals',
  'date-range': 'between',
  'multi-select': 'in',
} as const satisfies Record<DataTableFilterVariant, DataTableFilterOperator>;

export function getDataTableFilterOperatorsForVariant(
  variant: DataTableFilterVariant | undefined,
): readonly DataTableFilterOperator[] {
  return variant ? DATA_TABLE_FILTER_OPERATORS_BY_VARIANT[variant] : [];
}

export function getDefaultDataTableFilterOperator(
  variant: DataTableFilterVariant | undefined,
): DataTableFilterOperator {
  return variant ? DATA_TABLE_DEFAULT_FILTER_OPERATOR_BY_VARIANT[variant] : 'equals';
}

export function isDataTableFilterOperator(value: unknown): value is DataTableFilterOperator {
  return (
    value === 'contains' ||
    value === 'equals' ||
    value === 'in' ||
    value === 'between' ||
    value === 'isEmpty' ||
    value === 'isNotEmpty' ||
    value === 'greaterThan' ||
    value === 'greaterThanOrEqual' ||
    value === 'lessThan' ||
    value === 'lessThanOrEqual'
  );
}

export function getDataTableFilterRuleId(
  columnId: string,
  operator: DataTableFilterOperator,
): string {
  return `${columnId}:${operator}`;
}
