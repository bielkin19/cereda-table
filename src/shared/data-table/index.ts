// Public API — only stable, consumer-facing exports live here.
// TanStack implementation details stay inside the module.

export { DataTable } from './components/data-table';
export { useDataTable } from './hooks/use-data-table';
export type {
  DataTableColumnBuilderOptions,
  DataTableColumnKey,
  DataTableColumnSchema,
  DataTableColumnSchemaMap,
  DataTableColumnSchemaType,
  DataTableColumnsInput,
  DataTableConfig,
  DataTableConfigOptions,
  DataTablePreset,
} from './lib/data-table-config';
export {
  booleanColumn,
  createDataTableColumns,
  createDataTableConfig,
  dataColumn,
  dateColumn,
  dateRangeColumn,
  multiSelectColumn,
  numberColumn,
  selectColumn,
  textColumn,
} from './lib/data-table-config';
export type {
  DataTableAlign,
  DataTableFilterOperator,
  DataTableFilterRule,
  DataTableFilterValue,
  DataTableFilterVariant,
  DataTableInitialState,
  DataTableMode,
  DataTableProps,
  UseDataTableOptions,
} from './types/data-table.types';
