import type { ColumnDef } from '@tanstack/react-table';

import type {
  DataTableAlign,
  DataTableFilterVariant,
  UseDataTableOptions,
} from '../types/data-table.types';

export type DataTablePreset =
  | 'basic'
  | 'interactive'
  | 'enterprise'
  | 'minimal';

export type DataTableColumnKey<TData extends object> = Extract<keyof TData, string>;
export type DataTableColumnSchemaType =
  | 'boolean'
  | 'data'
  | 'date'
  | 'date-range'
  | 'multi-select'
  | 'number'
  | 'select'
  | 'text';

type DataTableColumnMetaInput = {
  align?: DataTableAlign;
  description?: string;
  enableExport?: boolean;
  enableGrouping?: boolean;
  label?: string;
};

export type DataTableColumnBuilderOptions<TData extends object> = Omit<
  ColumnDef<TData, unknown>,
  'accessorKey' | 'header' | 'meta'
> &
  DataTableColumnMetaInput & {
    header?: ColumnDef<TData, unknown>['header'];
    meta?: Omit<
      NonNullable<ColumnDef<TData, unknown>['meta']>,
      'align' | 'description' | 'enableExport' | 'enableGrouping' | 'filterVariant' | 'label'
    >;
  };

export type DataTableColumnSchema<TData extends object> =
  DataTableColumnBuilderOptions<TData> & {
    type?: DataTableColumnSchemaType;
  };

export type DataTableColumnSchemaMap<TData extends object> = Partial<
  Record<DataTableColumnKey<TData>, DataTableColumnSchema<TData>>
>;

export type DataTableColumnsInput<TData extends object> =
  | ColumnDef<TData, unknown>[]
  | DataTableColumnSchemaMap<TData>;

export type DataTableConfigOptions<TData extends object> = Partial<
  Omit<UseDataTableOptions<TData>, 'columns' | 'data'>
> & {
  columns: DataTableColumnsInput<TData>;
  preset?: DataTablePreset;
};

export type DataTableConfig<TData extends object> = Omit<
  UseDataTableOptions<TData>,
  'data'
>;

const BASIC_PRESET = {
  enableColumnFilters: false,
  enableColumnOrdering: false,
  enableColumnResizing: false,
  enableColumnVisibility: false,
  enableGlobalFilter: false,
  enableGrouping: false,
  enablePagination: false,
  enableSavedViews: false,
} as const satisfies Partial<UseDataTableOptions<object>>;

const INTERACTIVE_PRESET = {
  ...BASIC_PRESET,
  enableColumnFilters: true,
  enableColumnOrdering: true,
  enableColumnResizing: true,
  enableColumnVisibility: true,
  enableGlobalFilter: true,
  enablePagination: true,
} as const satisfies Partial<UseDataTableOptions<object>>;

const ENTERPRISE_PRESET = {
  ...INTERACTIVE_PRESET,
  enableGrouping: true,
  enableSavedViews: true,
} as const satisfies Partial<UseDataTableOptions<object>>;

const DATA_TABLE_PRESETS = {
  basic: BASIC_PRESET,
  enterprise: ENTERPRISE_PRESET,
  interactive: INTERACTIVE_PRESET,
  minimal: BASIC_PRESET,
} as const satisfies Record<DataTablePreset, Partial<UseDataTableOptions<object>>>;

function getPresetOptions<TData extends object>(
  preset: DataTablePreset | undefined,
): Partial<UseDataTableOptions<TData>> {
  return DATA_TABLE_PRESETS[preset ?? 'basic'];
}

function createColumn<TData extends object>(
  accessorKey: DataTableColumnKey<TData>,
  filterVariant: DataTableFilterVariant | undefined,
  options: DataTableColumnBuilderOptions<TData> = {},
): ColumnDef<TData, unknown> {
  const {
    align,
    description,
    enableExport,
    enableGrouping,
    header,
    label,
    meta,
    ...columnOptions
  } = options;
  const resolvedLabel = label ?? header ?? accessorKey;

  return {
    ...columnOptions,
    accessorKey,
    header: header ?? resolvedLabel,
    meta: {
      ...meta,
      align,
      description,
      enableExport,
      enableGrouping,
      filterVariant,
      label: label ?? String(resolvedLabel),
    },
  };
}

export function textColumn<TData extends object>(
  accessorKey: DataTableColumnKey<TData>,
  options?: DataTableColumnBuilderOptions<TData>,
): ColumnDef<TData, unknown> {
  return createColumn(accessorKey, 'text', options);
}

export function dataColumn<TData extends object>(
  accessorKey: DataTableColumnKey<TData>,
  options?: DataTableColumnBuilderOptions<TData>,
): ColumnDef<TData, unknown> {
  return createColumn(accessorKey, undefined, options);
}

export function numberColumn<TData extends object>(
  accessorKey: DataTableColumnKey<TData>,
  options?: DataTableColumnBuilderOptions<TData>,
): ColumnDef<TData, unknown> {
  return createColumn(accessorKey, 'number', {
    align: 'end',
    ...options,
  });
}

export function booleanColumn<TData extends object>(
  accessorKey: DataTableColumnKey<TData>,
  options?: DataTableColumnBuilderOptions<TData>,
): ColumnDef<TData, unknown> {
  return createColumn(accessorKey, 'boolean', {
    align: 'center',
    ...options,
  });
}

export function selectColumn<TData extends object>(
  accessorKey: DataTableColumnKey<TData>,
  options?: DataTableColumnBuilderOptions<TData>,
): ColumnDef<TData, unknown> {
  return createColumn(accessorKey, 'select', options);
}

export function multiSelectColumn<TData extends object>(
  accessorKey: DataTableColumnKey<TData>,
  options?: DataTableColumnBuilderOptions<TData>,
): ColumnDef<TData, unknown> {
  return createColumn(accessorKey, 'multi-select', options);
}

export function dateColumn<TData extends object>(
  accessorKey: DataTableColumnKey<TData>,
  options?: DataTableColumnBuilderOptions<TData>,
): ColumnDef<TData, unknown> {
  return createColumn(accessorKey, 'date', {
    align: 'end',
    ...options,
  });
}

export function dateRangeColumn<TData extends object>(
  accessorKey: DataTableColumnKey<TData>,
  options?: DataTableColumnBuilderOptions<TData>,
): ColumnDef<TData, unknown> {
  return createColumn(accessorKey, 'date-range', {
    align: 'end',
    ...options,
  });
}

function createColumnFromSchema<TData extends object>(
  accessorKey: DataTableColumnKey<TData>,
  schema: DataTableColumnSchema<TData>,
): ColumnDef<TData, unknown> {
  const { type = 'data', ...options } = schema;

  switch (type) {
    case 'text':
      return textColumn(accessorKey, options);
    case 'number':
      return numberColumn(accessorKey, options);
    case 'boolean':
      return booleanColumn(accessorKey, options);
    case 'select':
      return selectColumn(accessorKey, options);
    case 'multi-select':
      return multiSelectColumn(accessorKey, options);
    case 'date':
      return dateColumn(accessorKey, options);
    case 'date-range':
      return dateRangeColumn(accessorKey, options);
    case 'data':
    default:
      return dataColumn(accessorKey, options);
  }
}

export function createDataTableColumns<TData extends object>(
  columns: DataTableColumnsInput<TData>,
): ColumnDef<TData, unknown>[] {
  if (Array.isArray(columns)) {
    return columns;
  }

  return Object.entries(columns).map(([accessorKey, schema]) =>
    createColumnFromSchema(
      accessorKey as DataTableColumnKey<TData>,
      schema ?? {},
    ),
  );
}

export function createDataTableConfig<TData extends object>({
  columns,
  preset,
  ...options
}: DataTableConfigOptions<TData>): DataTableConfig<TData> {
  return {
    ...getPresetOptions<TData>(preset),
    ...options,
    columns: createDataTableColumns(columns),
  };
}
