import * as ScrollArea from '@radix-ui/react-scroll-area';
import type { ReactNode } from 'react';

interface DataTableScrollAreaProps {
  children: ReactNode;
  className?: string;
  viewportClassName?: string;
  viewportRole?: string;
  scrollbars?: 'both' | 'vertical' | 'horizontal';
}

export function DataTableScrollArea({
  children,
  className,
  viewportClassName,
  viewportRole,
  scrollbars = 'both',
}: DataTableScrollAreaProps) {
  return (
    <ScrollArea.Root
      className={
        className
          ? `data-table__scroll-area ${className}`
          : 'data-table__scroll-area'
      }
    >
      <ScrollArea.Viewport
        className={
          viewportClassName
            ? `data-table__scroll-area-viewport ${viewportClassName}`
            : 'data-table__scroll-area-viewport'
        }
        role={viewportRole}
      >
        {children}
      </ScrollArea.Viewport>
      {(scrollbars === 'both' || scrollbars === 'vertical') && (
        <ScrollArea.Scrollbar
          className="data-table__scroll-area-scrollbar"
          orientation="vertical"
        >
          <ScrollArea.Thumb className="data-table__scroll-area-thumb" />
        </ScrollArea.Scrollbar>
      )}
      {(scrollbars === 'both' || scrollbars === 'horizontal') && (
        <ScrollArea.Scrollbar
          className="data-table__scroll-area-scrollbar"
          orientation="horizontal"
        >
          <ScrollArea.Thumb className="data-table__scroll-area-thumb" />
        </ScrollArea.Scrollbar>
      )}
      {scrollbars === 'both' && (
        <ScrollArea.Corner className="data-table__scroll-area-corner" />
      )}
    </ScrollArea.Root>
  );
}
