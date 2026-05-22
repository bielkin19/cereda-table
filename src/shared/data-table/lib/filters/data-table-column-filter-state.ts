import type { Column, Table } from '@tanstack/react-table';

import type {
  DataTableFilterOperator,
  DataTableFilterRule,
  DataTableFilterValue,
} from '../../types/data-table.types';
import { isDataTableFilterRule } from './data-table-filter-normalization';
import {
  getDataTableFilterRuleId,
  getDefaultDataTableFilterOperator,
} from './data-table-filter-operators';

export type DataTableRangeFilterRuleValue = {
  from?: string | number;
  to?: string | number;
};

export function getColumnFilterRules<TData extends object>(
  column: Column<TData, unknown>,
): DataTableFilterRule[] {
  const filterValue = column.getFilterValue();
  if (!Array.isArray(filterValue)) {
    return [];
  }

  const rules: DataTableFilterRule[] = [];
  for (const entry of filterValue) {
    if (isDataTableFilterRule(entry)) {
      rules.push({
        id: entry.id,
        columnId: entry.columnId,
        operator: entry.operator,
        value: entry.value,
      });
    }
  }

  return rules;
}

export function getColumnFilterRuleValue<TData extends object>(
  column: Column<TData, unknown>,
  table: Table<TData> | undefined,
  operator?: DataTableFilterOperator,
): DataTableFilterValue | undefined {
  const resolvedOperator =
    operator ?? getDefaultDataTableFilterOperator(column.columnDef.meta?.filterVariant);
  const rule = getColumnFilterRules(column).find(
    (currentRule) => currentRule.operator === resolvedOperator,
  );

  if (rule) {
    return rule.value;
  }

  return table?.options.meta?.getFilterRuleValue?.(column.id, resolvedOperator);
}

export function setColumnFilterRuleValue<TData extends object>(
  column: Column<TData, unknown>,
  value: DataTableFilterValue | undefined,
  operator?: DataTableFilterOperator,
): void {
  const resolvedOperator =
    operator ?? getDefaultDataTableFilterOperator(column.columnDef.meta?.filterVariant);
  const nextRuleId = getDataTableFilterRuleId(column.id, resolvedOperator);
  const nextRules = getColumnFilterRules(column).filter(
    (rule) => rule.id !== nextRuleId,
  );

  if (value !== undefined) {
    nextRules.push({
      id: nextRuleId,
      columnId: column.id,
      operator: resolvedOperator,
      value,
    });
  }

  column.setFilterValue(nextRules.length > 0 ? nextRules : undefined);
}

export function getRangeFilterRuleValue(
  value: DataTableFilterValue | undefined,
): DataTableRangeFilterRuleValue | undefined {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return undefined;
  }

  return value;
}
