import type { Header } from '@tanstack/react-table';
import type { MouseEvent, TouchEvent } from 'react';

import { getColumnSizeStyle } from '../lib/column-sizing';

interface DataTableAutoGroupHeaderCellProps<TData extends object> {
  header: Header<TData, unknown>;
  enableColumnResizing?: boolean;
}

export function DataTableAutoGroupHeaderCell<TData extends object>({
  header,
  enableColumnResizing,
}: DataTableAutoGroupHeaderCellProps<TData>) {
  const isResizing = header.column.getIsResizing();
  const canResize = enableColumnResizing === true && header.column.getCanResize();
  const resizeHandler = header.getResizeHandler();
  const resizeHandleLabel = 'Resize Group column';
  const style = {
    ...getColumnSizeStyle(
      header.getSize(),
      header.column.columnDef.minSize,
      header.column.columnDef.maxSize,
      'Group',
    ),
  };

  function handleResizeStart(event: MouseEvent | TouchEvent) {
    event.preventDefault();
    event.stopPropagation();
    resizeHandler(event);
  }

  return (
    <th
      key={header.id}
      colSpan={header.colSpan}
      className="data-table__th data-table__header-cell"
      style={style}
      data-column-id={header.column.id}
      data-resizing={isResizing || undefined}
    >
      <div className="data-table__header-content">
        <div className="data-table__header-main data-table__header-main--auto-group">
          <div className="data-table__header-control data-table__header-control--static">
            <span className="data-table__header-label">Group</span>
          </div>
          {canResize ? (
            <button
              type="button"
              className={`data-table__column-resize-handle${isResizing ? ' data-table__column-resize-handle--resizing' : ''}`}
              onPointerDownCapture={(e) => e.stopPropagation()}
              onMouseDown={handleResizeStart}
              onTouchStart={handleResizeStart}
              aria-label={resizeHandleLabel}
              title={resizeHandleLabel}
            />
          ) : null}
        </div>
      </div>
    </th>
  );
}
