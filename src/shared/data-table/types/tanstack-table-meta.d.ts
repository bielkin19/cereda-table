import type { RowData } from '@tanstack/react-table';

import type {
  DataTableAlign,
  DataTableFilterOperator,
  DataTableFilterRule,
  DataTableFilterValue,
  DataTableFilterVariant,
} from './data-table.types';

declare module '@tanstack/react-table' {
  /**
   * Column-level metadata — attach via `ColumnDef.meta`.
   *
   * All fields are optional so columns only declare what they need.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    /** Human-readable column label used in column-visibility toggles and exports. */
    label?: string;

    /** Tooltip or accessible description for the column header. */
    description?: string;

    /** Horizontal alignment applied to the header and every cell in this column. */
    align?: DataTableAlign;

    /**
     * Declares which filter control should be rendered for this column.
     * The table engine is agnostic to this value — it is used exclusively
     * by consumer-supplied filter UI components.
     */
    filterVariant?: DataTableFilterVariant;

    /** Opt the column in to grouping support in the Columns menu. */
    enableGrouping?: boolean;

    /**
     * Opt the column in to export support when that feature is added.
     * Has no effect on the current foundation.
     */
    enableExport?: boolean;
  }

  /**
   * Table-level metadata — attach via `useReactTable({ meta: … })`.
   *
   * Extend this interface as the module grows
   * (e.g. `updateRow`, `deleteRow`, inline-edit callbacks).
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface TableMeta<TData extends RowData> {
    /**
     * Internal escape hatch used by the DataTable shell to restore its own
     * default slice state without depending on TanStack's reset semantics.
     */
    resetToInitialState?: () => void;

    /** Commit the current header DnD order to the real columnOrder slice. */
    commitColumnOrderPreview?: (columnOrder: string[]) => void;

    /** Clear any temporary header DnD state without committing it. */
    clearColumnOrderPreview?: () => void;

    /**
     * Returns the user's real columnVisibility state before any derived
     * grouping-based hiding is applied for rendering.
     */
    getUserColumnVisibilityState?: () => Record<string, boolean>;

    /** Canonical filter rules backing header filters, toolbar filters, and saved views. */
    getFilterRules?: () => DataTableFilterRule[];

    /** Replace the canonical filter rules slice. */
    setFilterRules?: (
      updater:
        | DataTableFilterRule[]
        | ((currentRules: DataTableFilterRule[]) => DataTableFilterRule[]),
    ) => void;

    /** Read a single canonical rule value for header/menu controls. */
    getFilterRuleValue?: (
      columnId: string,
      operator: DataTableFilterOperator,
    ) => DataTableFilterValue | undefined;

    /** Create, update, or remove one canonical filter rule. */
    setFilterRuleValue?: (
      columnId: string,
      operator: DataTableFilterOperator,
      value: DataTableFilterValue | undefined,
    ) => void;
  }
}
