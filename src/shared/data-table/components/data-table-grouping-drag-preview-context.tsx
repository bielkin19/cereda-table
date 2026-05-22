import type { GroupingState } from '@tanstack/react-table';
import { createContext, type ReactNode, useContext } from 'react';

interface DataTableGroupingDragPreviewContextValue {
  groupingOrder: GroupingState | null;
  isGroupingDragActive: boolean;
}

const DataTableGroupingDragPreviewContext =
  createContext<DataTableGroupingDragPreviewContextValue | null>(null);

interface DataTableGroupingDragPreviewProviderProps {
  groupingOrder: GroupingState | null;
  isGroupingDragActive: boolean;
  children: ReactNode;
}

export function DataTableGroupingDragPreviewProvider({
  groupingOrder,
  isGroupingDragActive,
  children,
}: DataTableGroupingDragPreviewProviderProps) {
  return (
    <DataTableGroupingDragPreviewContext.Provider
      value={{
        groupingOrder,
        isGroupingDragActive,
      }}
    >
      {children}
    </DataTableGroupingDragPreviewContext.Provider>
  );
}

export function useDataTableGroupingDragPreview() {
  return useContext(DataTableGroupingDragPreviewContext);
}
