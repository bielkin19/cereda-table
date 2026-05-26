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
import { DataTableDatePicker } from './data-table-date-picker';
import { DataTableFacetFilterPopover } from './data-table-facet-filter-popover';
import { useDataTableLocale } from './data-table-locale-context';

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
  // Portal children (e.g. popover checkboxes) bubble through the React tree but
  // are NOT in this DOM subtree. Stopping propagation unconditionally here calls
  // nativeEvent.stopPropagation(), which prevents the Radix DismissableLayer's
  // document-level listener from resetting its inside-click flag — causing the
  // popover to need two outside clicks to close. Only stop when the target is
  // actually inside this DOM node.
  onPointerDown: (event: SyntheticEvent) => {
    if ((event.currentTarget).contains(event.target as Node)) {
      event.stopPropagation();
    }
  },
};


export function DataTableTextFilter<TData extends object>({
  column,
  table,
}: DataTableColumnFilterProps<TData>) {
  const locale = useDataTableLocale();
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
      className="cereda-table__column-filter cereda-table__column-filter--text"
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
            className="cereda-table__column-filter-input"
            type="text"
            placeholder={
              Array.isArray(inFilterValue)
                ? getFacetSummary(options, selectedKeys, allSelected)
                : label
            }
            aria-label={locale.columnFilter.filterAriaLabel(label)}
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
  const locale = useDataTableLocale();
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
      className="cereda-table__column-filter cereda-table__column-filter--number"
      {...stopPointerAndMousePropagation}
    >
      <div className="cereda-table__column-filter-range">
        <input
          className="cereda-table__column-filter-input"
          type="number"
          step="any"
          inputMode="decimal"
          placeholder={locale.columnFilter.minPlaceholder}
          aria-label={locale.columnFilter.minAriaLabel(label)}
          value={minValue}
          onChange={(event) => handleChange('min', event)}
        />
        <input
          className="cereda-table__column-filter-input"
          type="number"
          step="any"
          inputMode="decimal"
          placeholder={locale.columnFilter.maxPlaceholder}
          aria-label={locale.columnFilter.maxAriaLabel(label)}
          value={maxValue}
          onChange={(event) => handleChange('max', event)}
        />
      </div>
      {canClear ? (
        <button
          type="button"
          className="cereda-table__column-filter-clear"
          onClick={handleClear}
          aria-label={locale.columnFilter.clearAriaLabel(label)}
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
  const locale = useDataTableLocale();
  const label = getColumnFilterLabel(column);
  const value =
    normalizeDateFilterValue(getColumnFilterRuleValue(column, table, 'equals')) ?? '';

  function handleChange(ymd: string) {
    setColumnFilterRuleValue(column, ymd, 'equals');
  }

  function handleClear() {
    setColumnFilterRuleValue(column, undefined, 'equals');
  }

  return (
    <div
      className="cereda-table__column-filter cereda-table__column-filter--date"
      {...stopPointerAndMousePropagation}
    >
      <DataTableDatePicker
        label={label}
        inputLabel={locale.columnFilter.inputLabel(label)}
        value={value}
        onChange={handleChange}
        onClear={handleClear}
      />
    </div>
  );
}

export function DataTableDateRangeFilter<TData extends object>({
  column,
  table,
}: DataTableColumnFilterProps<TData>) {
  const locale = useDataTableLocale();
  const label = getColumnFilterLabel(column);
  const value = getRangeFilterRuleValue(
    getColumnFilterRuleValue(column, table, 'between'),
  );
  const fromValue = typeof value?.from === 'string' ? value.from : '';
  const toValue = typeof value?.to === 'string' ? value.to : '';
  const canClear = fromValue.length > 0 || toValue.length > 0;

  function handleChangeFrom(ymd: string) {
    const normalized = normalizeDateRangeFilterValue({ from: ymd, to: value?.to });
    setColumnFilterRuleValue(column, normalized ?? undefined, 'between');
  }

  function handleChangeTo(ymd: string) {
    const normalized = normalizeDateRangeFilterValue({ from: value?.from, to: ymd });
    setColumnFilterRuleValue(column, normalized ?? undefined, 'between');
  }

  function handleClear() {
    setColumnFilterRuleValue(column, undefined, 'between');
  }

  return (
    <div
      className="cereda-table__column-filter cereda-table__column-filter--date-range"
      {...stopPointerAndMousePropagation}
    >
      <div className="cereda-table__column-filter-range">
        <DataTableDatePicker
          label={locale.columnFilter.fromAriaLabel(label)}
          placeholder={locale.columnFilter.fromPlaceholder}
          value={fromValue}
          onChange={handleChangeFrom}
          max={toValue || undefined}
        />
        <DataTableDatePicker
          label={locale.columnFilter.toAriaLabel(label)}
          placeholder={locale.columnFilter.toPlaceholder}
          value={toValue}
          onChange={handleChangeTo}
          min={fromValue || undefined}
        />
      </div>
      {canClear ? (
        <button
          type="button"
          className="cereda-table__column-filter-clear"
          onClick={handleClear}
          aria-label={locale.columnFilter.clearAriaLabel(label)}
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
  const locale = useDataTableLocale();
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
      className="cereda-table__column-filter cereda-table__column-filter--select"
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
            className="cereda-table__column-filter-input cereda-table__column-filter-value"
            onClick={openFilter}
            aria-label={locale.columnFilter.filterAriaLabel(label)}
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
  const locale = useDataTableLocale();
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
      className="cereda-table__column-filter cereda-table__column-filter--multi-select"
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
            className="cereda-table__column-filter-input cereda-table__column-filter-value"
            onClick={openFilter}
            aria-label={locale.columnFilter.filterAriaLabel(label)}
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
  const locale = useDataTableLocale();
  const label = getColumnFilterLabel(column);
  const filterValue = getColumnFilterRuleValue(column, table, 'in');
  const options: PrimitiveOption[] = [
    { key: getPrimitiveFilterKey(true), value: true, label: locale.columnFilter.booleanTrue },
    { key: getPrimitiveFilterKey(false), value: false, label: locale.columnFilter.booleanFalse },
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
      className="cereda-table__column-filter cereda-table__column-filter--boolean"
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
            className="cereda-table__column-filter-input cereda-table__column-filter-value"
            onClick={openFilter}
            aria-label={locale.columnFilter.filterAriaLabel(label)}
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


