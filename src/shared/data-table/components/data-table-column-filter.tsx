import type { Column, Table } from '@tanstack/react-table';
import { X } from 'lucide-react';
import { type ChangeEvent, type SyntheticEvent } from 'react';

import {
  getPrimitiveFilterKey,
  normalizeDateFilterValue,
  normalizeDateRangeFilterValue,
  normalizeNumberFilterValue,
  normalizePrimitiveArray,
  normalizeTextFilterValue,
} from '../lib/column-filters';
import {
  getColumnFilterRuleValue,
  getRangeFilterRuleValue,
  setColumnFilterRuleValue,
} from '../lib/filters/data-table-column-filter-state';
import {
  getColumnFilterLabel,
  getFacetSummary,
  getNextPrimitiveFilterSelection,
  getPrimitiveFilterOptions,
  isSupportedFilterVariant,
  type PrimitiveOption,
} from '../lib/filters/data-table-filter-options';
import { DataTableFacetFilterPopover } from './data-table-facet-filter-popover';

export interface DataTableColumnFilterProps<TData extends object> {
  column: Column<TData, unknown>;
  table?: Table<TData>;
}

function stopPropagation(event: SyntheticEvent) {
  event.stopPropagation();
}

const stopPointerAndMousePropagation = {
  onClick: stopPropagation,
  onMouseDown: stopPropagation,
  onPointerDown: stopPropagation,
};


export function DataTableTextFilter<TData extends object>({
  column,
  table,
}: DataTableColumnFilterProps<TData>) {
  const label = getColumnFilterLabel(column);
  const filterValue = getColumnFilterRuleValue(column, table, 'contains');
  const inFilterValue = getColumnFilterRuleValue(column, table, 'in');
  const value = Array.isArray(filterValue)
    ? ''
    : normalizeTextFilterValue(filterValue) ?? '';
  const options = getPrimitiveFilterOptions(column, table);
  const selectedValues = Array.isArray(inFilterValue)
    ? normalizePrimitiveArray(inFilterValue) ?? []
    : [];
  const selectedKeys = selectedValues.map((entry) => getPrimitiveFilterKey(entry));
  const allSelected = !Array.isArray(inFilterValue);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    setColumnFilterRuleValue(column, event.currentTarget.value, 'contains');
  }

  function handleClear() {
    column.setFilterValue(undefined);
  }

  function handleToggle(option: PrimitiveOption, checked: boolean) {
    const nextValues = getNextPrimitiveFilterSelection({
      allSelected,
      checked,
      optionValue: option.value,
      options,
      selectedValues,
    });

    setColumnFilterRuleValue(column, normalizePrimitiveArray(nextValues), 'in');
  }

  function handleToggleAll(checked: boolean) {
    setColumnFilterRuleValue(column, checked ? undefined : [], 'in');
  }

  return (
    <div
      className="data-table__column-filter data-table__column-filter--text"
      {...stopPointerAndMousePropagation}
    >
      <DataTableFacetFilterPopover
        canClear={value.length > 0 || Array.isArray(inFilterValue)}
        allSelected={allSelected}
        label={label}
        onClear={handleClear}
        onToggleAll={handleToggleAll}
        onToggle={handleToggle}
        options={options}
        selectedKeys={selectedKeys}
      >
        {() => (
          <input
            className="data-table__column-filter-input"
            type="text"
            placeholder={
              Array.isArray(inFilterValue)
                ? getFacetSummary(options, selectedKeys, allSelected)
                : label
            }
            aria-label={`Filter ${label}`}
            value={value}
            onChange={handleChange}
          />
        )}
      </DataTableFacetFilterPopover>
    </div>
  );
}

export function DataTableNumberFilter<TData extends object>({
  column,
  table,
}: DataTableColumnFilterProps<TData>) {
  const label = getColumnFilterLabel(column);
  const value = getRangeFilterRuleValue(
    getColumnFilterRuleValue(column, table, 'between'),
  );
  const minValue = value?.from !== undefined ? String(value.from) : '';
  const maxValue = value?.to !== undefined ? String(value.to) : '';
  const canClear = minValue.length > 0 || maxValue.length > 0;

  function handleChange(
    side: 'min' | 'max',
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const nextMin =
      side === 'min' ? normalizeNumberFilterValue(event.currentTarget.value)?.min : value?.from;
    const nextMax =
      side === 'max' ? normalizeNumberFilterValue(event.currentTarget.value)?.min : value?.to;

    const normalizedRange = normalizeNumberFilterValue({
      min: nextMin,
      max: nextMax,
    });
    const nextValue =
      normalizedRange === undefined
        ? undefined
        : { from: normalizedRange.min, to: normalizedRange.max };

    setColumnFilterRuleValue(column, nextValue, 'between');
  }

  function handleClear() {
    setColumnFilterRuleValue(column, undefined, 'between');
  }

  return (
    <div
      className="data-table__column-filter data-table__column-filter--number"
      {...stopPointerAndMousePropagation}
    >
      <div className="data-table__column-filter-range">
        <input
          className="data-table__column-filter-input"
          type="number"
          step="any"
          inputMode="decimal"
          placeholder="Min"
          aria-label={`Minimum ${label} filter`}
          value={minValue}
          onChange={(event) => handleChange('min', event)}
        />
        <input
          className="data-table__column-filter-input"
          type="number"
          step="any"
          inputMode="decimal"
          placeholder="Max"
          aria-label={`Maximum ${label} filter`}
          value={maxValue}
          onChange={(event) => handleChange('max', event)}
        />
      </div>
      {canClear ? (
        <button
          type="button"
          className="data-table__column-filter-clear"
          onClick={handleClear}
          aria-label={`Clear ${label} filter`}
        >
          <X aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}

export function DataTableDateFilter<TData extends object>({
  column,
  table,
}: DataTableColumnFilterProps<TData>) {
  const label = getColumnFilterLabel(column);
  const value =
    normalizeDateFilterValue(getColumnFilterRuleValue(column, table, 'equals')) ?? '';

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    setColumnFilterRuleValue(column, event.currentTarget.value, 'equals');
  }

  function handleClear() {
    setColumnFilterRuleValue(column, undefined, 'equals');
  }

  return (
    <div
      className="data-table__column-filter data-table__column-filter--date"
      {...stopPointerAndMousePropagation}
    >
      <input
        className="data-table__column-filter-input"
        type="date"
        aria-label={`Filter ${label}`}
        value={value}
        onChange={handleChange}
      />
      {value ? (
        <button
          type="button"
          className="data-table__column-filter-clear"
          onClick={handleClear}
          aria-label={`Clear ${label} filter`}
        >
          <X aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}

export function DataTableDateRangeFilter<TData extends object>({
  column,
  table,
}: DataTableColumnFilterProps<TData>) {
  const label = getColumnFilterLabel(column);
  const value = getRangeFilterRuleValue(
    getColumnFilterRuleValue(column, table, 'between'),
  );
  const fromValue = value?.from !== undefined ? String(value.from) : '';
  const toValue = value?.to !== undefined ? String(value.to) : '';
  const canClear = fromValue.length > 0 || toValue.length > 0;

  function handleChange(
    side: 'from' | 'to',
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const nextFrom =
      side === 'from'
        ? normalizeDateFilterValue(event.currentTarget.value)
        : value?.from;
    const nextTo =
      side === 'to' ? normalizeDateFilterValue(event.currentTarget.value) : value?.to;

    const normalizedRange = normalizeDateRangeFilterValue({
      from: nextFrom,
      to: nextTo,
    });
    const nextValue =
      normalizedRange === undefined
        ? undefined
        : { from: normalizedRange.from, to: normalizedRange.to };

    setColumnFilterRuleValue(column, nextValue, 'between');
  }

  function handleClear() {
    setColumnFilterRuleValue(column, undefined, 'between');
  }

  return (
    <div
      className="data-table__column-filter data-table__column-filter--date-range"
      {...stopPointerAndMousePropagation}
    >
      <div className="data-table__column-filter-range">
        <input
          className="data-table__column-filter-input"
          type="date"
          aria-label={`From ${label}`}
          value={fromValue}
          onChange={(event) => handleChange('from', event)}
        />
        <input
          className="data-table__column-filter-input"
          type="date"
          aria-label={`To ${label}`}
          value={toValue}
          onChange={(event) => handleChange('to', event)}
        />
      </div>
      {canClear ? (
        <button
          type="button"
          className="data-table__column-filter-clear"
          onClick={handleClear}
          aria-label={`Clear ${label} filter`}
        >
          <X aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}

export function DataTableSelectFilter<TData extends object>({
  column,
  table,
}: DataTableColumnFilterProps<TData>) {
  const label = getColumnFilterLabel(column);
  const inValue = getColumnFilterRuleValue(column, table, 'in');
  const filterValue = inValue;
  const options = getPrimitiveFilterOptions(column, table);
  const selectedValues = normalizePrimitiveArray(filterValue) ?? [];
  const selectedKeys = selectedValues.map((entry) => getPrimitiveFilterKey(entry));
  const allSelected = filterValue === undefined;

  function handleToggle(option: PrimitiveOption, checked: boolean) {
    const nextValues = getNextPrimitiveFilterSelection({
      allSelected,
      checked,
      optionValue: option.value,
      options,
      selectedValues,
    });

    const normalized = normalizePrimitiveArray(nextValues);
    setColumnFilterRuleValue(column, normalized, 'in');
  }

  function handleToggleAll(checked: boolean) {
    setColumnFilterRuleValue(column, checked ? undefined : [], 'in');
  }

  function handleClear() {
    setColumnFilterRuleValue(column, undefined, 'in');
  }

  return (
    <div
      className="data-table__column-filter data-table__column-filter--select"
      {...stopPointerAndMousePropagation}
    >
      <DataTableFacetFilterPopover
        allSelected={allSelected}
        label={label}
        onClear={handleClear}
        onToggleAll={handleToggleAll}
        onToggle={handleToggle}
        options={options}
        selectedKeys={selectedKeys}
      >
        {(openFilter) => (
          <button
            type="button"
            className="data-table__column-filter-input data-table__column-filter-value"
            onClick={openFilter}
            aria-label={`Filter ${label}`}
          >
            {getFacetSummary(options, selectedKeys, allSelected)}
          </button>
        )}
      </DataTableFacetFilterPopover>
    </div>
  );
}

export function DataTableMultiSelectFilter<TData extends object>({
  column,
  table,
}: DataTableColumnFilterProps<TData>) {
  const label = getColumnFilterLabel(column);
  const filterValue = getColumnFilterRuleValue(column, table, 'in');
  const options = getPrimitiveFilterOptions(column, table);
  const selectedValues = normalizePrimitiveArray(filterValue) ?? [];
  const selectedKeys = selectedValues.map((value) => getPrimitiveFilterKey(value));
  const allSelected = filterValue === undefined;

  function handleToggle(option: PrimitiveOption, checked: boolean) {
    const nextValues = getNextPrimitiveFilterSelection({
      allSelected,
      checked,
      optionValue: option.value,
      options,
      selectedValues,
    });

    setColumnFilterRuleValue(column, normalizePrimitiveArray(nextValues), 'in');
  }

  function handleToggleAll(checked: boolean) {
    setColumnFilterRuleValue(column, checked ? undefined : [], 'in');
  }

  function handleClear() {
    setColumnFilterRuleValue(column, undefined, 'in');
  }

  return (
    <div
      className="data-table__column-filter data-table__column-filter--multi-select"
      {...stopPointerAndMousePropagation}
    >
      <DataTableFacetFilterPopover
        allSelected={allSelected}
        label={label}
        onClear={handleClear}
        onToggleAll={handleToggleAll}
        onToggle={handleToggle}
        options={options}
        selectedKeys={selectedKeys}
      >
        {(openFilter) => (
          <button
            type="button"
            className="data-table__column-filter-input data-table__column-filter-value"
            onClick={openFilter}
            aria-label={`Filter ${label}`}
          >
            {getFacetSummary(options, selectedKeys, allSelected)}
          </button>
        )}
      </DataTableFacetFilterPopover>
    </div>
  );
}

export function DataTableBooleanFilter<TData extends object>({
  column,
  table,
}: DataTableColumnFilterProps<TData>) {
  const label = getColumnFilterLabel(column);
  const filterValue = getColumnFilterRuleValue(column, table, 'in');
  const options: PrimitiveOption[] = [
    { key: getPrimitiveFilterKey(true), value: true, label: 'Yes' },
    { key: getPrimitiveFilterKey(false), value: false, label: 'No' },
  ];
  const selectedValues = normalizePrimitiveArray(filterValue) ?? [];
  const selectedKeys = selectedValues.map((entry) => getPrimitiveFilterKey(entry));
  const allSelected = filterValue === undefined;

  function handleToggle(option: PrimitiveOption, checked: boolean) {
    const nextValues = getNextPrimitiveFilterSelection({
      allSelected,
      checked,
      optionValue: option.value,
      options,
      selectedValues,
    });

    const normalized = normalizePrimitiveArray(nextValues);
    setColumnFilterRuleValue(column, normalized, 'in');
  }

  function handleToggleAll(checked: boolean) {
    setColumnFilterRuleValue(column, checked ? undefined : [], 'in');
  }

  function handleClear() {
    setColumnFilterRuleValue(column, undefined, 'in');
  }

  return (
    <div
      className="data-table__column-filter data-table__column-filter--boolean"
      {...stopPointerAndMousePropagation}
    >
      <DataTableFacetFilterPopover
        allSelected={allSelected}
        label={label}
        onClear={handleClear}
        onToggleAll={handleToggleAll}
        onToggle={handleToggle}
        options={options}
        selectedKeys={selectedKeys}
      >
        {(openFilter) => (
          <button
            type="button"
            className="data-table__column-filter-input data-table__column-filter-value"
            onClick={openFilter}
            aria-label={`Filter ${label}`}
          >
            {getFacetSummary(options, selectedKeys, allSelected)}
          </button>
        )}
      </DataTableFacetFilterPopover>
    </div>
  );
}

export function DataTableColumnFilter<TData extends object>({
  column,
  table,
}: DataTableColumnFilterProps<TData>) {
  if (!column.getCanFilter()) {
    return null;
  }

  const filterVariant = column.columnDef.meta?.filterVariant;
  if (!isSupportedFilterVariant(filterVariant)) {
    return null;
  }

  if (filterVariant === 'text') {
    return <DataTableTextFilter column={column} table={table} />;
  }

  if (filterVariant === 'number') {
    return <DataTableNumberFilter column={column} table={table} />;
  }

  if (filterVariant === 'date') {
    return <DataTableDateFilter column={column} table={table} />;
  }

  if (filterVariant === 'date-range') {
    return <DataTableDateRangeFilter column={column} table={table} />;
  }

  if (filterVariant === 'select') {
    return <DataTableSelectFilter column={column} table={table} />;
  }

  if (filterVariant === 'multi-select') {
    return <DataTableMultiSelectFilter column={column} table={table} />;
  }

  return <DataTableBooleanFilter column={column} table={table} />;
}

