import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  type DragMoveEvent,
  type DragOverEvent,
  type DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  pointerWithin,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { getEventCoordinates } from '@dnd-kit/utilities';
import type { ColumnOrderState, Table } from '@tanstack/react-table';
import type { GroupingState } from '@tanstack/react-table';
import React, { type ReactNode, useCallback, useEffect, useId, useRef, useState } from 'react';

import { isDataTableAutoGroupColumnId } from '../lib/auto-group-column';
import { getPreviewColumnOrderFromVisibleColumns } from '../lib/column-ordering';
import {
  type DataTableDndData,
  getDataTableDndReorderPlacementFromPoint,
  isGroupingDragSource,
  readDataTableDndData,
  resolveDataTableDndDropAction,
} from '../lib/data-table-dnd';
import {
  addGroupingId,
  normalizeGroupingIds,
  reorderGroupingIds,
} from '../lib/grouping-ordering';
import { isDataTableRowNumberColumnId } from '../lib/row-number-column';
import { DataTableDndOverlay } from './data-table-dnd-overlay';
import { DataTableDndStateProvider } from './data-table-dnd-state-context';
import { DataTableGroupingDragPreviewProvider } from './data-table-grouping-drag-preview-context';
import {
  DataTableHeaderDragPreviewProvider,
  type DataTableHeaderInsertionMarker,
} from './data-table-header-drag-preview-context';

interface DataTableDndLayerProps<TData extends object> {
  table: Table<TData>;
  wrapperRef: React.RefObject<HTMLDivElement>;
  enableColumnOrdering?: boolean;
  enableGrouping?: boolean;
  children: ReactNode;
}

interface Coordinates {
  x: number;
  y: number;
}

export function DataTableDndLayer<TData extends object>({
  table,
  wrapperRef: externalWrapperRef,
  enableColumnOrdering,
  enableGrouping,
  children,
}: DataTableDndLayerProps<TData>) {
  const shouldEnableDnd = enableColumnOrdering === true || enableGrouping === true;
  const dndId = useId();
  const [activeDragData, setActiveDragData] = useState<DataTableDndData | null>(null);
  const [activeDragPosition, setActiveDragPosition] = useState<Coordinates | null>(null);
  const [activeOverData, setActiveOverData] = useState<DataTableDndData | null>(null);
  const [isPointerOutsideWrapper, setIsPointerOutsideWrapper] = useState(false);
  const [groupingPreview, setGroupingPreview] = useState<GroupingState | null>(null);
  const activeDragDataRef = useRef<DataTableDndData | null>(null);
  const activeDragPositionRef = useRef<Coordinates | null>(null);
  const activeOverZoneRef = useRef<string | null>(null);
  const isPointerOutsideWrapperRef = useRef(false);
  const groupingPreviewRef = useRef<GroupingState | null>(null);
  const originalColumnOrderRef = useRef<ColumnOrderState | null>(null);
  const headerInsertionMarkerRef = useRef<DataTableHeaderInsertionMarker | null>(null);
  const [headerInsertionMarker, setHeaderInsertionMarker] =
    useState<DataTableHeaderInsertionMarker | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const clearColumnOrderPreview = () => {
    originalColumnOrderRef.current = null;
    table.options.meta?.clearColumnOrderPreview?.();
  };

  const clearGroupingPreview = () => {
    groupingPreviewRef.current = null;
    setGroupingPreview(null);
  };

  const syncGroupingPreview = useCallback(
    (activeData: DataTableDndData | undefined | null, overData: DataTableDndData | undefined | null) => {
      if (activeData?.zone !== 'grouping-panel' || !activeData.columnId) {
        if (groupingPreviewRef.current !== null) {
          clearGroupingPreview();
        }
        return;
      }

      if (overData?.zone !== 'grouping-panel' || !overData.columnId) {
        return;
      }

      if (activeData.columnId === overData.columnId) {
        return;
      }

      const currentGrouping = groupingPreviewRef.current ?? table.getState().grouping;
      const nextGrouping = reorderGroupingIds(
        currentGrouping,
        activeData.columnId,
        overData.columnId,
      );

      if (nextGrouping === currentGrouping) {
        return;
      }

      groupingPreviewRef.current = nextGrouping;
      setGroupingPreview(nextGrouping);
    },
    [table],
  );

  const commitColumnOrderPreview = (nextColumnOrder: ColumnOrderState) => {
    table.options.meta?.commitColumnOrderPreview?.(nextColumnOrder);
  };

  const applyHeaderInsertionMarker = (nextMarker: DataTableHeaderInsertionMarker | null) => {
    headerInsertionMarkerRef.current = nextMarker;
    setHeaderInsertionMarker(nextMarker);
  };

  const collisionDetection = (args: Parameters<typeof pointerWithin>[0]) => {
    const activeData = readDataTableDndData(args.active);
    const pointerCollisions = pointerWithin(args);

    if (pointerCollisions.length === 0) {
      return closestCenter(args);
    }

    if (isGroupingDragSource(activeData)) {
      const groupingPillCollision = pointerCollisions.find((collision) => {
        const container = args.droppableContainers.find(
          (droppableContainer) => droppableContainer.id === collision.id,
        );
        const data = readDataTableDndData(container);

        return data?.zone === 'grouping-panel' && Boolean(data.columnId);
      });

      if (groupingPillCollision) {
        return [groupingPillCollision];
      }
    }

    return pointerCollisions;
  };

  const handleDragStart = (event: DragStartEvent) => {
    const activeData = readDataTableDndData(event.active) ?? null;
    setActiveDragData(activeData);
    activeDragDataRef.current = activeData;
    isPointerOutsideWrapperRef.current = false;
    setIsPointerOutsideWrapper(false);
    applyHeaderInsertionMarker(null);
    const coordinates = getEventCoordinates(event.activatorEvent);
    const sourceRect = event.active.rect.current.initial ?? event.active.rect.current.translated;

    if (coordinates) {
      activeDragPositionRef.current = coordinates;
      setActiveDragPosition(coordinates);
    } else if (sourceRect) {
      const nextCoordinates = {
        x: sourceRect.left + sourceRect.width / 2,
        y: sourceRect.top + sourceRect.height / 2,
      };
      activeDragPositionRef.current = nextCoordinates;
      setActiveDragPosition(nextCoordinates);
    } else {
      activeDragPositionRef.current = null;
      setActiveDragPosition(null);
    }

    if (activeData?.zone === 'column-header') {
      const currentColumnOrder = table.getState().columnOrder;
      originalColumnOrderRef.current = currentColumnOrder;
      clearGroupingPreview();
    } else if (activeData?.zone === 'grouping-panel') {
      const normalizedGrouping = normalizeGroupingIds(table.getState().grouping);
      groupingPreviewRef.current = normalizedGrouping;
      setGroupingPreview(normalizedGrouping);
    } else {
      clearColumnOrderPreview();
      clearGroupingPreview();
    }
  };

  const syncActiveOverData = (overData: DataTableDndData | null) => {
    const nextZone = overData?.zone ?? null;
    if (nextZone !== activeOverZoneRef.current) {
      activeOverZoneRef.current = nextZone;
      setActiveOverData(overData);
    }
  };

  const clearActiveDrag = () => {
    setActiveDragData(null);
    activeDragDataRef.current = null;
    setActiveDragPosition(null);
    activeDragPositionRef.current = null;
    activeOverZoneRef.current = null;
    setActiveOverData(null);
    isPointerOutsideWrapperRef.current = false;
    setIsPointerOutsideWrapper(false);
    applyHeaderInsertionMarker(null);
    clearColumnOrderPreview();
    clearGroupingPreview();
  };

  const handleDragOver = (event: DragOverEvent) => {
    syncActiveOverData(readDataTableDndData(event.over) ?? null);
    syncGroupingPreview(readDataTableDndData(event.active), readDataTableDndData(event.over));
    syncHeaderInsertionMarker(readDataTableDndData(event.active), activeDragPositionRef.current ?? activeDragPosition);
  };

  const handleDragMove = (event: DragMoveEvent) => {
    syncHeaderInsertionMarker(readDataTableDndData(event.active), activeDragPositionRef.current ?? activeDragPosition);
  };

  const syncHeaderInsertionMarker = useCallback(
    (activeData: DataTableDndData | undefined | null, point: Coordinates | null | undefined) => {
      if (activeData?.zone !== 'column-header') {
        if (headerInsertionMarkerRef.current !== null) {
          applyHeaderInsertionMarker(null);
        }
        return;
      }

      const nextMarker = getHeaderInsertionMarkerFromPoint(activeData, point);

      if (nextMarker === null) {
        if (headerInsertionMarkerRef.current !== null) {
          applyHeaderInsertionMarker(null);
        }
        return;
      }

      if (
        headerInsertionMarkerRef.current?.columnId === nextMarker.columnId &&
        headerInsertionMarkerRef.current?.placement === nextMarker.placement
      ) {
        return;
      }

      applyHeaderInsertionMarker(nextMarker);
    },
    [],
  );

  useEffect(() => {
    if (!activeDragData) {
      return;
    }

    const handlePointerMove = (event: PointerEvent) => {
      const nextCoordinates = { x: event.clientX, y: event.clientY };
      activeDragPositionRef.current = nextCoordinates;
      setActiveDragPosition(nextCoordinates);
      syncHeaderInsertionMarker(activeDragDataRef.current, nextCoordinates);

      const wrapper = externalWrapperRef.current;
      if (wrapper) {
        const rect = wrapper.getBoundingClientRect();
        const outside =
          event.clientX < rect.left ||
          event.clientX > rect.right ||
          event.clientY < rect.top ||
          event.clientY > rect.bottom;
        if (outside !== isPointerOutsideWrapperRef.current) {
          isPointerOutsideWrapperRef.current = outside;
          setIsPointerOutsideWrapper(outside);
        }
      }
    };

    window.addEventListener('pointermove', handlePointerMove);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
    };
  }, [activeDragData, syncHeaderInsertionMarker, externalWrapperRef]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    const activeData = readDataTableDndData(active);
    const overData = readDataTableDndData(over);

    const action = resolveDataTableDndDropAction(activeData, overData);

    if (!over) {
      clearActiveDrag();
      return;
    }

    if (!action) {
      clearActiveDrag();
      return;
    }

    switch (action.kind) {
      case 'reorder-column':
        if (activeData?.zone === 'column-header') {
          const currentColumnOrder = originalColumnOrderRef.current ?? table.getState().columnOrder;
          const visibleColumnIds = table
            .getAllLeafColumns()
            .filter(
              (column) =>
                column.getIsVisible() &&
                !isDataTableAutoGroupColumnId(column.id) &&
                !isDataTableRowNumberColumnId(column.id),
            )
            .map((column) => column.id);
          const marker =
            headerInsertionMarkerRef.current ??
            getHeaderInsertionMarkerFromRects(
              activeData,
              activeDragPositionRef.current ?? activeDragPosition,
              overData ?? null,
              over?.rect,
            ) ??
            getHeaderInsertionMarkerFromPoint(
              activeData,
              activeDragPositionRef.current ?? activeDragPosition,
            );
          const finalColumnOrder = marker
            ? getPreviewColumnOrderFromVisibleColumns(
                currentColumnOrder,
                visibleColumnIds,
                action.activeColumnId,
                marker.columnId,
                marker.placement,
              )
            : currentColumnOrder;
          commitColumnOrderPreview(finalColumnOrder);
        }
        clearActiveDrag();
        return;
      case 'reorder-grouping':
        table.setGrouping(
          groupingPreviewRef.current ??
            reorderGroupingIds(table.getState().grouping, action.activeColumnId, action.overColumnId),
        );
        clearActiveDrag();
        return;
      case 'append-grouping':
        if (activeData?.zone === 'column-header') {
          clearColumnOrderPreview();
        }
        table.setGrouping(addGroupingId(table.getState().grouping, action.columnId));
        clearActiveDrag();
        return;
      default:
        clearActiveDrag();
        return;
    }
  };

  const handleDragCancel = () => {
    clearActiveDrag();
  };

  function getHeaderInsertionMarkerFromPoint(
    activeData: DataTableDndData | null,
    point:
      | Coordinates
      | null
      | undefined,
  ): DataTableHeaderInsertionMarker | null {
    if (
      activeData?.zone !== 'column-header' ||
      !activeData.columnId ||
      !point
    ) {
      return null;
    }

    const targetElement = document.elementFromPoint(point.x, point.y);
    const targetHeaderCell = targetElement?.closest<HTMLElement>(
      '.data-table__header-cell[data-column-id]',
    );

    if (!targetHeaderCell) {
      return null;
    }

    const targetColumnId = targetHeaderCell.getAttribute('data-column-id');

    if (!targetColumnId || targetColumnId === activeData.columnId) {
      return null;
    }

    if (isDataTableAutoGroupColumnId(targetColumnId)) {
      return null;
    }

    return {
      columnId: targetColumnId,
      placement: getDataTableDndReorderPlacementFromPoint(
        {
          clientX: point.x,
          clientY: point.y,
        },
        targetHeaderCell.getBoundingClientRect(),
        'horizontal',
      ),
    };
  }

  function getHeaderInsertionMarkerFromRects(
    activeData: DataTableDndData | null,
    point:
      | Coordinates
      | null
      | undefined,
    overData: DataTableDndData | null,
    overRect:
      | {
          left: number;
          top: number;
          width: number;
          height: number;
        }
      | null
      | undefined,
  ): DataTableHeaderInsertionMarker | null {
    if (
      activeData?.zone !== 'column-header' ||
      overData?.zone !== 'column-header' ||
      !activeData.columnId ||
      !overData.columnId ||
      activeData.columnId === overData.columnId ||
      isDataTableAutoGroupColumnId(overData.columnId)
    ) {
      return null;
    }

    if (!point || !overRect) {
      return null;
    }

    return {
      columnId: overData.columnId,
      placement: getDataTableDndReorderPlacementFromPoint(
        {
          clientX: point.x,
          clientY: point.y,
        },
        overRect,
        'horizontal',
      ),
    };
  }

  if (!shouldEnableDnd) {
    return children;
  }

  return (
    <DataTableDndStateProvider activeDragData={activeDragData}>
      <DataTableHeaderDragPreviewProvider
        isHeaderDragActive={activeDragData?.zone === 'column-header'}
        marker={headerInsertionMarker}
      >
        <DataTableGroupingDragPreviewProvider
          groupingOrder={groupingPreview}
          isGroupingDragActive={activeDragData?.zone === 'grouping-panel'}
        >
          <DndContext
            id={dndId}
            collisionDetection={collisionDetection}
            sensors={sensors}
            onDragMove={handleDragMove}
            onDragOver={handleDragOver}
            onDragCancel={handleDragCancel}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            {children}
          <DataTableDndOverlay
            dragData={activeDragData}
            position={activeDragPosition}
            activeOverData={activeOverData}
            wrapperRef={externalWrapperRef}
            isInvalidDrop={
              activeDragData !== null && (
                isPointerOutsideWrapper ||
                (activeOverData?.zone === 'grouping-panel-drop-zone' &&
                  activeDragData.zone === 'column-header' &&
                  activeDragData.groupable !== true)
              )
            }
          />
        </DndContext>
      </DataTableGroupingDragPreviewProvider>
    </DataTableHeaderDragPreviewProvider>
    </DataTableDndStateProvider>
  );
}
