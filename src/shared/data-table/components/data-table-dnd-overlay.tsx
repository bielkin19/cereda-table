import { DragOverlay } from '@dnd-kit/core';
import { Ban, ListTree, Move } from 'lucide-react';
import React from 'react';
import { createPortal } from 'react-dom';

import type { DataTableDndData } from '../lib/data-table-dnd';
import { isGroupingDragSource } from '../lib/data-table-dnd';

interface Coordinates {
  x: number;
  y: number;
}

interface DataTableDndOverlayProps {
  dragData: DataTableDndData | null;
  position: Coordinates | null;
  isInvalidDrop?: boolean;
  activeOverData?: DataTableDndData | null;
  wrapperRef?: React.RefObject<HTMLDivElement>;
}

interface DataTableDndOverlayPreviewProps {
  dragData: DataTableDndData;
  position: Coordinates;
  isInvalidDrop?: boolean;
  activeOverData?: DataTableDndData | null;
  wrapperRef?: React.RefObject<HTMLDivElement>;
}

function getOverlayIcon(
  dragData: DataTableDndData,
  isInvalidDrop: boolean,
  activeOverData: DataTableDndData | null | undefined,
) {
  if (isInvalidDrop) return Ban;

  const isOverGroupingZone =
    activeOverData?.zone === 'grouping-panel-drop-zone' ||
    activeOverData?.zone === 'grouping-panel';

  if (isOverGroupingZone && isGroupingDragSource(dragData)) return ListTree;

  return Move;
}

function getOverlayLabel(dragData: DataTableDndData) {
  return dragData.label ?? dragData.columnId ?? 'Item';
}

export function DataTableDndOverlay({
  dragData,
  position,
  isInvalidDrop,
  activeOverData,
  wrapperRef,
}: DataTableDndOverlayProps) {
  if (!dragData || !position) {
    return null;
  }

  return (
    <DragOverlay
      adjustScale={false}
      dropAnimation={null}
      style={{ pointerEvents: 'none' }}
    >
      <DataTableDndOverlayPreview
        dragData={dragData}
        position={position}
        isInvalidDrop={isInvalidDrop}
        activeOverData={activeOverData}
        wrapperRef={wrapperRef}
      />
    </DragOverlay>
  );
}

export function DataTableDndOverlayPreview({
  dragData,
  position,
  isInvalidDrop = false,
  activeOverData,
  wrapperRef,
}: DataTableDndOverlayPreviewProps) {
  const label = getOverlayLabel(dragData);
  const Icon = getOverlayIcon(dragData, isInvalidDrop, activeOverData);

  const className = dragData.zone === 'grouping-panel'
    ? 'data-table__dnd-overlay data-table__dnd-overlay--pill'
    : 'data-table__dnd-overlay';

  if (typeof document === 'undefined') {
    return null;
  }

  const portalTarget = wrapperRef?.current ?? document.body;

  return createPortal(
    <div
      className={className}
      aria-hidden="true"
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        transform: 'translate3d(calc(-50% + 12px), calc(-50% - 10px), 0)',
      }}
    >
      <Icon className="data-table__dnd-overlay-icon" aria-hidden="true" />
      <span className="data-table__dnd-overlay-label">{label}</span>
    </div>,
    portalTarget,
  );
}
