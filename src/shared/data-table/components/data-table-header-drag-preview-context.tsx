import { createContext, type ReactNode, useContext } from 'react';

export type DataTableHeaderInsertionPlacement = 'before' | 'after';

export interface DataTableHeaderInsertionMarker {
  columnId: string;
  placement: DataTableHeaderInsertionPlacement;
}

interface DataTableHeaderDragPreviewContextValue {
  isHeaderDragActive: boolean;
  marker: DataTableHeaderInsertionMarker | null;
}

const DataTableHeaderDragPreviewContext =
  createContext<DataTableHeaderDragPreviewContextValue | null>(null);

interface DataTableHeaderDragPreviewProviderProps {
  isHeaderDragActive: boolean;
  marker: DataTableHeaderInsertionMarker | null;
  children: ReactNode;
}

export function DataTableHeaderDragPreviewProvider({
  isHeaderDragActive,
  marker,
  children,
}: DataTableHeaderDragPreviewProviderProps) {
  return (
    <DataTableHeaderDragPreviewContext.Provider
      value={{
        isHeaderDragActive,
        marker,
      }}
    >
      {children}
    </DataTableHeaderDragPreviewContext.Provider>
  );
}

export function useDataTableHeaderDragPreview() {
  return useContext(DataTableHeaderDragPreviewContext);
}
