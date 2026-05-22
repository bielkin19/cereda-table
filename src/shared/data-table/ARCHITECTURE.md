# DataTable Architecture

This document records the runtime contracts that keep the shared DataTable stable.
The goal is to prevent regressions when changing grouping, column ordering,
saved views, layout, or DnD behavior.

## Grouping And Column Ordering

Grouping and column ordering are independent state slices.

- `grouping` controls row grouping order only.
- `columnOrder` controls visual column order only.
- Reordering table headers changes `columnOrder` only.
- Reordering the Columns menu order list changes `columnOrder` only.
- Reordering grouping pills changes `grouping` only.
- Grouped source columns are auto-hidden from the rendered grid while grouping
  is active.
- This auto-hide is derived visibility only; it does not mutate the user
  `columnVisibility` slice.
- A grouped column is not automatically locked, permanently hidden, or moved.
- Saved views must restore the real `columnVisibility` and `columnOrder`
  independently; grouped auto-hide is reapplied from `grouping` at render time.
- Grouping pills expose a compact sort control that updates the existing
  `sorting` slice.
- Sorting and grouping remain independent state slices, and the pill control is
  the user-facing way to sort grouped source columns when those source columns
  are hidden from the main grid.
- TanStack grouped-column positioning is disabled with
  `groupedColumnMode: false`.

### Auto Group Column

Grouped tables render an internal first column named `Group`.

- it appears only when `enableGrouping` is true and `grouping.length > 0`
- it is not defined by consumers and is not part of the public column schema
- it is not draggable, sortable, filterable, or groupable in v1
- it is rendered before user columns while grouping is active
- it is omitted from the Columns menu and from saved-view serialization
- clearing grouping removes the column again

Grouped rows render their expand/collapse affordance and group label inside this
column instead of using the old full-width grouped-row colSpan layout.
Grouped source columns are auto-hidden from the visible grid while grouping is
active, then reappear according to the real `columnVisibility` slice when
grouping is cleared.

Example:

```ts
grouping: ['status', 'department']
columnOrder: ['name', 'department', 'status', 'age']
```

This means:

- rows are grouped by `status`, then `department`
- visually, `department` can still appear before `status` in the table
- changing one slice does not mutate the other

## Why Header Reorder Uses Visible Order

Header reorder must not use `table.getVisibleLeafColumns()` as the final source
of truth when grouping is enabled.

Reasoning:

- grouped state can affect TanStack's visible leaf-column output
- the browser preview and the final commit must use the same visible-order
  contract
- hidden columns must be preserved in the full `columnOrder`
- hidden columns must not distort where visible columns land

The implementation therefore:

1. derives the visible column ids from the current `columnOrder`
2. reorders those visible ids only
3. merges the reordered visible ids back into the full `columnOrder`
4. preserves hidden ids in their existing positions

This keeps header drag, Columns menu ordering, and saved-view restore behavior
independent from grouping.

## DnD And Layout Contracts

### DnD zones

The shared DnD layer uses these internal zones:

- `column-header`: reorder visible header columns and allow header-to-grouping
  drag.
- `column-order`: reorder the Columns menu order list.
- `grouping-menu`: add a column to grouping from the Columns menu.
- `grouping-panel`: reorder grouped pills and accept cross-zone grouping drops.
- `grouping-panel-drop-zone`: empty-state drop target for the grouping panel.

Allowed transitions:

- `column-header -> column-header`
- `column-header -> grouping-panel`
- `column-order -> column-order`
- `grouping-menu -> grouping-panel`
- `grouping-panel -> grouping-panel`
- `grouping-panel -> grouping-panel-drop-zone` (no-op)

Invalid, malformed, or unknown zone combinations are treated as no-ops.

### Header drag contract

Header drag uses a compact floating overlay plus a deterministic pointer-based
commit.

- the overlay stays small and follows the pointer
- the table does not live-reflow during the drag
- the insertion marker shows the landing side of the hovered header
- the marker and the final drop use the same placement helper
- the final drop commits the same placement that was indicated during drag
- cancel restores the original order

### Header hit-testing

Header drag handles must stay pointer-hittable in Chromium.

- the drag handle must remain visible and reachable
- it must not be covered by demo chrome or layout overlays
- `document.elementFromPoint(...)` at the drag-handle center must resolve to
  the drag handle or one of its children
- the target must not resolve to outer layout containers such as the demo card

### Horizontal layout

The table width is defined by the visible columns only.

- hidden columns must not inflate table width
- header, body, and virtualized rows must stay aligned
- the horizontal scroll wrapper owns overflow
- the table should scroll horizontally instead of squeezing visible columns
- saved `columnSizing` must restore the same effective widths by column id

### Styling Contract

`src/shared/data-table/data-table.css` is the shared styling source for the
reusable table component.

- keep class names stable unless a deliberate rename is unavoidable
- organize rules by UI surface instead of scattering component-specific styles
- preserve the runtime contracts in this document when editing CSS
- verify header hit-testing, DnD overlays, grouping-panel layout, and
  auto-group indentation in the browser after visual cleanup

### Sizing contract

Prefer automatic minimum widths for normal columns.

- omit `minSize` by default
- use `size` for the desired initial width
- use `maxSize` only when you need to cap expansion
- use `minSize` only when you intentionally want a larger floor than the
  automatic minimum

The sizing pipeline derives a safe minimum from the header label and header
chrome, then applies the larger of:

- the automatic minimum
- any explicit `minSize` provided by the column definition

If `maxSize` would otherwise be smaller than that effective minimum, the
effective maximum is clamped up to the same value so the header cannot be
crushed into an impossible width.

## Regression Coverage

The current test suite intentionally covers this contract at multiple levels:

- unit/component tests verify grouping and `columnOrder` independence
- unit tests verify visible-order reorder helpers and hidden-column merging
- Playwright verifies grouped columns can be reordered in the real browser
- Playwright verifies grouping pill reorder does not mutate header order
- Playwright verifies header drag handles remain hittable in Chromium

When changing DnD, grouping, or layout behavior, prefer adding or updating a
browser regression instead of relying only on jsdom pointer simulation.
