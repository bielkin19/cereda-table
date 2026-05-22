export type DataTableDndZone =
  | 'column-order'
  | 'column-header'
  | 'grouping-menu'
  | 'grouping-panel'
  | 'grouping-panel-drop-zone';

export type DataTableDndReorderAxis = 'horizontal' | 'vertical';
export type DataTableDndReorderPlacement = 'before' | 'after';

export interface DataTableDndData {
  zone: DataTableDndZone;
  columnId?: string;
  groupable?: boolean;
  label?: string;
}

interface DndDataLike {
  data?: {
    current?: unknown;
  };
}

export const GROUPING_PANEL_DROP_ZONE_ID = 'data-table-grouping-panel-drop-zone';

export function getColumnOrderDndId(columnId: string) {
  return `column-order:${columnId}`;
}

export function getColumnHeaderDndId(columnId: string) {
  return `column-header:${columnId}`;
}

export function getGroupingMenuDndId(columnId: string) {
  return `grouping-menu:${columnId}`;
}

export function getGroupingPanelDndId(columnId: string) {
  return `grouping-panel:${columnId}`;
}

export function createDataTableDndData(
  zone: DataTableDndZone,
  columnId?: string,
  groupable?: boolean,
  label?: string,
): DataTableDndData {
  if (columnId === undefined) {
    if (groupable === undefined && label === undefined) {
      return { zone };
    }

    if (label === undefined) {
      return { zone, groupable };
    }

    if (groupable === undefined) {
      return { zone, label };
    }

    return { zone, groupable, label };
  }

  if (groupable === undefined && label === undefined) {
    return { zone, columnId };
  }

  if (label === undefined) {
    return { zone, columnId, groupable };
  }

  if (groupable === undefined) {
    return { zone, columnId, label };
  }

  return { zone, columnId, groupable, label };
}

export function readDataTableDndData(
  entry: DndDataLike | null | undefined,
): DataTableDndData | undefined {
  const current = entry?.data?.current;

  if (!current || typeof current !== 'object') {
    return undefined;
  }

  const currentData = current as Record<string, unknown>;
  const zone = currentData.zone;
  const columnId = currentData.columnId;
  const groupable = currentData.groupable;
  const label = currentData.label;

  if (typeof zone !== 'string') {
    return undefined;
  }

  if (columnId !== undefined && typeof columnId !== 'string') {
    return undefined;
  }

  if (groupable !== undefined && typeof groupable !== 'boolean') {
    return undefined;
  }

  if (label !== undefined && typeof label !== 'string') {
    return undefined;
  }

  if (!isDataTableDndZone(zone)) {
    return undefined;
  }

  if (columnId === undefined) {
    if (groupable === undefined && label === undefined) {
      return { zone: zone };
    }

    if (label === undefined) {
      return { zone: zone, groupable: groupable };
    }

    if (groupable === undefined) {
      return { zone: zone, label: label };
    }

    return { zone: zone, groupable: groupable, label: label };
  }

  if (groupable === undefined && label === undefined) {
    return { zone: zone, columnId: String(columnId) };
  }

  if (label === undefined) {
    return { zone: zone, columnId: String(columnId), groupable: groupable };
  }

  if (groupable === undefined) {
    return { zone: zone, columnId: String(columnId), label: label };
  }

  return { zone: zone, columnId: String(columnId), groupable: groupable, label: label };
}

export function isDataTableDndZone(zone: string): zone is DataTableDndZone {
  return (
    zone === 'column-order' ||
    zone === 'column-header' ||
    zone === 'grouping-menu' ||
    zone === 'grouping-panel' ||
    zone === 'grouping-panel-drop-zone'
  );
}

export function isGroupingDropTarget(data: DataTableDndData | undefined) {
  return data?.zone === 'grouping-panel' || data?.zone === 'grouping-panel-drop-zone';
}

export function isGroupingDragSource(data: DataTableDndData | undefined) {
  if (!data?.columnId) {
    return false;
  }

  if (data.zone === 'grouping-menu') {
    return true;
  }

  return data.zone === 'column-header' && data.groupable === true;
}

export type DataTableDndDropAction =
  | {
      kind: 'reorder-column';
      activeColumnId: string;
      overColumnId: string;
    }
  | {
      kind: 'reorder-grouping';
      activeColumnId: string;
      overColumnId: string;
    }
  | {
      kind: 'append-grouping';
      columnId: string;
    };

export function resolveDataTableDndDropAction(
  activeData: DataTableDndData | undefined,
  overData: DataTableDndData | undefined,
): DataTableDndDropAction | undefined {
  if (!activeData || !overData) {
    return undefined;
  }

  if (activeData.zone === 'column-order' && overData.zone === 'column-order') {
    if (!activeData.columnId || !overData.columnId || activeData.columnId === overData.columnId) {
      return undefined;
    }

    return {
      kind: 'reorder-column',
      activeColumnId: activeData.columnId,
      overColumnId: overData.columnId,
    };
  }

  if (activeData.zone === 'column-header' && overData.zone === 'column-header') {
    if (!activeData.columnId || !overData.columnId || activeData.columnId === overData.columnId) {
      return undefined;
    }

    return {
      kind: 'reorder-column',
      activeColumnId: activeData.columnId,
      overColumnId: overData.columnId,
    };
  }

  if (activeData.zone === 'grouping-panel') {
    const activeColumnId = activeData.columnId;

    if (!activeColumnId) {
      return undefined;
    }

    if (overData.zone === 'grouping-panel') {
      if (!overData.columnId || activeColumnId === overData.columnId) {
        return undefined;
      }

      return {
        kind: 'reorder-grouping',
        activeColumnId,
        overColumnId: overData.columnId,
      };
    }

    if (overData.zone === 'grouping-panel-drop-zone') {
      return undefined;
    }

    return undefined;
  }

  if (isGroupingDragSource(activeData) && isGroupingDropTarget(overData)) {
    const activeColumnId = activeData.columnId;

    if (!activeColumnId) {
      return undefined;
    }

    return {
      kind: 'append-grouping',
      columnId: activeColumnId,
    };
  }

  if (isGroupingDragSource(activeData) && overData.zone === 'grouping-panel') {
    const activeColumnId = activeData.columnId;

    if (!activeColumnId) {
      return undefined;
    }

    return {
      kind: 'append-grouping',
      columnId: activeColumnId,
    };
  }

  return undefined;
}

interface RectLike {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface PointLike {
  clientX: number;
  clientY: number;
}

export function getDataTableDndReorderPlacementFromPoint(
  point: PointLike | null | undefined,
  overRect: RectLike | null | undefined,
  axis: DataTableDndReorderAxis,
): DataTableDndReorderPlacement {
  if (!point || !overRect) {
    return 'before';
  }

  const pointerCoordinate = axis === 'horizontal' ? point.clientX : point.clientY;
  const overCenter =
    axis === 'horizontal'
      ? overRect.left + overRect.width / 2
      : overRect.top + overRect.height / 2;

  return pointerCoordinate > overCenter ? 'after' : 'before';
}

export function getDataTableDndReorderPlacement(
  activeRect: RectLike | null | undefined,
  overRect: RectLike | null | undefined,
  axis: DataTableDndReorderAxis,
): DataTableDndReorderPlacement {
  if (!activeRect || !overRect) {
    return 'before';
  }

  return getDataTableDndReorderPlacementFromPoint(
    {
      clientX: activeRect.left + activeRect.width / 2,
      clientY: activeRect.top + activeRect.height / 2,
    },
    overRect,
    axis,
  );
}
