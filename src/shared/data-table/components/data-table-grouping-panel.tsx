import { useDroppable } from '@dnd-kit/core';
import { rectSortingStrategy, SortableContext } from '@dnd-kit/sortable';
import type { Column, Table } from '@tanstack/react-table';
import { ChevronRight, Layers, X } from 'lucide-react';
import { Fragment } from 'react';

import {
  createDataTableDndData,
  GROUPING_PANEL_DROP_ZONE_ID,
  isGroupingDragSource,
} from '../lib/data-table-dnd';
import { normalizeGroupingIds, removeGroupingId } from '../lib/grouping-ordering';
import { useDataTableDndState } from './data-table-dnd-state-context';
import { useDataTableGroupingDragPreview } from './data-table-grouping-drag-preview-context';
import { DataTableGroupingPanelItem } from './data-table-grouping-panel-item';
import { useDataTableLocale } from './data-table-locale-context';
import { DataTableScrollArea } from './data-table-scroll-area';

interface DataTableGroupingPanelProps<TData extends object> {
  table: Table<TData>;
}

function getGroupedColumns<TData extends object>(
  table: Table<TData>,
  groupingIds: readonly string[],
) {
  const leafColumnsById = new Map(
    table.getAllLeafColumns().map((column) => [column.id, column] as const),
  );

  return groupingIds
    .map((groupId) => leafColumnsById.get(groupId))
    .filter((column): column is Column<TData, unknown> => column !== undefined);
}

export function DataTableGroupingPanel<TData extends object>({
  table,
}: DataTableGroupingPanelProps<TData>) {
  const locale = useDataTableLocale();
  const groupingPreview = useDataTableGroupingDragPreview();
  const groupingIds = normalizeGroupingIds(
    groupingPreview?.groupingOrder ?? table.getState().grouping,
  );
  const groupedColumns = getGroupedColumns(table, groupingIds);
  const dndState = useDataTableDndState();
  const { isOver, setNodeRef } = useDroppable({
    id: GROUPING_PANEL_DROP_ZONE_ID,
    data: createDataTableDndData('grouping-panel-drop-zone'),
  });

  const isGroupableDragActive = isGroupingDragSource(dndState?.activeDragData ?? undefined);
  const isDraggingNonGroupableHeader =
    isOver &&
    dndState?.activeDragData?.zone === 'column-header' &&
    dndState.activeDragData.groupable !== true;

  const panelModifier =
    isOver && isGroupableDragActive ? 'cereda-table__grouping-panel--drop-target' :
    isGroupableDragActive ? 'cereda-table__grouping-panel--can-drop' :
    isDraggingNonGroupableHeader ? 'cereda-table__grouping-panel--deny' :
    null;
  const panelClassName = panelModifier
    ? `cereda-table__grouping-panel ${panelModifier}`
    : 'cereda-table__grouping-panel';

  return (
    <section className={panelClassName} aria-label={locale.groupingPanel.ariaLabel}>
      <div ref={setNodeRef} className="cereda-table__grouping-panel-drop-surface" />
      <div className="cereda-table__grouping-panel-content">
        {groupedColumns.length === 0 ? (
          <div className="cereda-table__grouping-panel-empty">
            <Layers className="cereda-table__grouping-panel-empty-icon" aria-hidden="true" />
            {locale.groupingPanel.dropHint}
          </div>
        ) : (
          <>
            <DataTableScrollArea className="cereda-table__grouping-panel-scroll" scrollbars="horizontal">
              <SortableContext items={groupingIds} strategy={rectSortingStrategy}>
                <ul className="cereda-table__grouping-pill-list">
                  {groupedColumns.map((column, index) => (
                    <Fragment key={column.id}>
                      {index > 0 ? (
                        <li
                          role="presentation"
                          aria-hidden="true"
                          className="cereda-table__grouping-panel-separator"
                        >
                          <ChevronRight aria-hidden="true" />
                        </li>
                      ) : null}
                      <DataTableGroupingPanelItem
                        column={column}
                        index={index}
                        total={groupedColumns.length}
                        onRemove={() =>
                          table.setGrouping(
                            removeGroupingId(table.getState().grouping, column.id),
                          )
                        }
                      />
                    </Fragment>
                  ))}
                </ul>
              </SortableContext>
            </DataTableScrollArea>
            <button
              type="button"
              className="cereda-table__grouping-panel-clear"
              onClick={() => table.resetGrouping(true)}
              onPointerDown={(event) => {
                event.stopPropagation();
              }}
            >
              <X aria-hidden="true" />
              {locale.groupingPanel.clearAll}
            </button>
          </>
        )}
      </div>
    </section>
  );
}

