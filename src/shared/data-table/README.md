# Shared DataTable

Reusable enterprise DataTable for React + TypeScript applications.

This module wraps TanStack Table with a stable, opinionated UI shell that
supports sorting, filtering, visibility, ordering, grouping, pagination,
virtualization, saved views, resizing, and drag-and-drop workflows without
exposing TanStack internals to consumers.

## Public API surface

Import from `src/shared/data-table`:

```tsx
import {
  DataTable,
  createDataTableConfig,
  dataColumn,
  textColumn,
  numberColumn,
  booleanColumn,
  selectColumn,
  multiSelectColumn,
  dateColumn,
  useDataTable,
  type DataTableProps,
  type DataTableMode,
  type DataTableFilterVariant,
  type DataTableAlign,
} from '@/shared/data-table';
```

### Exported runtime values

- `DataTable`
- `useDataTable`
- `createDataTableConfig`
- `dataColumn`
- `textColumn`
- `numberColumn`
- `booleanColumn`
- `selectColumn`
- `multiSelectColumn`
- `dateColumn`
- `dateRangeColumn`

### Exported types

- `DataTableProps`
- `UseDataTableOptions`
- `DataTableMode`
- `DataTableFilterVariant`
- `DataTableAlign`
- `DataTablePreset`
- `DataTableConfig`
- `DataTableConfigOptions`
- `DataTableColumnBuilderOptions`
- `DataTableColumnSchema`
- `DataTableColumnSchemaMap`
- `DataTableColumnSchemaType`
- `DataTableColumnsInput`

The package entrypoint intentionally does **not** re-export internal helpers,
saved-view internals, DnD internals, or TanStack types.

## Dependencies

Required runtime dependencies are already declared by the app that consumes
this module:

- `react`
- `react-dom`
- `@tanstack/react-table`
- `@tanstack/react-virtual`
- `@dnd-kit/core`
- `@dnd-kit/sortable`
- `@dnd-kit/utilities`

## Basic Usage

```tsx
import type { ColumnDef } from '@tanstack/react-table';

import { DataTable } from './shared/data-table';

interface User {
  id: string;
  name: string;
  email: string;
}

const columns: ColumnDef<User, unknown>[] = [
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'email', header: 'Email' },
];

export function UsersPage() {
  return <DataTable<User> data={[]} columns={columns} />;
}
```

## Config Helper API

For application code, prefer the helper API when you want a compact,
type-safe setup for arbitrary row shapes:

```tsx
import {
  DataTable,
  createDataTableConfig,
} from './shared/data-table';

interface User {
  id: string;
  name: string;
  age: number;
  department: string;
  active: boolean;
}

const userTableConfig = createDataTableConfig<User>({
  preset: 'enterprise',
  storageKey: 'users-table',
  columns: {
    id: { header: 'ID', enableHiding: false },
    name: { type: 'text', header: 'Name', label: 'Full Name' },
    age: { type: 'number', header: 'Age' },
    department: {
      type: 'select',
      header: 'Department',
      enableGrouping: true,
    },
    active: { type: 'boolean', header: 'Active', enableGrouping: true },
  },
});

export function UsersTable({ users }: { users: User[] }) {
  return <DataTable data={users} {...userTableConfig} />;
}
```

Presets:

- `basic` / `minimal`: no extra table features enabled.
- `interactive`: filters, search, visibility, ordering, resizing, pagination.
- `enterprise`: interactive features plus grouping and saved views.
- `virtualized`: enterprise-style controls with virtualization and no pagination.

Explicit options always override preset defaults.

The `columns` option also accepts a ready-made `ColumnDef[]` array. Use the
schema object for regular data tables and switch to `ColumnDef[]` or the
`textColumn` / `numberColumn` / `selectColumn` builder helpers when a column
needs custom cell/header rendering.

## Column Definitions

Columns are standard TanStack `ColumnDef` objects. The DataTable reads a few
optional `meta` fields to drive its UI:

```tsx
const columns: ColumnDef<User, unknown>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
    size: 180,
    minSize: 140,
    maxSize: 280,
    meta: {
      label: 'Full Name',
      description: 'Displayed in the user directory',
      align: 'start',
      filterVariant: 'text',
      enableGrouping: false,
      enableExport: true,
    },
  },
];
```

### `ColumnMeta` options

- `label`: human-readable label used in toolbar menus and headers.
- `description`: accessible description for the column header.
- `align`: header and cell alignment (`start`, `center`, `end`).
- `filterVariant`: selects the filter control rendered by the column filter UI.
- `enableGrouping`: opt a column into the grouping UI.
- `enableExport`: reserved for future export support.

TanStack sizing props such as `size`, `minSize`, and `maxSize` are also
supported directly on the column definition.

### Sizing Convention

Prefer the automatic minimum width calculation for normal columns:

- omit `minSize` by default
- use `size` for the desired initial width
- use `maxSize` only when you need to cap growth
- use `minSize` only when you intentionally want a larger floor than the
  automatic minimum

The DataTable derives a safe minimum width from the header label and the
header chrome, including drag handles, sort controls, grouping indicators, and
filter affordances. If a column definition supplies a smaller `minSize`, the
automatic minimum still wins so headers do not become unreadable. If `maxSize`
would otherwise be smaller than the effective minimum, the table clamps the
effective maximum up to that minimum to avoid impossible sizing constraints.

### Styling Organization

The reusable component keeps its styles in
[`data-table.css`](./data-table.css).

- the stylesheet is intentionally organized by UI surface
- class names stay stable unless a rename is deliberate
- browser contracts such as header hit-testing, DnD overlays, grouping-panel
  nowrap behavior, and auto-group indentation should be verified after visual
  CSS cleanups

## State Model

Every state slice follows the same three-mode model:

- **Fully uncontrolled**: omit both the value and the change handler.
- **Listener-only**: pass `onXChange` only to observe user interactions while
  keeping internal state.
- **Fully controlled**: pass both the value and the change handler.

Supported slices include:

- sorting
- column filters
- global filter
- column visibility
- column order
- column sizing
- grouping
- expanded state
- pagination
- row selection

## Client Mode vs Server Mode

`mode` defaults to `client`.

### Client mode

Client mode uses TanStack row models inside the component:

- sorting
- filtering
- grouping
- expansion
- pagination

This is the simplest setup when the full dataset is already loaded in memory.

### Server mode

Server mode disables client-side row models for the server-owned slices. The
DataTable still emits change callbacks so the caller can fetch a new result set
and pass the new rows back in.

Use server mode when sorting/filtering/grouping/pagination happen elsewhere.

## Feature Summary

### Sorting

- Click sortable headers to toggle sort order.
- The sort button remains separate from resize and drag handles.

### Global Search

- Toolbar search input drives the global filter state.
- Works in client mode and server mode.

### Column Filters

Supported filter variants:

- `text`
- `select`
- `boolean`
- `number`
- `date`
- `date-range`
- `multi-select`

### Advanced Filters

- `filterRules` is the canonical filter state. Header filters, the toolbar
  Filters menu, saved views, and server callbacks all read/write the same rule
  model.
- `columnFilters` and `onColumnFiltersChange` remain supported for backward
  compatibility. Internally they are adapted to/from `filterRules`.
- Prefer `filterRules` / `onFilterRulesChange` for server queries, URL sync,
  active filter chips, and new integrations.
- Number filters support min/max inputs.
- Date filters use native `type="date"` controls.
- Date-range filters use from/to inputs.
- Multi-select filters use a native multi-select listbox.
- MVP limitations: no AND/OR groups, nested groups, async remote options,
  full query-builder UI, or server-wide option discovery yet. One rule per
  column/operator pair is expected.

### Column Visibility

- Toggle visible columns from the Columns menu.
- Columns marked with `enableHiding: false` remain fixed.

### Column Ordering

- Reorder columns from the Columns menu.
- Reorder columns directly from headers when column ordering is enabled.
- Move left / move right actions remain available in the Columns menu.

### Drag and Drop

- Column ordering uses a shared DnD layer.
- Header drag, Columns menu drag, and grouping-panel drag are isolated.
- Cross-zone drag from the Columns menu into the Grouping Panel adds grouping.

### Auto Group Column

When grouping is active, the table inserts an internal first column named
`Group` to render grouped-row expand/collapse controls, grouping labels, and
indentation.

- it appears only while `enableGrouping` is on and grouping is non-empty
- it is internal to the DataTable implementation and is not part of consumer
  column definitions
- it is not draggable, sortable, filterable, or groupable in v1
- it is always rendered first in grouped mode
- it is omitted from the Columns menu and from saved-view column-order state
- normal user columns remain reorderable and resizable independently of the
  internal group column
- grouped source columns are auto-hidden from the rendered grid while
  grouping is active
- this auto-hide is derived from `grouping`; it does not mutate the user's
  real `columnVisibility` state
- clearing grouping restores the grid according to the real visibility state
- grouping pills expose a compact sort control that updates the existing
  `sorting` slice, which is especially useful when grouped source columns are
  hidden from the main grid
- grouping order and sorting order remain separate concepts

## Runtime Contracts

These are the browser-level contracts the DataTable relies on. Keep them stable
when changing layout, CSS, or DnD behavior.

### DnD Zones

The shared DnD layer uses these internal zones:

- `column-header`: reorder visible header columns and allow header-to-grouping
  drag.
- `column-order`: reorder the Columns menu order list.
- `grouping-menu`: add a column to grouping from the Columns menu.
- `grouping-panel`: reorder grouped pills and accept cross-zone grouping drops.
- `grouping-panel-drop-zone`: empty-state drop target for the grouping panel.

Allowed transitions:

- `column-header -> column-header`: reorder visible header columns.
- `column-header -> grouping-panel`: append the column to grouping.
- `column-order -> column-order`: reorder the Columns menu order list.
- `grouping-menu -> grouping-panel`: append the column to grouping.
- `grouping-panel -> grouping-panel`: reorder grouped pills.
- `grouping-panel -> grouping-panel-drop-zone`: no-op.

Invalid, malformed, or unknown zone combinations are treated as no-ops.

### Header Reorder Contract

Header reorder is based on the **visible leaf column order**.

- Hidden columns stay in the full `columnOrder` state.
- Hidden columns must not distort visible reorder behavior.
- The reorder result is merged back into the full `columnOrder` without losing
  hidden ids.
- Column widths remain attached to the same column id after reorder.

The browser reorder intent is directional:

- dropping visually before a header places the active column before it
- dropping visually after a header places the active column after it

### Header Hit-Testing

Header drag handles are small, explicit drag affordances. They must remain
pointer-hittable in the real browser and must not be covered by demo chrome or
layout overlays.

If a change alters the visible header chrome, verify hit-testing in Chromium.
In practice this means:

- `document.elementFromPoint(...)` at the drag-handle center must resolve to the
  drag handle or one of its children
- the target must not resolve to outer layout containers such as the demo card

### Layout Contract

The table layout is sized by the **visible columns only**.

- hidden columns must not inflate table width
- header, body, and virtualized rows must stay aligned
- the horizontal scroll wrapper owns overflow
- the table should scroll horizontally instead of squeezing visible columns
- saved `columnSizing` must restore the same effective widths by column id

When adjusting column sizing or layout, validate both the normal body and the
virtualized body paths.

### Grouping

- Group columns from the Columns menu.
- Grouped columns can be reordered inside the Grouping Panel.
- The table renders grouped rows and expand/collapse controls.

### Grouping Panel

- Appears above the table when grouping is enabled.
- Shows active group chips in grouping order.
- Supports remove, clear, and drag reorder actions.

### Pagination

- Optional pagination footer below the table.
- Supports client mode and server mode.
- Page size can be changed from the footer.

### Virtualization

- Optional row virtualization uses `@tanstack/react-virtual`.
- Works with pagination and the current row model.
- Useful for large tables with many visible rows.

### Saved Views

- Saves and restores supported table UI state locally.
- Backed by `localStorage` or a custom storage adapter.
- Supports versioned payloads and safe fallback parsing.

### Column Resizing

- Optional header resize handles.
- Supports controlled, uncontrolled, and listener-only state.
- Widths stay aligned across normal and virtualized rendering.

## Architecture

### Components

- `components/data-table.tsx`: top-level table shell.
- `components/data-table-toolbar.tsx`: search / columns / saved views toolbar.
- `components/data-table-columns-menu.tsx`: visibility, ordering, grouping
  controls.
- `components/data-table-grouping-panel.tsx`: active grouping chips and DnD.
- `components/data-table-pagination.tsx`: footer pagination controls.
- `components/data-table-virtual-body.tsx`: virtualized body renderer.
- `components/data-table-header.tsx`: header rows.
- `components/data-table-header-cell.tsx`: sort/filter/drag/resize controls.
- `components/data-table-body.tsx`: standard body renderer.
- `components/data-table-row.tsx`: row rendering.
- `components/data-table-cell.tsx`: cell rendering and width application.

### Hooks

- `hooks/use-data-table.ts`: TanStack Table setup and slice wiring.
- `hooks/use-controllable-state.ts`: shared controlled/uncontrolled/listener-only
  state helper.

### Lib helpers

- `lib/column-filters.ts`: filter normalization and built-in filter functions.
- `lib/column-ordering.ts`: default ordering and reorder helpers.
- `lib/column-sizing.ts`: safe sizing normalization.
- `lib/grouping-ordering.ts`: grouping normalization and reorder helpers.
- `lib/data-table-dnd.ts`: shared DnD zone / id helpers.
- `lib/saved-views.ts`: saved view parsing, persistence, snapshot/apply/reset.

### Shared DnD Layer

One shared DnD root coordinates:

- column ordering from the Columns menu
- header drag ordering
- grouping-panel reordering
- cross-zone drag from the Columns menu into grouping

The layer keeps zone parsing and drag metadata internal.

### Saved Views Layer

Saved views serialize only supported state slices and normalize malformed data
before applying it back to the table.

### Virtualized vs Non-virtualized Body

- Non-virtualized tables render the normal `<tbody>` row list.
- Virtualized tables render a scroll container with the current row model and a
  virtualized row window.

## Examples

### Minimal Table

```tsx
<DataTable data={users} columns={columns} />
```

### Full-featured Table

```tsx
<DataTable
  data={users}
  columns={columns}
  enableColumnFilters
  enableColumnOrdering
  enableColumnVisibility
  enableColumnResizing
  enableGlobalFilter
  enableGrouping
  enablePagination
  enableSavedViews
  enableVirtualization
  storageKey="users-table"
/>
```

### Controlled Sorting

```tsx
const [sorting, setSorting] = useState<SortingState>([]);

<DataTable
  data={users}
  columns={columns}
  sorting={sorting}
  onSortingChange={setSorting}
/>
```

### Server Mode

```tsx
<DataTable
  data={rowsFromServer}
  columns={columns}
  mode="server"
  enableGlobalFilter
  enableColumnFilters
  enablePagination
  pageCount={pageCount}
  rowCount={rowCount}
  onGlobalFilterChange={setGlobalFilter}
  onFilterRulesChange={setFilterRules}
  onPaginationChange={setPagination}
/>
```

In server mode, `filterRules` still updates and callbacks still fire, but the
table does not apply client-side filtering.

### Saved Views

```tsx
<DataTable
  data={users}
  columns={columns}
  enableSavedViews
  storageKey="users-table"
  defaultViewName="Team view"
/>
```

### Virtualization

```tsx
<DataTable
  data={largeDataset}
  columns={columns}
  enableVirtualization
  tableHeight={420}
  estimateRowHeight={44}
  overscan={8}
/>
```

## Accessibility Notes

- Sortable headers keep the sort action on a button.
- Resize and drag handles are separate from sort and filter controls.
- Toolbar menus and panels use accessible labels and roles.
- The table keeps valid table semantics in normal and virtualized modes.

## Testing Notes

Recommended coverage for consumers:

- rendering with the minimum required props
- controlled slice updates
- server-mode callbacks
- visibility / ordering / grouping / pagination interactions
- saved-view restore flows
- virtualization no-crash flows for large datasets

Use Playwright/browser tests when validating:

- real pointer-based DnD
- hit-testing and stacking-context bugs
- header drag behavior across horizontal scroll and resized columns

Use jsdom/helper tests when validating:

- pure reorder helpers
- zone parsing and metadata normalization
- saved-view normalization
- other deterministic state transforms

This repository intentionally avoids brittle pointer-based jsdom drag tests for
the most complex DnD paths. Helper-unit and accessibility tests are preferred.

## Known Limitations

- Dynamic row measurement is deferred.
- Backend saved views are deferred.
- User syncing / per-user saved-view storage is deferred.
- Advanced server-side adapters are not implemented yet.
- jsdom pointer simulation for full drag-and-drop remains intentionally avoided.

## Intentionally Deferred

- Dynamic row measurement
- Backend saved views
- User syncing
- Advanced server-side adapters
- Storybook
- Additional domain-specific table actions
